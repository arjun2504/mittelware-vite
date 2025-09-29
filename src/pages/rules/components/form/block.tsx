import { Stack } from "@mantine/core";
import { AdvancedFilters } from "./common/advanced-filters";
import { URLInput } from "./common/url";
import { FormHeader } from "./common/header";

export function BlockForm() {

  return (
    <Stack gap='md'>
      <FormHeader title='Block URL' />
      <URLInput />
      <AdvancedFilters />
    </Stack>
  )
}
