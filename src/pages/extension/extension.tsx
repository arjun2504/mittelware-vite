import { useStore, type Store } from "@/store";
import { Button, Container, Group, Text, Title } from "@mantine/core";
import { FaCheck, FaCircleCheck } from "react-icons/fa6";
import { Link } from "react-router";

const Extension = () => {
  const { isExtensionConnected, settings } = useStore() as Store;

  const ExtensionReady = () => 
  (
    <>
      <Group>
        <FaCircleCheck size="30px" color="green" />
        <Title order={1} className="text-8xl font-extrabold">
          Yay! Extension is connected.
        </Title>
      </Group>
      <Text color="dimmed" className="!leading-8" fw="lighter" size="lg">
        Mittelware Intercept is successfully connected to the browser extension. You can now start creating and managing your network request rules.
      </Text>

      <Group>
        <Button
          variant="gradient"
          leftSection={<FaCheck />}
          className="shadow-stone-300 shadow-md pointer-events-none opacity-40"
          size="lg"
          color="green"
        >
          Added to Chrome
        </Button>
      </Group>
    </>
  );

  const ExtensionNotFound = () => (
    <>
      <Title order={1} className="text-8xl font-extrabold">
        Install Browser extension to get started.
      </Title>

      <Text color="dimmed" className="!leading-8" fw="lighter" size="lg">
        Mittelware Intercept is available as a browser extension. Click the button below to install the extension for your browser. After installation, you can start creating and managing your network request rules.
      </Text>

      <Group>
        <Link target="_blank" to="https://chrome.google.com/webstore/detail/mittelware-intercept/">
          <Button
            variant="gradient"
            leftSection={<img src="/chrome.png" height={30} width={30} />}
            className="shadow-stone-300 shadow-md hover:scale-125 transition-all hover:-skew-y-1"
            size="lg"
          >
            Add to Chrome
          </Button>
        </Link>
      </Group>
    </>
  );

  const ExtensionPaused = () => (
    <>
      <Title order={1} className="text-8xl font-extrabold">
        Extension Paused
      </Title>

      <Text color="dimmed" className="!leading-8" fw="lighter" size="lg">
        Paused
      </Text>

      <Group>
        <Link target="_blank" to="https://chrome.google.com/webstore/detail/mittelware-intercept/">
          <Button
            variant="gradient"
            leftSection={<img src="/chrome.png" height={30} width={30} />}
            className="shadow-stone-300 shadow-md hover:scale-125 transition-all hover:-skew-y-1"
            size="lg"
          >
            Resume
          </Button>
        </Link>
      </Group>
    </>
  );

  const renderExtensionStatus = () => {
    if (isExtensionConnected) {
      return settings.isPaused ? <ExtensionPaused /> : <ExtensionReady />
    } else if (!isExtensionConnected) {
      return <ExtensionNotFound />
    }
  }

  return (
    <Container className="flex flex-col items-center">
      <div className='w-[80%] flex flex-col gap-6 justify-center items-center min-h-[calc(100vh-120px)] text-center'>
        {renderExtensionStatus()}
      </div>
    </Container>
  )
};

export default Extension;
