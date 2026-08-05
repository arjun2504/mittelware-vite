import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Breadcrumbs, Text, Stack, Title, TextInput, Button, Group, Card } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useStore, type Store } from "@/store";
import { pingExtension } from "@/services/rules/rules";
import { saveRecording } from "@/services/recordings/recordings";
import { notify } from "@/utils/notification";
import ExtensionAlert from "@/components/extension-status/extension-alert";
import RecordingSteps from "./components/recording-steps";
import type { RecordingStep } from "@/types/recordings";

const clearRecordingDraft = () => {
  window.postMessage({
    source: 'mittelware-intercept-rules',
    type: 'mittelware:recording:draft:clear',
  }, '*');
};

const RecordingReview = () => {
  const { recordingDraft } = useStore() as Store;
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<RecordingStep[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    pingExtension();
  }, []);

  useEffect(() => {
    setSteps(recordingDraft?.steps ?? []);
  }, [recordingDraft]);

  const onStepZoomChange = (index: number, zoom: number) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, zoom } : step)));
  };

  const onStepDescriptionChange = (index: number, description: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, description } : step)));
  };

  const onStepDelete = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: () => saveRecording({
      name: name.trim(),
      url: recordingDraft!.url,
      steps,
    }),
    onSuccess: (data) => {
      clearRecordingDraft();
      notify('Recording saved successfully', true);
      navigate(`/recordings/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed to save recording:', error);
      notify('There was an error while saving this recording', false);
    }
  });

  const onSave = () => {
    if (!name.trim() || !recordingDraft) return;
    saveMutation.mutate();
  };

  return (
    <Stack p='lg' gap='sm'>
      <Breadcrumbs separator="/">
        <Text size='sm' c='dimmed'>Recordings</Text>
        <Text size='sm' c='dimmed'>Review</Text>
      </Breadcrumbs>
      <ExtensionAlert />
      <Title order={2}>Review Recording</Title>
      {!recordingDraft ? (
        <Text c='dimmed'>No recording draft found. Start a new recording from the Recordings list.</Text>
      ) : (
        <>
          <Card>
            <Stack gap="sm">
              <TextInput
                label="Recording Name"
                placeholder='e.g. How to reset your password'
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button onClick={onSave} loading={saveMutation.isPending} disabled={!name.trim()}>
                  Save Recording
                </Button>
              </Group>
            </Stack>
          </Card>
          <RecordingSteps
            steps={steps}
            editable
            onStepZoomChange={onStepZoomChange}
            onStepDescriptionChange={onStepDescriptionChange}
            onStepDelete={onStepDelete}
          />
        </>
      )}
    </Stack>
  );
};

export default RecordingReview;
