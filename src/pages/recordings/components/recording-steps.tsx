import { Stack, Text, Image } from "@mantine/core";
import type { RecordingStep } from "@/types/recordings";

interface RecordingStepsProps {
  steps: RecordingStep[];
}

const RecordingSteps = (props: RecordingStepsProps) => {
  const { steps } = props;

  return (
    <Stack gap="lg">
      {steps.map((step, index) => (
        <Stack key={index} gap="xs">
          <Text fw={600} size="sm">{index + 1}. {step.description}</Text>
          {step.screenshot ? (
            <Image
              src={step.screenshot}
              alt={step.description}
              radius="md"
              style={{ border: '1px solid var(--mantine-color-default-border)' }}
            />
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
};

export default RecordingSteps;
