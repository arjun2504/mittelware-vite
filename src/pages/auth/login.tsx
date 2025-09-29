import { Alert, Anchor, Button, Divider, Group, isNumberLike, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import GoogleIcon from '@/assets/google.svg?react';
import { FaXTwitter } from "react-icons/fa6";
import { useNavigate } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { loginWithEmailOtp, sendEmailOtp, signInSso } from "@/services/auth/login";

const Login = () => {
  const [hasCodeSent, setHasCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const socialSignIn = useMutation({
    mutationFn: signInSso,
    onSuccess: () => {
      navigate('/callback');
    },
    onError: (error) => {
      console.error('Social sign-in failed:', error);
    }
  });

  const sendOtp = useMutation({
    mutationFn: sendEmailOtp,
    onSuccess: () => {
      setHasCodeSent(true);
      setResendCooldown(60);
    },
    onError: (error) => {
      console.error('Failed to send OTP:', error);
    }
  });

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const login = useMutation({
    mutationFn: loginWithEmailOtp,
    onSuccess: () => {
      navigate('/rules');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    }
  });

  const canAskCode = useMemo(() => {
    return hasCodeSent && !sendOtp.error;
  }, [hasCodeSent, sendOtp.error]);

  const form = useForm({
    initialValues: {
      email: '',
      code: '',
    },

    validate: {
      email: (val: string) => (/^\S+@\S+$/.test(val) ? null : 'Please provide a valid email address'),
      code: (val: string) => {
          if (canAskCode) {
            return (isNumberLike(val) && val.length === 6) ? null : 'Please provide a valid code';
          }
          return null;
      },
    }
  });

  const onSubmit = (values: { email: string; code: string }) => {
    if (values.email && !values.code) {
      sendOtp.mutate(values.email);
    } else {
      login.mutate({ email: values.email, token: values.code});
    }
  };

  const onFailure = (err: any) => { 
    console.log('Form validation failed:', err); 
  };

  const onChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.clearFieldError('email');
    form.setFieldValue('email', event.currentTarget.value);
    form.setFieldValue('code', '');
    if (hasCodeSent) {
      setHasCodeSent(false);
    }
  }

  const onChangeCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setFieldValue('code', event.currentTarget.value || '');
  };

  const isButtonDisabled = () => {
    if (hasCodeSent) {
      return login.isPending || !form.values.code.trim(); 
    } else {
      return sendOtp.isPending || !form.values.email.trim();
    }
  };

  return (
    <>
      <Text size="lg" fw={500}>
        Welcome to Mittelware, login with
      </Text>

      <Group grow mb="md" mt="md">
        <Button 
          leftSection={<GoogleIcon width={14} height={14} />} 
          variant="default" 
          radius="xl" 
          loading={socialSignIn.isPending}
          onClick={() => socialSignIn.mutate('google')} 
        />
        <Button 
          leftSection={<FaXTwitter />} 
          variant="default" 
          radius="xl" 
          loading={socialSignIn.isPending}
          onClick={() => socialSignIn.mutate('twitter')} 
        />
      </Group>

      <Divider label="Or continue with email" labelPosition="center" my="lg" />

      <form onSubmit={form.onSubmit(onSubmit, onFailure)}>
        <Stack>
          <TextInput
            required
            label="Email"
            placeholder="hello@example.com"
            value={form.values.email}
            onChange={onChangeEmail}
            error={sendOtp.error?.message || form.errors.email}
            radius="md"
            disabled={sendOtp.isPending || login.isPending}
          />
          {canAskCode ? (
            <>
              <Alert title='Check your email' variant='light'>A verification code has been sent to your email address. You can enter the code below, or click the link received on your email.</Alert>
              <TextInput
                required
                label="Verification Code"
                placeholder="XXXXXX"
                radius="md"
                value={form.values.code}
                error={login.error?.message || form.errors.code}
                onChange={onChangeCode}
                disabled={login.isPending}
              />
            </>
          ) : null}
        </Stack>
        <Group justify={canAskCode ? 'space-between' : 'flex-end'} mt="xl">
          {canAskCode ? (
            <Anchor
              component="button"
              type="button"
              c="dimmed"
              size="xs"
              onClick={() => {
                if (form.values.email && resendCooldown === 0) {
                  sendOtp.mutate(form.values.email);
                }
              }}
              disabled={sendOtp.isPending || resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : 'Did not receive? Click to resend'}
            </Anchor>
          ) : null}
          <Button 
            loading={sendOtp.isPending || login.isPending} 
            type="submit" 
            radius="xl" 
            disabled={isButtonDisabled()}
          >
            {canAskCode ? 'Verify & Sign In' : 'Continue'}
          </Button>
        </Group>
      </form>
    </>);
}

export default Login;
