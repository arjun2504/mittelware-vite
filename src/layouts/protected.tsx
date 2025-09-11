import { AppShell, Image, Progress, Stack, NavLink as MantineNavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavLink, Outlet } from "react-router";
import { FaFilter } from "react-icons/fa6";
import { CiLogout } from "react-icons/ci";
import { useSession } from "@/hooks/use-session";
import Logo from '@/assets/mittelware-logo.png';

export const ProtectedLayout = () => {
  // const { ruleType } = useLoaderData();
  const ruleType = '';
  const isNavigating = false;
  const [opened] = useDisclosure();
  const session = useSession();

  return session?.user && (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header className="top-0 bg-white drop-shadow-sm drop-shadow-gray-100 relative" pt="md" px="md" pb="lg">
        <Progress
          value={100}
          animated={isNavigating}
          color={isNavigating ? "blue" : "gray"}
          radius={0}
          size="md"
          opacity={isNavigating ? 0.5 : 0.1}
          striped={isNavigating}
          className="!absolute transition-all w-full bottom-0 z-10 left-0"
        />
        <Image src={Logo} h={30} w={140} fit='contain' mt={-5} />
        {/* <NavLink to='/logout'>Logout</NavLink> */}
      </AppShell.Header>
      <AppShell.Navbar>
        <Stack justify="space-between" style={{ height: '100%' }}>
          <Stack gap={0}>
            <MantineNavLink
              component={NavLink}
              to="/rules"
              label="Rules"
              leftSection={<FaFilter />}
              variant="filled"
              active={!ruleType}
            />
          </Stack>
          <Stack gap={0} justify="flex-end">
            <MantineNavLink
              component={NavLink}
              to="/logout"
              label="Logout"
              leftSection={<CiLogout />}
              variant="filled"
              pl={25}
            />
          </Stack>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}