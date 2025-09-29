import supabase from "@/services/supabase/client";

export const signInSso = async (provider: 'google' | 'twitter') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google' | 'twitter',
    options: {
      redirectTo: import.meta.env.VITE_HOST_URL + '/callback'
    }
  });

  if (error) {
    throw new Error(error.message);
  }
  window.location.href = data.url;
}

export const sendEmailOtp = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    throw new Error(error.message);
  }
  return { email };
}

export const loginWithEmailOtp = async ({ email, token }: { email: string, token: string }) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) {
    throw new Error(error.message);
  }
  return { data };
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return true;
}