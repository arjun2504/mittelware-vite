import { AppShell, Image, Group, Text, Container, Stack, NavLink as MantineNavLink, Tooltip, Avatar, Menu, Button, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useUser } from "@/hooks/use-user";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import { logout } from "@/services/auth/login";
import Logo from '@/assets/mittelware-logo.png';
import { FaSignOutAlt, FaFilter } from "react-icons/fa";
import { FaCaretRight, FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import Splash from "@/components/splash/spash";
import useExtensionSync from "@/hooks/use-extension-sync";
import ThemeToggle from "@/components/theme-toggle/theme-toggle";

const SIDEBAR_COLLAPSED_KEY = 'mittelware:sidebar-collapsed';
const SIDEBAR_EXPANDED_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 76;

export const ProtectedLayout = () => {
  const [opened] = useDisclosure();
  const [logoutDialogOpen, { open: openLogoutDialog, close: closeLogoutDialog }] = useDisclosure();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useUser();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  useExtensionSync();

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return !isLoading ? (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header
        className="top-0 relative"
        px="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Group justify="space-between" align="center" style={{ width: '100%' }}>
          <Link to="/rules">
            <Group gap='xs' align="center">
              <Image src={Logo} h={26} w={120} fit='contain' style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined} />
              <FaCaretRight color="var(--mantine-color-dimmed)" className="self-center" />
              <Text c='dimmed' size="md" fw={400}>Intercept</Text>
            </Group>
          </Link>
          <Group gap='xs'>
            <ThemeToggle />
            {user ? (
              <Menu withArrow shadow="md">
                <Menu.Target>
                  <Avatar className="cursor-pointer" size='sm' src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
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
            ) : (
              <Tooltip label="Login to sync your rules" withArrow>
                <Button component={Link} to="/login" variant="light" size="xs">
                  Login
                </Button>
              </Tooltip>
            )}
          </Group>
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
      <AppShell.Navbar style={{ borderRight: '1px solid var(--mantine-color-default-border)' }}>
        <Stack justify="space-between" style={{ height: '100%' }} gap={0}>
          <Stack gap={0} mt='xs'>
            {(() => {
              const isActive = location.pathname.startsWith('/rules');
              const link = (
                <MantineNavLink
                  component={NavLink}
                  to="/rules"
                  label={!collapsed ? 'Rules' : undefined}
                  leftSection={<FaFilter size={16} />}
                  variant="light"
                  color="violet"
                  active={isActive}
                  style={{
                    borderLeft: '3px solid',
                    borderLeftColor: isActive ? 'var(--mantine-color-violet-4)' : 'transparent',
                  }}
                />
              );
              return collapsed ? (
                <Tooltip label="Rules" position="right" withArrow>
                  {link}
                </Tooltip>
              ) : link;
            })()}
          </Stack>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            className="self-center"
            mb='xs'
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
          >
            {collapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
          </ActionIcon>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main
        style={{
          backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <Container size='lg' p={0} pb='xl'>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  ) : (
    <Splash />
  );
}
