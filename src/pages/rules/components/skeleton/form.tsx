import { Card, Group, Skeleton, Stack } from "@mantine/core";

const FieldSkeleton = ({ labelWidth }: { labelWidth: number }) => (
  <Stack gap={6}>
    <Skeleton height={12} width={labelWidth} radius="sm" />
    <Skeleton height={36} radius="sm" />
  </Stack>
);

const FormSkeleton = () => {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Skeleton height={28} width={180} radius="sm" />
        <Group gap="sm">
          <Skeleton height={28} width={52} radius="xl" />
          <Skeleton height={36} width={120} radius="sm" />
        </Group>
      </Group>
      <Card>
        <Stack gap="md" maw={480}>
          <FieldSkeleton labelWidth={90} />
          <FieldSkeleton labelWidth={50} />
        </Stack>
      </Card>
      <Card>
        <FieldSkeleton labelWidth={40} />
      </Card>
      <Card>
        <Stack gap="md">
          <Skeleton height={18} width={140} radius="sm" />
          <FieldSkeleton labelWidth={110} />
          <FieldSkeleton labelWidth={100} />
          <FieldSkeleton labelWidth={110} />
        </Stack>
      </Card>
    </Stack>
  );
};

export default FormSkeleton;
