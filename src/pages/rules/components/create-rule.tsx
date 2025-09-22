import { Button, Modal, NavLink as MantineNavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaExchangeAlt } from "react-icons/fa";
import { FaPencil, FaPlus } from "react-icons/fa6";
import { LuHeading } from "react-icons/lu";
import { MdBlock } from "react-icons/md";
import { NavLink } from "react-router";

export function CreateRule() {
  const [opened, { open, close }] = useDisclosure();

  return (
    <>
      <Button variant='gradient' leftSection={<FaPlus />} onClick={open}>Create New Rule</Button>
      <Modal
        title='Create a new rule'
        onClose={close}
        opened={opened}
        centered={true}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        transitionProps={{ transition: 'slide-down' }}
      >
        <MantineNavLink
          component={NavLink}
          to="/rules/block/create"
          label="Block URLs"
          description="Cancel any request URLs"
          leftSection={<MdBlock />}
          variant="filled"
          onClick={close}
        />
        <MantineNavLink
          component={NavLink}
          to="/rules/redirect/create"
          label="Redirect"
          description="Redirect to another URL"
          leftSection={<FaExchangeAlt />}
          variant="filled"
          onClick={close}
        />
        <MantineNavLink
          component={NavLink}
          to="/rules/modify-headers/create"
          label="Header Modification"
          description="Modify Request/Response headers"
          leftSection={<LuHeading />}
          variant="filled"
          onClick={close}
        />
        <MantineNavLink
          component={NavLink}
          to="/rules/modify-response/create"
          label="Modify Response"
          description="Modify API response"
          leftSection={<FaPencil />}
          variant="filled"
          onClick={close}
        />
      </Modal>
    </>
  )
}