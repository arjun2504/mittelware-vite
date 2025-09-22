import { MultiSelect, Stack, TextInput, Title } from "@mantine/core";
import { REQUEST_METHODS, RESOURCE_TYPES } from "@/constants/rules/form";
import { useRuleContext } from "../context/rule";

export function AdvancedFilters() {
  const rule = useRuleContext();
  return (
    <Stack>
      <Title order={4}>Advanced Filters</Title>
      <MultiSelect
        label="Request Methods"
        description="HTTP methods that needs to be filtered"
        data={REQUEST_METHODS}
        defaultValue={['get']}
        size="md"
        hidePickedOptions={true}
        key={rule.key('advanced_filters.methods')}
        {...rule.getInputProps('advanced_filters.methods')}
      />
      <MultiSelect
        label="Resource Type"
        description="Filter based on the type of request"
        data={RESOURCE_TYPES}
        defaultValue={RESOURCE_TYPES.map((type) => type.value)}
        size="md"
        hidePickedOptions={true}
        key={rule.key('advanced_filters.resource_types')}
        {...rule.getInputProps('advanced_filters.resource_types')}
      />
      <TextInput
        label="Initiator domain"
        placeholder="example.com"
        description="Leave this blank if you want to match irrespective of the domain that initiates"
        size="md"
        key={rule.key('advanced_filters.initiator_domain')}
        {...rule.getInputProps('advanced_filters.initiator_domain')}
      />
    </Stack>
  )
}