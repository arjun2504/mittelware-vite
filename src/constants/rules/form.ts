export const RESOURCE_TYPES = [
  { label: 'Document', value: 'main_frame' },
  { label: 'IFrame Document', value: 'sub_frame' },
  { label: 'XHR', value: 'xmlhttprequest' },
  { label: 'Script', value: 'script' },
  { label: 'Image', value: 'image' },
  { label: 'Media', value: 'media' },
  { label: 'Font', value: 'font' },
  { label: 'Stylesheet', value: 'stylesheet' },
  { label: 'Websocket', value: 'websocket' },
  { label: 'Object', value: 'object' },
  { label: 'Ping', value: 'ping' },
  { label: 'CSP Report', value: 'csp_report' },
  { label: 'Webtransport', value: 'webtransport' },
  { label: 'Web bundle (.wbn)', value: 'webbundle' },
];

export const REQUEST_METHODS = [
  { label: 'GET', value: 'get' },
  { label: 'POST', value: 'post'},
  { label: 'PUT', value: 'put'},
  { label: 'DELETE', value: 'delete'},
  { label: 'PATCH', value: 'patch'},
  { label: 'OPTIONS', value: 'options'},
  { label: 'HEAD', value: 'head'},
  { label: 'CONNECT', value: 'connect'},
];

export const MODIFY_HEADER_TABS = [
  { label: 'Request Headers', value: 'request' },
  { label: 'Response Headers', value: 'response' },
];

export const MODIFY_HEADER_ACTIONS = [
  { label: 'Set', value: 'set' },
  { label: 'Remove', value: 'remove' },
];

export const MODIFY_HEADER_KEYS = [
  'a-im','accept','accept-ch','accept-ch-lifetime','accept-charset','accept-datetime','accept-encoding','accept-language','accept-patch','accept-ranges',
  'access-control-request-headers','access-control-request-method','authorization','cache-control','connection','content-dpr','content-encoding','content-length','content-md5',
  'content-type','cookie','device-memory','dnt','dpr','date','downlink','expect','forwarded',
  'from','front-end-https','http2-setting','host','if-match','if-modified-since','if-none-match','if-range','if-unmodified-since',
  'max-forwards','origin','partial-data','pragma','proxy-authorization','proxy-connection','range','referer','save-data',
  'te','trailer','transfer-encoding','upgrade','upgrade-insecure-requests','user-agent','via','viewport-width','warning',
  'width','x-att-deviceid','x-correlation-id','x-csrf-token','x-forwarded-for','x-forwarded-host','x-forwarded-proto','x-http-method-override',
  'x-request-id','x-uidh','x-wap-profile'
];

export const MODIFY_RESPONSE_TYPES = [
  { label: 'JSON', value: 'application/json' },
  { label: 'XML', value: 'application/xml' },
  { label: 'CSS', value: 'text/css' },
  { label: 'Javascript', value: 'text/javascript' },
  { label: 'HTML', value: 'text/html' },
  { label: 'Plain Text', value: 'text/plain' }
];

const DEFAULT_ADVANCED_FILTERS = {
  methods: ['get'],
  resource_types: ['main_frame', 'xmlhttprequest'],
  initiator_domain: ''
};

const DEFAULT_META = {
  name: '',
  description: '',
  url_pattern: '',
  config: {},
  advanced_filters: DEFAULT_ADVANCED_FILTERS,
  is_enabled: true,
  id: 'create',
  type: 'block'
};

export const DEFAULT_RULES = {
  block: DEFAULT_META,
  redirect: { ...DEFAULT_META, config: { destination_url: '' } },
  ['modify-headers']: { ...DEFAULT_META, config: {
    request: [], response: []
  } },
  ['modify-response']: { ...DEFAULT_META, config: {
    response_type: 'application/json',
    response: '{}'
  } }
};
