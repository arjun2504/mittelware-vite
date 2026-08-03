import { Badge, TextInput } from "@mantine/core";
import { useRuleContext } from "../context/rule";

interface URLInputProps {
  label?: string;
  name?: string;
  placeholder?: string;
  description?: string;
  fullMatch?: boolean;
}

export function URLInput(props: URLInputProps) {
  const {
    label = 'URL',
    name = 'url_pattern',
    placeholder = 'https://www.facebook.com',
    description = 'Enter complete URL or a part of it',
    fullMatch = false,
  } = props;

  const rule = useRuleContext();

  return (
    <TextInput
      label={label}
      description={description}
      placeholder={placeholder}
      withAsterisk
      styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      {...!fullMatch ? ({
        leftSection: <Badge>contains</Badge>,
        leftSectionWidth: '100'
      }) : ({})}
      key={rule.key(name)}
      {...rule.getInputProps(name)}
    />
  );
}