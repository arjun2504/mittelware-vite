import { Alert, Card, Code, InputDescription, InputLabel, Select, Stack, useMantineColorScheme } from "@mantine/core";
import { URLInput } from "./common/url";
import CodeMirror from '@uiw/react-codemirror';
import { MODIFY_RESPONSE_TYPES } from "@/constants/rules/form";
import { mimeToExtension } from "@/utils/rules";
import { useRuleContext } from "./context/rule";
import { FaInfoCircle } from "react-icons/fa";

export function ResponseForm() {
  const rule = useRuleContext();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Card>
      <Stack gap='md'>
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
            className="font-mono text-sm"
            theme={isDark ? 'dark' : 'light'}
            extensions={mimeToExtension[rule.values.config?.response_type] || []}
            value={rule.values.config?.response || ''}
            onChange={(value) => rule.setFieldValue('config.response', value)}
            placeholder="Enter your response content here..."
          />
          <Alert title="Note" mt='lg' icon={<FaInfoCircle />} variant='light'>
            The request is intercepted and redirected to a <Code>data://</Code> URL, which delivers the modified response to the client. In the browser's Developer Tools (Network tab), this will appear as a <Code>data://</Code> resource instead of the original URL.
          </Alert>
        </Stack>
      </Stack>
    </Card>
  )
}
