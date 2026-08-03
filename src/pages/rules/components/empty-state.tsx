import { Stack, Text, ThemeIcon } from "@mantine/core";
import { FaFilter } from "react-icons/fa6";

const RuleEmptyState = () => {
  return (
    <Stack align="center" gap="md" py={80}>
      <ThemeIcon size={64} radius="xl" variant="light" color="violet">
        <FaFilter size={26} />
      </ThemeIcon>
      <Stack align="center" gap={4}>
        <Text fw={600} size="md">No rules yet</Text>
        <Text c="dimmed" size="sm">Click "Create Rule" to add your first one</Text>
      </Stack>
    </Stack>
  )
}

export default RuleEmptyState;
