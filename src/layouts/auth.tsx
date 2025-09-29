import { Outlet, useNavigate } from "react-router"
import { Center, Paper, type PaperProps} from "@mantine/core"
import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import Splash from "@/components/splash/spash";

const AuthLayout = (props: PaperProps) => {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/rules');
    }
  }, [isLoading, user]);

  return !isLoading && !user ? (
    <Center bg="var(--mantine-color-gray-light)" h="100vh">
      <Paper radius="md" p="lg" withBorder {...props} w={400}>
        <Outlet />    
      </Paper>
    </Center>
  ) : (<Splash />);
}

export default AuthLayout;
