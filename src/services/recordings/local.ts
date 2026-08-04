import type { Recording } from '@/types/recordings';

const STORAGE_KEY = 'mittelware:guest:recordings';

const readAll = (): Recording[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Recording[] : [];
  } catch {
    return [];
  }
};

const writeAll = (recordings: Recording[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
};

export const hasGuestRecordings = () => readAll().length > 0;

export const clearGuestRecordings = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getGuestRecording = (id: string | undefined) => {
  const recordings = readAll();
  const recording = recordings.find((r) => r.id === id);
  if (!recording) {
    throw new Error('Recording not found');
  }
  return recording;
};

export const saveGuestRecording = (values: Recording) => {
  const recordings = readAll();
  const now = new Date().toISOString();

  if (values.id) {
    const index = recordings.findIndex((r) => r.id === values.id);
    if (index === -1) {
      throw new Error('Recording not found');
    }
    const updated: Recording = { ...recordings[index], ...values, updated_at: now };
    recordings[index] = updated;
    writeAll(recordings);
    return updated;
  }

  const created: Recording = {
    ...values,
    id: crypto.randomUUID(),
    step_count: values.steps.length,
    created_at: now,
    updated_at: now,
    created_by: null,
  };
  recordings.push(created);
  writeAll(recordings);
  return created;
};

export const getGuestRecordings = (page: number = 1, pageSize: number = 30) => {
  const recordings = readAll()
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  return { data: recordings.slice(from, to), count: recordings.length };
};

export const deleteGuestRecording = (id: string) => {
  const recordings = readAll().filter((r) => r.id !== id);
  writeAll(recordings);
};

export const deleteGuestRecordings = (ids: string[]) => {
  const idSet = new Set(ids);
  const recordings = readAll().filter((r) => !idSet.has(r.id as string));
  writeAll(recordings);
};

export const getAllGuestRecordings = () => readAll();
