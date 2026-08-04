import { ActionIcon, Group, Menu } from "@mantine/core";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaEllipsisV, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useDisclosure } from "@mantine/hooks";
import type { Recording } from "@/types/recordings";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";

interface RecordingActionsProps {
  record: Recording;
  onDelete: (id: string) => void;
}

export function RecordingActions(props: RecordingActionsProps) {
  const { record, onDelete } = props;
  const [isDeleteConfirmOpen, isDeleteConfirmAction] = useDisclosure();
  const navigate = useNavigate();

  const onDeleteRecord = () => {
    isDeleteConfirmAction.close();
    onDelete(record.id as string);
  };

  return (
    <Group wrap="nowrap">
      <Menu withinPortal position="bottom-end" shadow="md" withArrow>
        <Menu.Target>
          <ActionIcon variant="transparent" color="gray" onClick={(e) => e.stopPropagation()}>
            <FaEllipsisV />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<FaEye />} onClick={() => navigate(`/recordings/${record.id}`)}>
            View
          </Menu.Item>
          <Menu.Item leftSection={<FaRegTrashCan />} color="red" onClick={(e) => { e.stopPropagation(); isDeleteConfirmAction.open(); }}>
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={isDeleteConfirmAction.close}
        title="Confirm Delete"
        message="Are you sure you want to delete this recording?"
        variant="danger"
        confirmLabel="Yes, delete"
        onConfirm={onDeleteRecord}
      />
    </Group>
  );
}
