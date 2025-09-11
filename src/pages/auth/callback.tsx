import supabase from "@/services/supabase/client";
import { Center, Loader } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Callback = () => {
  const navigate = useNavigate();

  const validate = async () => {
    const url = new URL(window.location.href);
    const access_token = url.hash.match(/access_token=([^&]*)/)?.[1];
    const refresh_token = url.hash.match(/refresh_token=([^&]*)/)?.[1];
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        navigate('/login');
      } else {
        navigate('/rules')
      }
    } else {
      navigate('/login');
    }
  }

  useEffect(() => {
    validate();
  }, []);

  return (
    <Center>
      <Loader type='oval' />
    </Center>
  );
};

export default Callback;
