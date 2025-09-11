import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import supabase from "@/services/supabase/client";

export const useSession = () => {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  const validateSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      navigate('/login');
      return;
    }
    setSession(data.session);
  };

  useEffect(() => {
    validateSession();
  }, []);

  return session;
};
