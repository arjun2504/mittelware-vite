interface RecordingStep {
  type: 'navigate' | 'click' | 'type';
  description: string;
  screenshot?: string;
}

interface RecordingSession {
  tabId: number;
  webappTabId: number;
  url: string;
  steps: RecordingStep[];
  startedAt: string;
}

function Panel() {
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  const load = async () => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    setSession(recordingSession ?? null);
  };

  useEffect(() => {
    load();

    const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area !== 'local' || !changes.recordingSession) return;
      setSession((changes.recordingSession.newValue as RecordingSession) ?? null);
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  }, []);

  const onStop = () => {
    setIsStopping(true);
    browser.runtime.sendMessage({ action: 'mittelware:recording:stop' });
  };

  const steps = session?.steps ?? [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <img src="/mittelware-logo.png" alt="Mittelware Logo" className="h-5 w-auto" />
        <span className="text-sm font-semibold">Intercept</span>
      </div>

      {isStopping ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="h-5 w-5 rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-violet-600 animate-spin" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Stopping recording and saving...</span>
        </div>
      ) : steps.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="flex items-center gap-2 text-base font-semibold text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Listening for events.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {index + 1}. {step.description}
              </span>
              {step.screenshot ? (
                <img
                  src={step.screenshot}
                  alt={step.description}
                  className="w-full rounded-md border border-neutral-200 dark:border-neutral-800"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onStop}
          disabled={isStopping}
          className="w-full rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed py-2 px-4 text-sm font-medium text-white transition-colors"
        >
          {isStopping ? 'Stopping...' : 'Stop'}
        </button>
      </div>
    </div>
  );
}

export default Panel;
