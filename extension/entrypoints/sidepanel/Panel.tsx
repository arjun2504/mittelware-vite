import { ActionIcon, Badge, Box, Button, Card, Group, Image, Loader, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import EditableText from "./EditableText";

interface RecordingStep {
  type: 'navigate' | 'click' | 'type';
  description: string;
  screenshot?: string;
  // Viewport-relative (0-1) coordinates of the clicked/typed element, used by
  // the web app's review screen to zoom the screenshot in on the right spot.
  point?: { x: number; y: number };
}

interface RecordingSession {
  tabId: number;
  webappTabId: number;
  url: string;
  steps: RecordingStep[];
  startedAt: string;
}

// Height reserved at the top of the scrollable step list so steps don't start
// out hidden under the floating glass header (see the header Box below).
const HEADER_HEIGHT = 52;

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

function Panel() {
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

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

  const steps = session?.steps ?? [];

  const scrollToBottom = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  };

  // Scroll to the newest step whenever one is added. This alone isn't enough
  // though -- scrollHeight is measured before the step's screenshot (a big
  // base64 image) has finished decoding and been laid out, so the container
  // grows *after* this fires and the scroll lands short. Each Image's onLoad
  // below re-triggers this once its real height is known.
  useEffect(() => {
    if (steps.length === 0) return;
    scrollToBottom();
  }, [steps.length]);

  const onStop = () => {
    setIsStopping(true);
    browser.runtime.sendMessage({ action: 'mittelware:recording:stop' });
  };

  const updateStepDescription = async (index: number, description: string) => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession) return;
    const updatedSteps = recordingSession.steps.map((step: RecordingStep, i: number) =>
      i === index ? { ...step, description } : step,
    );
    await browser.storage.local.set({ recordingSession: { ...recordingSession, steps: updatedSteps } });
  };

  const deleteStep = async (index: number) => {
    const { recordingSession } = await browser.storage.local.get('recordingSession');
    if (!recordingSession) return;
    const updatedSteps = recordingSession.steps.filter((_: RecordingStep, i: number) => i !== index);
    await browser.storage.local.set({ recordingSession: { ...recordingSession, steps: updatedSteps } });
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) deleteStep(deleteIndex);
    setDeleteIndex(null);
  };

  return (
    <Box pos="relative" h="100%" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Floats over the scrollable step list (not a flex sibling pushing it
          down) so steps visibly pass underneath the blurred glass surface. */}
      <Box
        pos="absolute"
        top={0}
        left={0}
        right={0}
        px="md"
        py="sm"
        style={{
          zIndex: 10,
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          backgroundColor: 'color-mix(in srgb, var(--mantine-color-dark-7) 72%, transparent)',
          borderBottom: '1px solid var(--mantine-color-dark-4)',
        }}
      >
        <Group gap="xs">
          <Box pos="relative" w={10} h={10}>
            {!isStopping ? (
              <Box
                pos="absolute"
                inset={0}
                style={{
                  borderRadius: '50%',
                  backgroundColor: 'var(--mantine-color-red-6)',
                  animation: 'mittelware-pulse 1.6s ease-in-out infinite',
                }}
              />
            ) : null}
            <Box
              pos="absolute"
              inset={0}
              style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-6)' }}
            />
          </Box>
          <Text size="sm" fw={600} c="red.4">
            {isStopping ? 'Stopping...' : 'Recording...'}
          </Text>
        </Group>
      </Box>

      <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {isStopping ? (
          <Stack flex={1} align="center" justify="center" gap="xs" px="lg" pt={HEADER_HEIGHT} ta="center">
            <Loader size="sm" color="violet" />
            <Text size="sm" c="dimmed">Stopping recording and saving...</Text>
          </Stack>
        ) : steps.length === 0 ? (
          <Stack flex={1} align="center" justify="center" gap="xs" px="lg" pt={HEADER_HEIGHT} ta="center">
            <Badge variant="light" color="red">Listening for events</Badge>
          </Stack>
        ) : (
          <ScrollArea flex={1} viewportRef={viewportRef}>
            <Stack gap="sm" px="md" pt={HEADER_HEIGHT + 12} pb="md">
              {steps.map((step, index) => (
                <Card key={index}>
                  <Stack gap="xs">
                    <Group gap="xs" wrap="nowrap" align="center">
                      <Badge variant="light" color="violet" size="lg" style={{ fontSize: 14, minWidth: 30 }}>
                        {index + 1}
                      </Badge>
                      <EditableText
                        value={step.description}
                        onChange={(description) => updateStepDescription(index, description)}
                      />
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => setDeleteIndex(index)}
                        aria-label="Delete step"
                      >
                        <TrashIcon />
                      </ActionIcon>
                    </Group>
                    {step.screenshot ? (
                      <Image
                        src={step.screenshot}
                        alt={step.description}
                        radius="md"
                        onLoad={scrollToBottom}
                        style={{ border: '1px solid var(--mantine-color-default-border)' }}
                      />
                    ) : null}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Box>

      <Box px="md" py="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Button fullWidth color="red" onClick={onStop} loading={isStopping} disabled={isStopping}>
          Stop
        </Button>
      </Box>

      <Modal
        opened={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        title="Delete step?"
        centered
        size="sm"
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <Text size="sm" c="dimmed">
          {deleteIndex !== null ? `This removes step ${deleteIndex + 1} from the recording. This can't be undone.` : ''}
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setDeleteIndex(null)}>Cancel</Button>
          <Button color="red" onClick={confirmDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}

export default Panel;
