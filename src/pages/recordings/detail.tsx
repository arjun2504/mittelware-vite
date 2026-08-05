import { useParams } from "react-router";
import { Breadcrumbs, Text, Stack, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { getRecording } from "@/services/recordings/recordings";
import ExtensionAlert from "@/components/extension-status/extension-alert";
import RecordingSteps from "./components/recording-steps";

const RecordingDetail = () => {
  const { id } = useParams();

  const recordingQuery = useQuery({
    queryFn: () => getRecording(id),
    queryKey: ['recording', id],
    refetchOnWindowFocus: false,
  });

  const recording = recordingQuery.data;

  return (
    <Stack p='lg' gap='sm'>
      <Breadcrumbs separator="/">
        <Text size='sm' c='dimmed'>Recordings</Text>
        <Text size='sm' c='dimmed'>{recording?.name || '...'}</Text>
      </Breadcrumbs>
      <ExtensionAlert />
      <Title order={2}>{recording?.name}</Title>
      {recording ? (
        <RecordingSteps steps={recording.steps} />
      ) : null}
    </Stack>
  );
};

export default RecordingDetail;
