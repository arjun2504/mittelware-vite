import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { theme } from "../../theme";
import "./style.css";
import Panel from "./Panel";

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <MantineProvider forceColorScheme="dark" theme={theme}>
    <Panel />
  </MantineProvider>
);
