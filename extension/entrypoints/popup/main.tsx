import { createRoot } from "react-dom/client";
import { MantineProvider, Box, Badge, Button, Group, Image, Stack, Switch, Text } from "@mantine/core";
import "@mantine/core/styles.css";
import { theme } from "../../theme";
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

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rulesEnabled = event.currentTarget.checked;
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
    <Box
      w={320}
      m={4}
      bg="var(--mantine-color-body)"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: 'var(--mantine-shadow-lg)',
        overflow: 'hidden',
      }}
    >
      <Group px="md" py="sm" gap="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Image src="/mittelware-logo.png" alt="Mittelware Logo" h={20} w="auto" fit="contain" />
        <Text size="sm" fw={600}>Intercept</Text>
        <Text size="xs" c="dimmed">by Mittelware</Text>
      </Group>

      <Stack px="md" py="md" gap="md">
        <Group justify="space-between">
          <Badge
            variant="light"
            color={isRuleEnabled ? 'teal' : 'gray'}
            leftSection={
              <Box
                w={6}
                h={6}
                style={{ borderRadius: '50%', backgroundColor: isRuleEnabled ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-5)' }}
              />
            }
          >
            {isRuleEnabled ? 'Running' : 'Paused'}
          </Badge>
          <Switch checked={isRuleEnabled} onChange={onChange} color="violet" />
        </Group>

        <Button component="a" href={import.meta.env.VITE_HOST_URL} target="_blank">
          Configure Rules
        </Button>
      </Stack>
    </Box>
  );
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <MantineProvider forceColorScheme="dark" theme={theme}>
    <Popup />
  </MantineProvider>
);
