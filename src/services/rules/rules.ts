import type { Rule } from '@/types/rules';
import supabase from '@/services/supabase/client';
import { DEFAULT_RULES } from "@/constants/rules/form";
import { transformRulesToExtensionFormat } from '@/utils/rules';
import { useStore, type Store } from '@/store';

export const getRule = async (id: string | number | undefined, type: string | undefined) => {
  if (!isNaN(id as number) || !type) {
    const { data, error } = await supabase.from("rules").select("*").eq("id", id).single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
  return DEFAULT_RULES[type as keyof typeof DEFAULT_RULES];
}

export const saveRule = async (values: Rule) => {
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

export const getRules = async (page: number = 1, pageSize: number = 30) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Get total count
  const { count, error: countError } = await supabase
    .from('rules')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    throw new Error(countError.message);
  }
  
  // Get paginated data
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(from, to);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { data, count: count || 0 };
}

export const cloneRule = async (rule: Rule, copyName: string) => {
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
  const { data, error } = await supabase.from('rules').select('*').eq('is_enabled', true);
  if (error) {
    throw new Error(error.message);
  }
  return data;
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
