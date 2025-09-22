import { ActionIcon, Group, Switch, TextInput, Menu } from "@mantine/core";
import { FaPencil, FaRegCopy, FaRegTrashCan } from "react-icons/fa6";
import { FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router";
import type { Rule } from "@/types/rules";
import { ConfirmDialog } from "../confirm-dialog/confirm-dialog";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { cloneRule } from "@/services/rules/rules";
import { notify } from "@/utils/notification";

interface TableActionsProps {
  record: Rule;
  onToggle: (recordId: number, value: boolean) => void;
  onDelete: (recordId: number) => void;
}

export function TableActions(props: TableActionsProps) {
  const { record, onToggle, onDelete } = props;
  const [isMakeCopyOpen, isMakeCopyAction] = useDisclosure();
  const [isDeleteConfirmOpen, isDeleteConfirmAction] = useDisclosure();
  const [copyName, setCopyName] = useState('');
  const navigate = useNavigate();

  const onOpenMakeCopy = () => {
    setCopyName(`Copy of ${record.name}`);
    isMakeCopyAction.open();
  }

  const onCopyRecord = async () => {
    if (copyName.trim() !== '') {
      try {
        const data = await cloneRule(record, copyName);
        notify('Successfully created a copy of the rule', true);
        isMakeCopyAction.close();
        navigate(`/rules/${data.type}/${data.id}`);
      } catch (error) {
        console.error('Failed to clone rule:', error);
        notify('Failed to make a copy of the rule', false);
      }
    }
  }

  const onDeleteRecord = () => {
    isDeleteConfirmAction.close();
    onDelete(record.id as number);
  }

  return (
    <Group wrap="nowrap">
      <div
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Switch
          defaultChecked={record.is_enabled}
          size='xs'
          className='!cursor-pointer'
          onChange={() => onToggle(record.id as number, record.is_enabled)}
          withThumbIndicator={false}
        />
      </div>
      <Menu withinPortal position="bottom-end" shadow="md" withArrow>
        <Menu.Target>
          <ActionIcon variant="transparent" color="gray" onClick={e => e.stopPropagation()}>
            <FaEllipsisV />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<FaPencil />} onClick={() => navigate(`/rules/${record.type}/${record.id}`)}>
            Edit
          </Menu.Item>
          <Menu.Item leftSection={<FaRegCopy />} onClick={e => { e.stopPropagation(); onOpenMakeCopy(); }}>
            Make a copy
          </Menu.Item>
          <Menu.Item leftSection={<FaRegTrashCan />} color="red" onClick={e => { e.stopPropagation(); isDeleteConfirmAction.open(); }}>
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={isDeleteConfirmAction.close}
        title='Confirm Delete'
        message='Are you sure you want to delete the rule?'
        variant="danger"
        confirmLabel="Yes, delete"
        onConfirm={onDeleteRecord}
      />
      <ConfirmDialog
        isOpen={isMakeCopyOpen}
        onClose={isMakeCopyAction.close}
        title='Make a copy'
        confirmLabel="Create a copy"
        onConfirm={onCopyRecord}
      >
        <TextInput
          label="Rule Name"
          defaultValue={`Copy of ${record.name}`}
          onChange={(event) => setCopyName(event.currentTarget.value)}
        />
      </ConfirmDialog>
    </Group>
  );
}