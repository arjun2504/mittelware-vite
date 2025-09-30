import { AppShell, Image, Group, Text, Container, Stack, NavLink as MantineNavLink, Tooltip, Avatar, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useUser } from "@/hooks/use-user";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import { logout } from "@/services/auth/login";
import Logo from '@/assets/mittelware-logo.png';
import { FaSignOutAlt } from "react-icons/fa";
import { FaFilter, FaCaretRight } from "react-icons/fa6";
import { IoExtensionPuzzle } from "react-icons/io5";
import Splash from "@/components/splash/spash";
import useExtensionSync from "@/hooks/use-extension-sync";


export const ProtectedLayout = () => {
  const [opened] = useDisclosure();
  const [logoutDialogOpen, { open: openLogoutDialog, close: closeLogoutDialog }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useUser();
  
  useExtensionSync();

  return (!isLoading && user) ? (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 50,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header className="top-0 !bg-sky-50/50 bg-opacity-50 drop-shadow-sm drop-shadow-gray-100 relative backdrop-blur-xl" pt="md" px="md" pb="lg">
        <Group justify="space-between" align="center">
          <Link to="/rules">
            <Group gap='xs' align="top">
              <Image src={Logo} h={30} w={140} fit='contain' />
              <FaCaretRight className="self-center" />
              <Text c='gray' size="lg" fw={400}>Intercept</Text>
            </Group>
          </Link>
        </Group>
      </AppShell.Header>
      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={closeLogoutDialog}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
        onConfirm={async () => {
          await logout();
          closeLogoutDialog();
          navigate('/logout');
        }}
      />
      <AppShell.Navbar className="bg-white">
        <Stack justify="space-between" style={{ height: '100%' }}>
          <Stack gap={0}>
            <Tooltip label="Rules" position="right" withArrow>
              <MantineNavLink
                component={NavLink}
                to="/rules"
                label="Rules"
                leftSection={<FaFilter />}
                variant="filled"
                active={location.pathname.startsWith('/rules')}
              />
            </Tooltip>
          </Stack>
          <Stack gap={0} justify="flex-end">
            <Menu withArrow shadow="md">
              <Menu.Target>
                <Avatar className="cursor-pointer" src={user.user_metadata.avatar_url} m={6} alt={user.user_metadata.full_name} />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item className="!bg-transparent !hover:bg-transparent">
                  <Text>{user.user_metadata.full_name}</Text>
                  <Text size="xs" c="dimmed">{user.email}</Text>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={openLogoutDialog} leftSection={<FaSignOutAlt />}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Stack>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main className='bg-gray-50 bg-[linear-gradient(rgba(255,255,255,.3),rgba(255,255,255,.3)),url(/bg.png)]'>
        <Container size='lg' p={0} pb='xl' className='shadow-lg bg-white' mih={'calc(100vh - 60px)'}>
          <Outlet />
          {/* <Text size='sm'>
            <Center>&copy; {new Date().getFullYear()} Mittelware</Center>
          </Text> */}
        </Container>
      </AppShell.Main>
    </AppShell>
  ) : (
    <Splash />
  );
}