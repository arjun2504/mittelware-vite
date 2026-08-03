import { Outlet, useNavigate } from "react-router"
import { Center, Image, Paper, Stack, type PaperProps, useMantineColorScheme } from "@mantine/core"
import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import Splash from "@/components/splash/spash";
import Logo from '@/assets/mittelware-logo.png';

const AuthLayout = (props: PaperProps) => {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/rules');
    }
  }, [isLoading, user]);

  return !isLoading && !user ? (
    <Center bg="var(--mantine-color-gray-light)" h="100vh">
      <Stack align="center" gap="lg">
        <Image src={Logo} h={32} w={150} fit='contain' style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined} />
        <Paper radius="md" p="lg" withBorder {...props} w={400}>
          <Outlet />
        </Paper>
      </Stack>
    </Center>
  ) : (<Splash />);
}

export default AuthLayout;
