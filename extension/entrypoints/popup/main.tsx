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
    <div className="flex justify-between items-center border p-3 bg-sky-50 rounded shadow-md w-72 border-neutral-300 m-1">
      <div className="flex items-center justify-center gap-2 -ml-1">
        <img src="/mittelware-logo.png" alt="Mittelware Logo" className="h-6 w-auto" />
        <p className="p-0 font-medium text-neutral-400 text-sm">Intercept</p>
      </div>
      <div>
        <input checked={isRuleEnabled} type="checkbox" id="switch" name="some-switch" onChange={onChange} />
        <label htmlFor="switch"></label>
      </div>
    </div>
  );
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<Popup />);