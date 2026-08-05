export interface RecordingStep {
  type: 'navigate' | 'click' | 'type';
  description: string;
  screenshot?: string; // base64 data URL
  point?: { x: number; y: number }; // viewport-relative (0-1) click/type coordinates
  zoom?: number; // user-adjusted zoom level focused on `point`, set during review
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
