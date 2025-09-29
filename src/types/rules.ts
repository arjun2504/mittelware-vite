export interface AdvancedFilters {
  methods: string[];
  resource_types: string[];
  initiator_domain: string;
}

export interface HeaderType {
  id: string;
  action: 'set' | 'remove';
  key: string;
  value: string;
}

export interface Rule {
  id?: number;
  name: string;
  description?: string;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  type: 'block' | 'redirect' | 'modify-headers' | 'modify-response';
  url_pattern: string;
  advanced_filters: AdvancedFilters;
  config: any;
  is_enabled: boolean;
}