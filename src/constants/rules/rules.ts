export const EXTENSION_RULE_TYPE_MAP = {
  redirect: 'redirect',
  'modify-headers': 'modifyHeaders',
  'modify-response': 'redirect',
  block: 'block'
};

export const RULE_TYPES = [
  { type: 'block', label: 'Block URLs', formTitle: 'Block URL' },
  { type: 'redirect', label: 'Redirect', formTitle: 'Redirect URL' },
  { type: 'modify-headers', label: 'Header Modification', formTitle: 'Modify Headers' },
  { type: 'modify-response', label: 'Modify Response', formTitle: 'Modify Response' },
] as const;
