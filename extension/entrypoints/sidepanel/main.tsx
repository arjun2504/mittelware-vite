import { createRoot } from "react-dom/client";
import "./style.css";
import Panel from "./Panel";

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<Panel />);
