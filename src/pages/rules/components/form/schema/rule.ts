import { z } from 'zod';

const baseFields = {
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string()
          .min(2, { message: 'Name should be at least two character long' })
          .max(255, { message: 'Name is too long' }),
  description: z.string().nullable().optional(),
  url_pattern: z.string()
                .min(1, { message: 'URL pattern is required' })
                .max(255, { message: 'URL pattern is too long' }),
  advanced_filters: z.any(),
  is_enabled: z.boolean().optional(),
};

const headerEntrySchema = z.object({
  id: z.string(),
  action: z.enum(['set', 'remove']),
  key: z.string().min(1, { message: 'Header key is required' }),
  value: z.string().optional(),
}).refine((entry) => entry.action === 'remove' || !!entry.value?.trim(), {
  message: 'Header value is required',
  path: ['value'],
});

export const ruleSchema = z.discriminatedUnion('type', [
  z.object({
    ...baseFields,
    type: z.literal('block'),
    config: z.any().optional(),
  }),
  z.object({
    ...baseFields,
    type: z.literal('redirect'),
    config: z.object({
      destination_url: z.string().min(1, { message: 'Destination URL is required' }),
    }),
  }),
  z.object({
    ...baseFields,
    type: z.literal('modify-headers'),
    config: z.object({
      request: z.array(headerEntrySchema).optional().default([]),
      response: z.array(headerEntrySchema).optional().default([]),
    }).refine((cfg) => (cfg.request?.length || 0) + (cfg.response?.length || 0) > 0, {
      message: 'Add at least one header to modify',
      path: ['request'],
    }),
  }),
  z.object({
    ...baseFields,
    type: z.literal('modify-response'),
    config: z.object({
      response_type: z.string().min(1, { message: 'Response type is required' }),
      response: z.string().min(1, { message: 'Response content is required' }),
    }),
  }),
]);
