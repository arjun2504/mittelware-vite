import { createFormContext } from '@mantine/form';
import type { Rule } from '@/types/rules';

export const [RuleProvider, useRuleContext, useRuleForm] = createFormContext<Rule>();