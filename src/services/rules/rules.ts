import type { Rule } from '@/types/rules';
import supabase from '@/services/supabase/client';
import { DEFAULT_RULES } from "@/constants/rules/form";
import { transformRulesToExtensionFormat } from '@/utils/rules';
import { useStore, type Store } from '@/store';
import * as local from '@/services/rules/local';
import { ruleSchema } from '@/pages/rules/components/form/schema/rule';

const isGuestMode = () => !(useStore.getState() as Store).session?.user;

export const getRule = async (id: string | number | undefined) => {
  if (isGuestMode()) {
    return local.getGuestRule(id);
  }

  if (id !== undefined && !isNaN(Number(id))) {
    const { data, error } = await supabase.from("rules").select("*").eq("id", id).single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
  return DEFAULT_RULES.block;
}

export const saveRule = async (values: Rule) => {
  if (isGuestMode()) {
    return local.saveGuestRule(values);
  }

  // Create a copy to avoid mutating the original
  const ruleData = { ...values };

  if (ruleData.config && typeof ruleData.config === 'string') {
    try {
      ruleData.config = JSON.parse(ruleData.config);
    } catch (e) {
      ruleData.config = {};
    }
  }
  
  if (ruleData.advanced_filters && typeof ruleData.advanced_filters === 'string') {
    try {
      ruleData.advanced_filters = JSON.parse(ruleData.advanced_filters);
    } catch (e) {
      ruleData.advanced_filters = {
        methods: ['get'],
        resource_types: ['main_frame', 'xmlhttprequest'],
        initiator_domain: ''
      };
    }
  }

  // Remove id if it's not a valid number
  if (ruleData.id) {
    const id = Number(ruleData.id);
    if (isNaN(id) || id <= 0) {
      delete ruleData.id; // create rule
    } else {
      ruleData.id = id; // Convert to number
    }
  }

  // Handle timestamps - remove empty strings and let Supabase handle auto timestamps
  if (ruleData.created_at === '' || ruleData.created_at === null) {
    delete ruleData.created_at;
  }
  if (ruleData.updated_at === '' || ruleData.updated_at === null) {
    delete ruleData.updated_at;
  }

  // Handle created_by - remove empty strings and let Supabase handle it
  if (ruleData.created_by === '' || ruleData.created_by === null) {
    delete ruleData.created_by;
  }
  
  // Save to Supabase
  const { data, error } = await supabase
    .from('rules')
    .upsert(ruleData)
    .select()
    .single();
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const getRules = async (page: number = 1, pageSize: number = 30, type?: string) => {
  if (isGuestMode()) {
    return local.getGuestRules(page, pageSize, type);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  let countQuery = supabase.from('rules').select('*', { count: 'exact', head: true });
  if (type) {
    countQuery = countQuery.eq('type', type);
  }
  const { count, error: countError } = await countQuery;

  if (countError) {
    throw new Error(countError.message);
  }

  // Get paginated data
  let dataQuery = supabase
    .from('rules')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(from, to);
  if (type) {
    dataQuery = dataQuery.eq('type', type);
  }
  const { data, error } = await dataQuery;

  if (error) {
    throw new Error(error.message);
  }

  return { data, count: count || 0 };
}

export const cloneRule = async (rule: Rule, copyName: string) => {
  if (isGuestMode()) {
    return local.cloneGuestRule(rule, copyName);
  }

  const { data, error } = await supabase
    .from('rules')
    .insert({
      advanced_filters: rule.advanced_filters,
      url_pattern: rule.url_pattern,
      config: rule.config,
      description: rule.description,
      name: copyName.trim(),
      type: rule.type,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const deleteRule = async (id: number) => {
  if (isGuestMode()) {
    return local.deleteGuestRule(id);
  }

  const { data, error } = await supabase
    .from('rules')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const deleteRules = async (ids: number[]) => {
  if (!ids || ids.length === 0) {
    return { data: null, error: 'No rule IDs provided' };
  }

  if (isGuestMode()) {
    return local.deleteGuestRules(ids);
  }

  const { data, error } = await supabase
    .from('rules')
    .delete()
    .in('id', ids);
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const toggleRule = async (id: number, isEnabled: boolean) => {
  if (isGuestMode()) {
    return local.toggleGuestRule(id, isEnabled);
  }

  const { data, error } = await supabase
    .from('rules')
    .update({ is_enabled: isEnabled })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const getAllEnabledRules = async () => {
  if (isGuestMode()) {
    return local.getAllEnabledGuestRules();
  }

  const { data, error } = await supabase.from('rules').select('*').eq('is_enabled', true);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export const migrateGuestRulesToAccount = async () => {
  const guestRules = local.getAllGuestRules();
  if (!guestRules.length) return;

  const rulesToInsert = guestRules.map((rule) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, created_by, ...rest } = rule;
    return rest;
  });

  const { error } = await supabase.from('rules').insert(rulesToInsert);
  if (error) {
    throw new Error(error.message);
  }

  local.clearGuestRules();
  await syncRulesWithExtension();
}

export const exportRules = async (type?: string, limit?: number) => {
  if (isGuestMode()) {
    return local.exportGuestRules(type, limit);
  }

  let query = supabase.from('rules').select('*').order('updated_at', { ascending: false });
  if (type) {
    query = query.eq('type', type);
  }
  if (typeof limit === 'number') {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data as Rule[];
}

const getUniqueRuleName = (name: string, existingNames: Set<string>) => {
  if (!existingNames.has(name)) {
    return name;
  }
  let counter = 2;
  let candidate = `${name} (${counter})`;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${name} (${counter})`;
  }
  return candidate;
}

export const importRules = async (rawRules: unknown[]) => {
  const existingRules = await exportRules();
  const existingNames = new Set(existingRules.map((rule) => rule.name));

  let imported = 0;
  let failed = 0;

  for (const raw of rawRules) {
    const parsed = ruleSchema.safeParse(raw);
    if (!parsed.success) {
      failed++;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = parsed.data as unknown as Rule;
    const name = getUniqueRuleName(rest.name, existingNames);
    existingNames.add(name);

    await saveRule({ ...rest, name } as Rule);
    imported++;
  }

  return { imported, failed };
}

export const syncRulesWithExtension = async () => {
  const state = useStore.getState() as Store;
  if (!state.isExtensionConnected) return;

  const enabledRules = await getAllEnabledRules();

  const formattedRules = transformRulesToExtensionFormat(enabledRules);

  window.postMessage({
    source: 'mittelware-intercept-rules',
    type: 'mittelware:rules:sync',
    payload: {
      rules: formattedRules,
    }
  }, '*');
};

export const pingExtension = () => {
  window.postMessage({
    source: 'mittelware-intercept-rules',
    type: 'mittelware:intercept:ping',
  }, '*');
};
