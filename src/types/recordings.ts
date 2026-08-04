export interface RecordingStep {
  type: 'navigate' | 'click' | 'type';
  description: string;
  screenshot?: string; // base64 data URL
}

export interface RecordingDraft {
  id: string;
  url: string;
  steps: RecordingStep[];
  startedAt?: string;
  stoppedAt?: string;
}

export interface Recording {
  id?: string; // uuid
  name: string;
  url: string;
  steps: RecordingStep[];
  step_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
}
