import { create } from 'zustand';
import type { Rule } from './types/rules';
import type { RecordingDraft } from './types/recordings';

interface Session {
  token: string;
  user: any;
}

interface Settings {
  isPaused: boolean;
}

export interface Store {
  session: Session;
  settings: Settings;
  isExtensionConnected: boolean;
  extensionVersion: string | null;
  recordingDraft: RecordingDraft | null;
  rules: Rule[];

  setSession: (user: any) => void;
  setSettings: (userMeta: any) => void;
  setIsExtensionConnected: (isExtensionConnected: boolean) => void;
  setExtensionVersion: (extensionVersion: string | null) => void;
  setRecordingDraft: (recordingDraft: RecordingDraft | null) => void;
}

const useStore = create((set) => ({
  session: {},
  settings: {},
  isExtensionConnected: false,
  extensionVersion: null,
  recordingDraft: null,

  setSession: (session: Session) => set({ session }),
  setSettings: (settings: Settings) => set({ settings }),
  setIsExtensionConnected: (isExtensionConnected: boolean) => set({ isExtensionConnected }),
  setExtensionVersion: (extensionVersion: string | null) => set({ extensionVersion }),
  setRecordingDraft: (recordingDraft: RecordingDraft | null) => set({ recordingDraft }),
}));

export { useStore };
