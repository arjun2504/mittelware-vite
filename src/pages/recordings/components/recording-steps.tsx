import { useState } from "react";
import { ActionIcon, Badge, Card, Group, Stack, Text } from "@mantine/core";
import { FaRegTrashCan } from "react-icons/fa6";
import type { RecordingStep } from "@/types/recordings";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import ScreenshotZoomView from "./screenshot-zoom-view";
import EditableText from "./editable-text";

interface RecordingStepsProps {
  steps: RecordingStep[];
  editable?: boolean;
  onStepZoomChange?: (index: number, zoom: number) => void;
  onStepDescriptionChange?: (index: number, description: string) => void;
  onStepDelete?: (index: number) => void;
}

const RecordingSteps = (props: RecordingStepsProps) => {
  const { steps, editable, onStepZoomChange, onStepDescriptionChange, onStepDelete } = props;
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const confirmDelete = () => {
    if (deleteIndex !== null) onStepDelete?.(deleteIndex);
    setDeleteIndex(null);
  };

  return (
    <Stack gap="md">
      {steps.map((step, index) => (
        <Card key={index} withBorder>
          <Stack gap="xs">
            <Group gap="xs" wrap="nowrap" align="center">
              <Badge variant="light" size="lg" style={{ fontSize: 14, minWidth: 30 }}>{index + 1}</Badge>
              {editable && onStepDescriptionChange ? (
                <EditableText
                  value={step.description}
                  onChange={(description) => onStepDescriptionChange(index, description)}
                />
              ) : (
                <Text fw={600} size="sm" style={{ flex: 1 }}>{step.description}</Text>
              )}
              {editable && onStepDelete ? (
                <ActionIcon variant="subtle" color="red" onClick={() => setDeleteIndex(index)} aria-label="Delete step">
                  <FaRegTrashCan size={14} />
                </ActionIcon>
              ) : null}
            </Group>
            {step.screenshot ? (
              <ScreenshotZoomView
                screenshot={step.screenshot}
                alt={step.description}
                point={step.point}
                zoom={step.zoom}
                editable={editable}
                onZoomChange={onStepZoomChange ? (zoom) => onStepZoomChange(index, zoom) : undefined}
              />
            ) : null}
          </Stack>
        </Card>
      ))}

      <ConfirmDialog
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        title="Delete step?"
        message={deleteIndex !== null ? `This removes step ${deleteIndex + 1} from the recording. This can't be undone.` : undefined}
        variant="danger"
        confirmLabel="Yes, delete"
        onConfirm={confirmDelete}
      />
    </Stack>
  );
};

export default RecordingSteps;
