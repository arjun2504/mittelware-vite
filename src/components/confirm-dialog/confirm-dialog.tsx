import { Button, Group, Modal, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { title, message, cancelLabel = 'Cancel', confirmLabel = 'Confirm', onClose, isOpen, onConfirm, children, variant = 'primary' } = props;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={title}
      centered={true}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      onClick={(e) => e.stopPropagation()}
      transitionProps={{ transition: 'slide-down' }}
    >
      {children ? children : <Text>{message}</Text>}
      <Group justify="flex-end" align="center" mt="md">
        <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
        <Button variant="filled" color={variant === 'danger' ? 'red' : 'blue'} onClick={onConfirm}>{confirmLabel}</Button>
      </Group>
    </Modal>
  )
}