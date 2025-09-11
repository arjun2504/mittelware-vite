import { notifications } from "@mantine/notifications"

export const notify = (message: string, isSuccess: boolean) => {
  notifications.show({
    title: isSuccess ? 'Success' : 'Error',
    message,
    color: isSuccess ? 'green' : 'red',
    autoClose: 3000
  })
}
