import { Outlet } from "react-router"
import { Center, Paper, type PaperProps} from "@mantine/core"

const AuthLayout = (props: PaperProps) => {
  return (
    <Center bg="var(--mantine-color-gray-light)" h="100vh">
      <Paper radius="md" p="lg" withBorder {...props} w={400}>
        <Outlet />    
      </Paper>
    </Center>
  )
}

export default AuthLayout;
