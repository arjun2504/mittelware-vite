import type { Rule } from '@/types/rules';
import { DEFAULT_RULES } from '@/constants/rules/form';

const STORAGE_KEY = 'mittelware:guest:rules';

const readAll = (): Rule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Rule[] : [];
  } catch {
    return [];
  }
};

const writeAll = (rules: Rule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

const nextId = (rules: Rule[]) => {
  const ids = rules.map((rule) => Number(rule.id) || 0);
  return (ids.length ? Math.max(...ids) : 0) + 1;
};

const parseIfString = <T,>(value: T | string, fallback: T): T => {
  if (typeof value !== 'string') {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const hasGuestRules = () => readAll().length > 0;

export const clearGuestRules = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getGuestRule = (id: string | number | undefined) => {
  if (id !== undefined && !isNaN(Number(id))) {
    const rules = readAll();
    const rule = rules.find((r) => Number(r.id) === Number(id));
    if (!rule) {
      throw new Error('Rule not found');
    }
    return rule;
  }
  return DEFAULT_RULES.block;
};

export const saveGuestRule = (values: Rule) => {
  const ruleData = { ...values };

  ruleData.config = parseIfString(ruleData.config, {});
  ruleData.advanced_filters = parseIfString(ruleData.advanced_filters, {
    methods: ['get'],
    resource_types: ['main_frame', 'xmlhttprequest'],
    initiator_domain: ''
  });

  const rules = readAll();
  const now = new Date().toISOString();
  const existingId = Number(ruleData.id);

  if (ruleData.id && !isNaN(existingId) && existingId > 0) {
    const index = rules.findIndex((r) => Number(r.id) === existingId);
    if (index === -1) {
      throw new Error('Rule not found');
    }
    const updated: Rule = { ...rules[index], ...ruleData, id: existingId, updated_at: now };
    rules[index] = updated;
    writeAll(rules);
    return updated;
  }

  const created: Rule = {
    ...ruleData,
    id: nextId(rules),
    created_at: now,
    updated_at: now,
    created_by: null,
  };
  rules.push(created);
  writeAll(rules);
  return created;
};

export const getGuestRules = (page: number = 1, pageSize: number = 30, type?: string) => {
  const rules = readAll()
    .filter((rule) => !type || rule.type === type)
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  return { data: rules.slice(from, to), count: rules.length };
};

export const cloneGuestRule = (rule: Rule, copyName: string) => {
  const rules = readAll();
  const now = new Date().toISOString();
  const cloned: Rule = {
    advanced_filters: rule.advanced_filters,
    url_pattern: rule.url_pattern,
    config: rule.config,
    description: rule.description,
    name: copyName.trim(),
    type: rule.type,
    is_enabled: rule.is_enabled,
    id: nextId(rules),
    created_at: now,
    updated_at: now,
    created_by: null,
  };
  rules.push(cloned);
  writeAll(rules);
  return cloned;
};

export const deleteGuestRule = (id: number) => {
  const rules = readAll().filter((r) => Number(r.id) !== Number(id));
  writeAll(rules);
};

export const deleteGuestRules = (ids: number[]) => {
  const idSet = new Set(ids.map(Number));
  const rules = readAll().filter((r) => !idSet.has(Number(r.id)));
  writeAll(rules);
};

export const toggleGuestRule = (id: number, isEnabled: boolean) => {
  const rules = readAll();
  const index = rules.findIndex((r) => Number(r.id) === Number(id));
  if (index === -1) {
    throw new Error('Rule not found');
  }
  rules[index] = { ...rules[index], is_enabled: isEnabled, updated_at: new Date().toISOString() };
  writeAll(rules);
  return rules[index];
};

export const getAllEnabledGuestRules = () => readAll().filter((r) => r.is_enabled);

export const getAllGuestRules = () => readAll();

export const exportGuestRules = (type?: string, limit?: number) => {
  const rules = readAll()
    .filter((rule) => !type || rule.type === type)
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  return typeof limit === 'number' ? rules.slice(0, limit) : rules;
};
