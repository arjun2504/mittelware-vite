import { Button, Card, MultiSelect, Select, TextInput, Textarea, createTheme } from '@mantine/core';

// Mirrors the web app's theme (see src/App.tsx) so the extension UI looks
// consistent with mittelware.com.
export const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'sm',
  radius: {
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '18px',
    xl: '34px',
  },
  fontFamily: 'Inter, sans-serif',
  fontFamilyMonospace: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  components: {
    Button: Button.extend({ defaultProps: { size: 'sm' } }),
    TextInput: TextInput.extend({ defaultProps: { size: 'sm' } }),
    Textarea: Textarea.extend({ defaultProps: { size: 'sm' } }),
    Select: Select.extend({ defaultProps: { size: 'sm' } }),
    MultiSelect: MultiSelect.extend({ defaultProps: { size: 'sm' } }),
    Card: Card.extend({ defaultProps: { p: 'md', radius: 'md', shadow: 'md', bg: 'var(--mantine-color-default)' } }),
  },
});
