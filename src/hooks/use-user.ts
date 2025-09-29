import { useEffect } from "react";
import { useNavigate } from "react-router";
import supabase from "@/services/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store";
import type { Store } from "@/store";

export const useUser = () => {
  const navigate = useNavigate();

  const { setSession } = useStore() as Store;

  const { data, error, isLoading } = useQuery({
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        return { user: null, meta: null };
      }

      setSession(sessionData.session);

      return {
        session: sessionData.session,
        user: sessionData.session.user
      };
    },
    queryKey: ['user'],
    retry: false,
  });

  useEffect(() => {
    if (!data?.user && !isLoading) {
      navigate('/login');
    }
    if (error) {
      console.error('Error fetching user');
      navigate('/login');
    }
  }, [data, error, navigate]);

  return { user: data?.user, meta: data?.meta , isLoading };
};
