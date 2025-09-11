import supabase from "@/services/supabase/client";
import { notify } from "@/utils/notification";

export const signInSso = async (provider: 'google' | 'twitter') => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'twitter',
      options: {
        redirectTo: import.meta.env.VITE_HOST_URL + '/auth/callback'
      }
    });

    if (!error) {
      window.location.href = data.url; 
    } else {
      notify('There was an error occurred while logging in', false);
    }

  } catch (error) {
    return { data: null, error };
  }
}

export const sendEmailOtp = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) {
      return { email };
    }
    return { errors: { email: error }};
  } catch (error) {
    return { data: null, error };
  }
}

export const loginWithEmailOtp = async (email: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (!error) {
      // return redirect('/rules');
      return { data, error };
    }
    return { email, errors: { code: error } };
  } catch (error) {
    return { data: null, error };
  }
}
