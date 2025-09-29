import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Center, Loader } from "@mantine/core";
import { logout } from "@/services/auth/login";

const Logout = () => {
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate('/login');
    },
    onError: (error) => console.log(error)
  })

  useEffect(() => {
    signOut.mutate();
  }, []);

  return (
    <Center>
      <Loader type='oval' />
    </Center>
  );
}

export default Logout;
