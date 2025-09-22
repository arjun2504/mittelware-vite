import { Stack } from "@mantine/core";
import { AdvancedFilters } from "./common/advanced-filters";
import { URLInput } from "./common/url";
import { FormHeader } from "./common/header";

export function RedirectForm() {
  return (
    <Stack gap='md'>
      <FormHeader title='Redirect URL' />
      <URLInput
        label="Source URL"
        name="url_pattern"
        description="Match the URL that needs to be redirected"
      />
      <URLInput
        label="Destination URL"
        description="Full URL to be redirected to"
        placeholder="https://www.google.com"
        fullMatch={true}
        name="config.destination_url"
      />
      <AdvancedFilters />
    </Stack>
  )
}
