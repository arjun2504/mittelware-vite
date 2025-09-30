import { useStore, type Store } from "@/store";
import { Alert, Button, Stack } from "@mantine/core";
import { FaPlay } from "react-icons/fa6";
import { Link } from "react-router";
import { IoExtensionPuzzle } from "react-icons/io5";


const ExtensionAlert = () => {
  const { isExtensionConnected, settings } = useStore() as Store;

  if (!isExtensionConnected) {
    return (
      <Alert title="Install Extension" icon={<IoExtensionPuzzle className="h-10 w-10" />} color="red" variant="light">
        <Stack>
          <p>To execute the rules you've added, you'll need to install <span className="font-bold">Intercept by Mittelware</span> from the store. This extension enables the rules to actively monitor and intercept your network requests.</p>
          <Link target="_blank" to="https://chromewebstore.google.com/detail/phflkedcmcidnndahgchpfmbnpjplicf/">
            <Button
              variant="light"
              leftSection={<img src="/chrome.png" height={30} width={30} />}
              className="!bg-red-400 hover:w-2.5"
              size="sm"
              color="white"
            >
              Add to Chrome
            </Button>
          </Link>
        </Stack>
      </Alert>
    );
  }

  if (settings.isPaused) {
    return (
      <Alert title="Resume Extension to Execute Rules" icon={<FaPlay />} color="yellow" variant="light">
        You will still be able to add or update the rules, but the extension needs to be resumed to execute them. To resume, click the puzzle-piece icon in your browser's toolbar (the Extensions menu), select this extension, and switch it back on.
      </Alert>
    );
  }
};

export default ExtensionAlert;
