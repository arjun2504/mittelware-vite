import type { Recording } from '@/types/recordings';
import supabase from '@/services/supabase/client';
import { useStore, type Store } from '@/store';
import * as local from '@/services/recordings/local';

const RECORDINGS_BUCKET = 'step-recordings';

const isGuestMode = () => !(useStore.getState() as Store).session?.user;

const storagePath = (id: string) => `${id}.json`;

const uploadSteps = async (id: string, steps: Recording['steps']) => {
  const { error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .upload(storagePath(id), JSON.stringify({ steps }), {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) {
    throw new Error(error.message);
  }
};

const downloadSteps = async (id: string): Promise<Recording['steps']> => {
  const { data, error } = await supabase.storage.from(RECORDINGS_BUCKET).download(storagePath(id));
  if (error) {
    throw new Error(error.message);
  }
  const text = await data.text();
  const parsed = JSON.parse(text);
  return parsed.steps || [];
};

export const getRecording = async (id: string | undefined) => {
  if (isGuestMode()) {
    return local.getGuestRecording(id);
  }

  if (!id) {
    throw new Error('Recording not found');
  }

  const { data, error } = await supabase.from('recordings').select('*').eq('id', id).single();
  if (error) {
    throw new Error(error.message);
  }

  const steps = await downloadSteps(id);
  return { ...data, steps } as Recording;
};

export const getRecordings = async (page: number = 1, pageSize: number = 30) => {
  if (isGuestMode()) {
    return local.getGuestRecordings(page, pageSize);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { count, error: countError } = await supabase
    .from('recordings')
    .select('*', { count: 'exact', head: true });
  if (countError) {
    throw new Error(countError.message);
  }

  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(from, to);
  if (error) {
    throw new Error(error.message);
  }

  return { data, count: count || 0 };
};

export const saveRecording = async (values: Recording) => {
  if (isGuestMode()) {
    return local.saveGuestRecording(values);
  }

  const id = values.id || crypto.randomUUID();
  await uploadSteps(id, values.steps);

  const { data, error } = await supabase
    .from('recordings')
    .upsert({
      id,
      name: values.name,
      url: values.url,
      step_count: values.steps.length,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { ...data, steps: values.steps } as Recording;
};

export const deleteRecording = async (id: string) => {
  if (isGuestMode()) {
    return local.deleteGuestRecording(id);
  }

  const { error: storageError } = await supabase.storage.from(RECORDINGS_BUCKET).remove([storagePath(id)]);
  if (storageError) {
    throw new Error(storageError.message);
  }

  const { data, error } = await supabase.from('recordings').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteRecordings = async (ids: string[]) => {
  if (!ids || ids.length === 0) {
    return { data: null, error: 'No recording IDs provided' };
  }

  if (isGuestMode()) {
    return local.deleteGuestRecordings(ids);
  }

  const { error: storageError } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .remove(ids.map(storagePath));
  if (storageError) {
    throw new Error(storageError.message);
  }

  const { data, error } = await supabase.from('recordings').delete().in('id', ids);
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const migrateGuestRecordingsToAccount = async () => {
  const guestRecordings = local.getAllGuestRecordings();
  if (!guestRecordings.length) return;

  for (const recording of guestRecordings) {
    const id = crypto.randomUUID();
    await uploadSteps(id, recording.steps);
    const { error } = await supabase.from('recordings').insert({
      id,
      name: recording.name,
      url: recording.url,
      step_count: recording.steps.length,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  local.clearGuestRecordings();
};
