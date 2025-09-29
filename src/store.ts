import { create } from 'zustand';
import type { Rule } from './types/rules';

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
  rules: Rule[];

  setSession: (user: any) => void;
  setSettings: (userMeta: any) => void;
  setIsExtensionConnected: (isExtensionConnected: boolean) => void;
}

const useStore = create((set) => ({
  session: {},
  settings: {},
  isExtensionConnected: false,

  setSession: (session: Session) => set({ session }),
  setSettings: (settings: Settings) => set({ settings }),
  setIsExtensionConnected: (isExtensionConnected: boolean) => set({ isExtensionConnected }),
}));

export { useStore };
