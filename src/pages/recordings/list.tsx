import { useNavigate } from "react-router";
import { Group, Stack, Text, Breadcrumbs, Button, Title, Card, Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaVideo } from "react-icons/fa6";
import { DataTable } from 'mantine-datatable';
import { useState } from "react";
import { deleteRecording, getRecordings } from "@/services/recordings/recordings";
import type { Recording } from "@/types/recordings";
import { notify } from "@/utils/notification";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MomentAgo from "@/components/moment-ago/moment-ago";
import ExtensionAlert from "@/components/extension-status/extension-alert";
import { RecordingActions } from "./components/recording-actions";

const DEFAULT_PAGE_SIZE = 50;

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const RecordingsList = () => {
  const [page, setPage] = useState(1);
  const [isRecordModalOpen, recordModalActions] = useDisclosure();
  const [url, setUrl] = useState('https://');
  const [urlError, setUrlError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const recordingsList = useQuery({
    queryFn: () => getRecordings(page, DEFAULT_PAGE_SIZE),
    queryKey: ['recordings', page],
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (id: string) => deleteRecording(id),
    onSuccess: () => {
      notify('Recording deleted successfully', true);
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
    onError: (error) => {
      console.error('Failed to delete recording:', error);
      notify('There was an error while deleting this recording', false);
    }
  });

  const onDelete = (id: string) => {
    deleteRecordingMutation.mutate(id);
  };

  const onOpenRecordModal = () => {
    setUrl('https://');
    setUrlError(null);
    recordModalActions.open();
  };

  const onStartRecording = () => {
    if (!isValidUrl(url)) {
      setUrlError('Enter a valid URL');
      return;
    }
    // Dispatched synchronously (unlike window.postMessage, which always defers to a
    // new task) so the extension's content script receives it within the same user
    // gesture as this click -- required for chrome.sidePanel.open() to succeed.
    document.dispatchEvent(new CustomEvent('mittelware:recording:begin', { detail: url }));
    recordModalActions.close();
    notify('Recording started in a new tab', true);
  };

  const records = (recordingsList.data as any)?.data || [];

  return (
    <Stack p='lg' gap='sm'>
      <Breadcrumbs separator="/">
        <Text size='sm' c='dimmed'>Recordings</Text>
      </Breadcrumbs>
      <ExtensionAlert />
      <Group justify="space-between">
        <Title order={2}>Recordings</Title>
        <Button variant='filled' leftSection={<FaVideo size={12} />} onClick={onOpenRecordModal}>
          Record
        </Button>
      </Group>
      <Modal opened={isRecordModalOpen} onClose={recordModalActions.close} title="Start a new recording" centered>
        <Stack gap="sm">
          <TextInput
            label="Website URL"
            placeholder="https://example.com"
            value={url}
            error={urlError}
            onChange={(event) => { setUrl(event.currentTarget.value); setUrlError(null); }}
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={recordModalActions.close}>Cancel</Button>
            <Button onClick={onStartRecording}>Start Recording</Button>
          </Group>
        </Stack>
      </Modal>
      {records.length === 0 && !recordingsList.isLoading ? (
        <Stack align="center" gap="md" py={80}>
          <Text fw={600} size="md">No recordings yet</Text>
          <Text c="dimmed" size="sm">Click "Record" to capture your first walkthrough</Text>
        </Stack>
      ) : (
        <Card p={0}>
          <DataTable
            withTableBorder={false}
            borderColor="transparent"
            backgroundColor="var(--mantine-color-default)"
            records={records}
            highlightOnHover={true}
            horizontalSpacing='md'
            borderRadius='md'
            verticalSpacing='sm'
            onRowClick={(event) => navigate(`/recordings/${event.record.id}`)}
            pinLastColumn={true}
            rowClassName={() => 'cursor-pointer'}
            totalRecords={(recordingsList.data as any)?.count || 0}
            recordsPerPage={DEFAULT_PAGE_SIZE}
            page={page}
            onPageChange={setPage}
            fetching={recordingsList.isLoading}
            paginationText={({ from, to, totalRecords }) => `${from}-${to} of ${totalRecords}`}
            columns={[
              {
                accessor: 'name',
                title: 'Name',
                ellipsis: true,
                render: (record: Recording) => (
                  <Stack gap={2}>
                    <Text fw={600} size='sm' w={260} truncate='end'>{record.name}</Text>
                    <Text ff='monospace' size='xs' c='dimmed' w={260} truncate='end'>{record.url}</Text>
                  </Stack>
                )
              },
              {
                accessor: 'step_count',
                title: 'Steps',
              },
              {
                accessor: 'updated_at',
                title: 'Last Modified',
                render: (record: Recording) => <MomentAgo datetime={record.updated_at} />
              },
              {
                accessor: 'actions',
                title: 'Actions',
                noWrap: true,
                render: (record: Recording) => (
                  <RecordingActions record={record} onDelete={onDelete} />
                )
              },
            ]}
          />
        </Card>
      )}
    </Stack>
  )
}

export default RecordingsList;
