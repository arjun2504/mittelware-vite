import { Card, Stack } from "@mantine/core";
import { URLInput } from "./common/url";

export function RedirectForm() {
  return (
    <Card>
      <Stack gap='md'>
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
      </Stack>
    </Card>
  )
}
