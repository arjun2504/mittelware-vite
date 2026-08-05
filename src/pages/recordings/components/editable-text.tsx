import { useEffect, useState } from "react";
import { Text, TextInput } from "@mantine/core";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
}

// Text and TextInput render with different box models by default (padding,
// border, line-height), so swapping between them on click shifts every
// element below. Both branches share this exact box (padding/min-height/
// border-box) so the swap only changes what's drawn, not how much space it
// takes -- the idle Text gets a transparent border matching the input's real
// one so that doesn't shift things either.
const FIELD_HEIGHT = 32;
const fieldBox = {
  padding: '6px 10px',
  minHeight: FIELD_HEIGHT,
  fontSize: 'var(--mantine-font-size-sm)',
  lineHeight: 'var(--mantine-line-height-sm)',
  fontWeight: 600,
  borderRadius: 'var(--mantine-radius-sm)',
  boxSizing: 'border-box' as const,
};

// Click-to-edit text: Mantine has no built-in "Editable" component (unlike
// e.g. Chakra), so this swaps a Text for a TextInput on click and commits on
// blur/Enter.
const EditableText = ({ value, onChange }: EditableTextProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setDraft(value);
    }
  };

  if (editing) {
    return (
      <TextInput
        autoFocus
        variant="unstyled"
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        style={{ flex: 1 }}
        styles={{
          input: {
            ...fieldBox,
            border: '1px solid var(--mantine-color-default-border)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          },
        }}
      />
    );
  }

  return (
    <Text
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...fieldBox,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        cursor: 'text',
        border: '1px solid transparent',
        backgroundColor: hovered ? 'var(--mantine-color-default-hover)' : 'transparent',
        transition: 'background-color 120ms ease',
      }}
    >
      {value}
    </Text>
  );
};

export default EditableText;
