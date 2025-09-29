import { Alert } from "@mantine/core";
import { FaPlay } from "react-icons/fa6";

const ExtensionPausedAlert = () => {
  return (
    <Alert title="Resume Extension to Execute Rules" icon={<FaPlay />} color="yellow" variant="light">
      You will still be able to add or update the rules, but the extension needs to be resumed to execute them. To resume, click the puzzle-piece icon in your browser's toolbar (the Extensions menu), select this extension, and switch it back on.
    </Alert>
  )
};

export default ExtensionPausedAlert;
