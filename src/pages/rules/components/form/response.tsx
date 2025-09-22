import { Alert, Code, InputDescription, InputLabel, Select, Stack } from "@mantine/core";
import { AdvancedFilters } from "./common/advanced-filters";
import { URLInput } from "./common/url";
import { FormHeader } from "./common/header";
import CodeMirror from '@uiw/react-codemirror';
import { MODIFY_RESPONSE_TYPES } from "@/constants/rules/form";
// ...existing code...
import { mimeToExtension } from "@/utils/rules";
import { useRuleContext } from "./context/rule";
import { FaInfoCircle } from "react-icons/fa";

export function ResponseForm() {
  const rule = useRuleContext();

  return (
    <Stack gap='md'>
      <FormHeader title='Modify Response' />
      <URLInput />
      <Select
        required={true}
        label='Response Type'
        description='Specify content type of the response'
        value={rule.values.config?.response_type || ''}
        data={MODIFY_RESPONSE_TYPES}
        {...rule.getInputProps('config.response_type')}
        onChange={(value) => rule.setFieldValue('config.response_type', value)}
      />
      <Stack gap={3}>
        <InputLabel required={true}>Response Content</InputLabel>
        <InputDescription>Custom content to be received</InputDescription>
        <CodeMirror
          height="300px"
          extensions={mimeToExtension[rule.values.config?.response_type] || []}
          value={rule.values.config?.response || ''}
          onChange={(value) => rule.setFieldValue('config.response', value)}
          placeholder="Enter your response content here..."
        />
        <Alert title="Note" mt='lg' icon={<FaInfoCircle />}>
          The request is intercepted and redirected to a <Code>data://</Code> URL, which delivers the modified response to the client. In the browser's Developer Tools (Network tab), this will appear as a <Code>data://</Code> resource instead of the original URL.
        </Alert>
      </Stack>
      <AdvancedFilters />
    </Stack>
  )
}
