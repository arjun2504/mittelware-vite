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
      size="md"
      label={label}
      description={description}
      placeholder={placeholder}
      withAsterisk
      {...!fullMatch ? ({
        leftSection: <Badge>contains</Badge>,
        leftSectionWidth: '100'
      }) : ({})}
      mb='lg'
      key={rule.key(name)}
      {...rule.getInputProps(name)}
    />
  );
}