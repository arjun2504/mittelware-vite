import type { Browser } from 'wxt/browser';

type InterceptType = 'block' | 'redirect' | 'modify-headers' | 'modify-response';
type ResourceCategory = 'all' | 'fetch-xhr' | 'doc' | 'css' | 'js' | 'font' | 'img' | 'media' | 'ws' | 'other';
type DetailTab = 'general' | 'request-headers' | 'response-headers' | 'response';

interface CapturedRequest {
  id: string;
  method: string;
  url: string;
  status: number;
  mimeType: string;
  category: ResourceCategory;
  requestHeaders: { name: string; value: string }[];
  responseHeaders: { name: string; value: string }[];
  harEntry: Browser.devtools.network.Request;
}

interface ResponseBodyState {
  loading: boolean;
  content: string;
  encoding: string;
}

const INTERCEPT_TYPES: { type: InterceptType; label: string }[] = [
  { type: 'block', label: 'Block URL' },
  { type: 'redirect', label: 'Redirect' },
  { type: 'modify-headers', label: 'Modify Headers' },
  { type: 'modify-response', label: 'Modify Response' },
];

const FILTERS: { value: ResourceCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fetch-xhr', label: 'Fetch/XHR' },
  { value: 'doc', label: 'Doc' },
  { value: 'css', label: 'CSS' },
  { value: 'js', label: 'JS' },
  { value: 'font', label: 'Font' },
  { value: 'img', label: 'Img' },
  { value: 'media', label: 'Media' },
  { value: 'ws', label: 'WS' },
  { value: 'other', label: 'Other' },
];

const DETAIL_TABS: { value: DetailTab; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'request-headers', label: 'Request Headers' },
  { value: 'response-headers', label: 'Response Headers' },
  { value: 'response', label: 'Response' },
];

const MAX_REQUESTS = 300;
const MAX_RESPONSE_BODY_LENGTH = 20000;
const MIN_PANE_WIDTH = 340;
const MIN_LIST_WIDTH = 260;

const RESPONSE_TYPE_ALIASES: Record<string, string> = {
  'application/javascript': 'text/javascript',
  'application/x-javascript': 'text/javascript',
  'text/xml': 'application/xml',
};

const KNOWN_RESPONSE_TYPES = new Set([
  'application/json',
  'application/xml',
  'text/css',
  'text/javascript',
  'text/html',
  'text/plain',
]);

// Matches the extension's mimeType (which may include "; charset=...") to one of the
// exact values the web app's "Response Type" select expects, falling back to text/plain.
const normalizeResponseType = (mimeType: string) => {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  const aliased = RESPONSE_TYPE_ALIASES[base] || base;
  if (KNOWN_RESPONSE_TYPES.has(aliased)) return aliased;

  // Vendor/structured-syntax subtypes (RFC 6839), e.g. application/vnd.pgrst.object+json,
  // application/vnd.api+json, application/ld+json, application/hal+xml, etc.
  if (aliased.endsWith('+json')) return 'application/json';
  if (aliased.endsWith('+xml')) return 'application/xml';

  return 'text/plain';
};

const prettifyResponseBody = (mimeType: string, body: string) => {
  if (mimeType === 'application/json') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
};

const getResourceCategory = (resourceType: string | undefined): ResourceCategory => {
  switch (resourceType) {
    case 'xhr':
    case 'fetch':
      return 'fetch-xhr';
    case 'document':
      return 'doc';
    case 'stylesheet':
      return 'css';
    case 'script':
      return 'js';
    case 'font':
      return 'font';
    case 'image':
      return 'img';
    case 'media':
      return 'media';
    case 'websocket':
      return 'ws';
    default:
      return 'other';
  }
};

// UTF-8 safe base64 encoding, decoded by the web app on the other end.
const encodeUnicodeBase64 = (str: string) =>
  btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))));

// Suggests a rule name from the captured request, e.g. "GET /users" or "POST example.com".
const buildRuleName = (method: string, url: string) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : parsed.hostname;
    return `${method} ${path}`;
  } catch {
    return `${method} ${url}`;
  }
};

function Panel() {
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ResourceCategory>('all');
  const [preserveLog, setPreserveLog] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('general');
  const [paneWidth, setPaneWidth] = useState(() => Math.round(window.innerWidth / 3));
  const [responseBodies, setResponseBodies] = useState<Record<string, ResponseBodyState>>({});

  const listEndRef = useRef<HTMLDivElement>(null);
  const preserveLogRef = useRef(preserveLog);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    preserveLogRef.current = preserveLog;
  }, [preserveLog]);

  useEffect(() => {
    const onRequestFinished = (harEntry: Browser.devtools.network.Request) => {
      const resourceType = (harEntry as unknown as { _resourceType?: string })._resourceType;
      const entry: CapturedRequest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        method: harEntry.request.method,
        url: harEntry.request.url,
        status: harEntry.response.status,
        mimeType: normalizeResponseType(harEntry.response.content?.mimeType || 'text/plain'),
        category: getResourceCategory(resourceType),
        requestHeaders: harEntry.request.headers || [],
        responseHeaders: harEntry.response.headers || [],
        harEntry,
      };
      setRequests((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_REQUESTS ? next.slice(next.length - MAX_REQUESTS) : next;
      });
    };

    const onNavigated = () => {
      if (preserveLogRef.current) return;
      setRequests([]);
      setSelectedRequestId(null);
    };

    browser.devtools.network.onRequestFinished.addListener(onRequestFinished);
    browser.devtools.network.onNavigated.addListener(onNavigated);

    return () => {
      browser.devtools.network.onRequestFinished.removeListener(onRequestFinished);
      browser.devtools.network.onNavigated.removeListener(onNavigated);
    };
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [requests.length]);

  useEffect(() => {
    setShowTypeMenu(false);
    setActiveDetailTab('general');
  }, [selectedRequestId]);

  useEffect(() => {
    if (activeDetailTab !== 'response') return;
    const request = requests.find((r) => r.id === selectedRequestId);
    if (!request || responseBodies[request.id]) return;

    setResponseBodies((prev) => ({ ...prev, [request.id]: { loading: true, content: '', encoding: '' } }));
    request.harEntry.getContent((content, encoding) => {
      setResponseBodies((prev) => ({ ...prev, [request.id]: { loading: false, content: content || '', encoding: encoding || '' } }));
    });
  }, [activeDetailTab, selectedRequestId]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - event.clientX;
      const maxWidth = window.innerWidth - MIN_LIST_WIDTH;
      setPaneWidth(Math.min(Math.max(newWidth, MIN_PANE_WIDTH), Math.max(maxWidth, MIN_PANE_WIDTH)));
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onDividerMouseDown = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const visibleRequests = activeFilter === 'all'
    ? requests
    : requests.filter((request) => request.category === activeFilter);

  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? null;

  const openCreateTab = (payload: Record<string, unknown>) => {
    const url = new URL('/rules/create', import.meta.env.VITE_HOST_URL);
    url.searchParams.set('prefill', encodeUnicodeBase64(JSON.stringify(payload)));
    browser.tabs.create({ url: url.toString() });
  };

  const onSelectType = (request: CapturedRequest, type: InterceptType) => {
    setShowTypeMenu(false);
    const base = {
      name: buildRuleName(request.method, request.url),
      url_pattern: request.url,
      advanced_filters: { methods: [request.method.toLowerCase()] },
    };

    if (type === 'block') {
      openCreateTab({ ...base, type, config: {} });
      return;
    }

    if (type === 'redirect') {
      openCreateTab({ ...base, type, config: { destination_url: '' } });
      return;
    }

    if (type === 'modify-headers') {
      const toEntries = (headers: { name: string; value: string }[]) =>
        headers.map((header) => ({
          id: `${header.name}-${Math.random().toString(36).slice(2)}`,
          action: 'set' as const,
          key: header.name,
          value: header.value,
        }));
      openCreateTab({
        ...base,
        type,
        config: {
          request: toEntries(request.requestHeaders),
          response: toEntries(request.responseHeaders),
        },
      });
      return;
    }

    request.harEntry.getContent((content) => {
      const prettyBody = prettifyResponseBody(request.mimeType, content || '');
      openCreateTab({
        ...base,
        type,
        config: {
          response_type: request.mimeType,
          response: prettyBody.slice(0, MAX_RESPONSE_BODY_LENGTH),
        },
      });
    });
  };

  const renderHeaderList = (headers: { name: string; value: string }[]) =>
    headers.length === 0 ? (
      <div className="text-neutral-400">None</div>
    ) : (
      headers.map((header, index) => (
        <div key={`${header.name}-${index}`} className="mb-0.5 break-all font-mono">
          <span className="text-neutral-400">{header.name}:</span> {header.value}
        </div>
      ))
    );

  const renderResponseBody = (entry: ResponseBodyState | undefined) => {
    if (!entry || entry.loading) {
      return <div className="text-neutral-400">Loading...</div>;
    }
    if (entry.encoding === 'base64') {
      return <div className="text-neutral-400">Binary response body (base64-encoded) &mdash; not shown</div>;
    }
    return (
      <pre className="whitespace-pre-wrap break-all font-mono">
        {entry.content || '(empty response body)'}
      </pre>
    );
  };

  return (
    <div className="flex h-screen flex-col text-neutral-800 dark:text-neutral-100">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 text-xs">
        <span className="text-sm font-semibold">Intercept</span>
        <div className="flex items-center gap-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded px-2 py-1 ${
                activeFilter === filter.value
                  ? 'bg-violet-600 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-neutral-500">
          <input
            type="checkbox"
            checked={preserveLog}
            onChange={(event) => setPreserveLog(event.currentTarget.checked)}
          />
          Preserve log
        </label>
        <button
          onClick={() => {
            setRequests([]);
            setSelectedRequestId(null);
          }}
          className="ml-auto rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Clear Logs
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {visibleRequests.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              {requests.length === 0
                ? 'Reload the page to start capturing requests'
                : 'No requests match this filter'}
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 uppercase text-neutral-500">
                <tr>
                  <th className="w-24 px-3 py-2 font-medium">Method</th>
                  <th className="px-3 py-2 font-medium">URL</th>
                  <th className="w-20 px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`cursor-pointer border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 ${
                      selectedRequestId === request.id ? 'bg-violet-50 dark:bg-violet-950/40' : ''
                    }`}
                  >
                    <td className="truncate px-3 py-1.5 font-mono">{request.method}</td>
                    <td className="truncate px-3 py-1.5 font-mono" title={request.url}>
                      {request.url}
                    </td>
                    <td className="truncate px-3 py-1.5 font-mono">{request.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div ref={listEndRef} />
        </div>

        {selectedRequest ? (
          <>
            <div
              onMouseDown={onDividerMouseDown}
              className="w-1 shrink-0 cursor-col-resize bg-neutral-200 hover:bg-violet-400 dark:bg-neutral-800"
            />
            <div className="flex shrink-0 flex-col border-l border-neutral-200 dark:border-neutral-800" style={{ width: paneWidth }}>
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3 py-2">
                <span className="text-xs font-semibold">Request Details</span>
                <button
                  onClick={() => setSelectedRequestId(null)}
                  className="rounded px-1.5 py-0.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  &#10005;
                </button>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-800 p-3">
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowTypeMenu((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700"
                  >
                    Create Rule
                    <span>&#9662;</span>
                  </button>
                  {showTypeMenu ? (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTypeMenu(false)} />
                      <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
                        {INTERCEPT_TYPES.map((option) => (
                          <button
                            key={option.type}
                            onClick={() => onSelectType(selectedRequest, option.type)}
                            className="block w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs">
                {DETAIL_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveDetailTab(tab.value)}
                    className={`px-3 py-2 font-medium ${
                      activeDetailTab === tab.value
                        ? 'border-b-2 border-violet-600 text-violet-600'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 text-xs">
                {activeDetailTab === 'general' ? (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="shrink-0 text-neutral-400">Method</span>
                      <span className="font-mono">{selectedRequest.method}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="shrink-0 text-neutral-400">URL</span>
                      <span className="break-all font-mono">{selectedRequest.url}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="shrink-0 text-neutral-400">Status</span>
                      <span className="font-mono">{selectedRequest.status || '-'}</span>
                    </div>
                  </div>
                ) : activeDetailTab === 'request-headers' ? (
                  renderHeaderList(selectedRequest.requestHeaders)
                ) : activeDetailTab === 'response-headers' ? (
                  renderHeaderList(selectedRequest.responseHeaders)
                ) : (
                  renderResponseBody(responseBodies[selectedRequest.id])
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default Panel;
