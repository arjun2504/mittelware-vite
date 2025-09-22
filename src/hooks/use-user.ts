import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import supabase from "@/services/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const { data, error } = useQuery({
    queryFn: () => supabase.auth.getUser(),
    queryKey: ['user'],
    retry: false,
  });

  useEffect(() => {
    if (data) {
      if (data.data?.user) {
        setUser(data.data.user);
      } else {
        navigate('/login');
      }
    }
    if (error) {
      console.error('Error fetching user');
      navigate('/login');
    }
  }, [data, error, navigate]);

  return user;
};
