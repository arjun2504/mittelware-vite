import { createRoot } from "react-dom/client";
import "./style.css";

function Popup() {
  const [isRuleEnabled, setIsRuleEnabled] = useState(false);

  const initialize = async () => {
    const { settings } = await browser.storage.local.get('settings');
    setIsRuleEnabled(!settings.isPaused);
  }

  useEffect(() => {
    initialize();
  }, []);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rulesEnabled = e.target.checked;
    setIsRuleEnabled(rulesEnabled);
    const { settings } = await browser.storage.local.get('settings');
    const updatedSettings = {
      ...settings,
      isPaused: !rulesEnabled
    }
    await browser.storage.local.set({
      settings: updatedSettings
    });
    browser.runtime.sendMessage({ action: "mittelware:rules:sync:pause" });
  }

  return (
    <div className="w-80 m-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <img src="/mittelware-logo.png" alt="Mittelware Logo" className="h-5 w-auto" />
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Intercept</span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">by Mittelware</span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isRuleEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isRuleEnabled ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            {isRuleEnabled ? 'Running' : 'Paused'}
          </span>
          <div className="flex">
            <input checked={isRuleEnabled} type="checkbox" id="switch" name="some-switch" onChange={onChange} />
            <label htmlFor="switch"></label>
          </div>
        </div>

        <a
          href={import.meta.env.VITE_HOST_URL}
          target="_blank"
          className="flex items-center justify-center gap-1.5 rounded-md bg-violet-600 hover:bg-violet-700 py-2 px-4 text-sm font-medium text-white transition-colors"
        >
          Configure Rules
        </a>
      </div>
    </div>
  );
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<Popup />);
