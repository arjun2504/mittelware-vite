import { Alert, Anchor, Button, Divider, Group, isNumberLike, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import GoogleIcon from '@/assets/google.svg?react';
import { FaXTwitter } from "react-icons/fa6";
import { Form, useNavigate } from "react-router";
import { useMemo, useState } from "react";

const Login = () => {
  const [hasCodeSent, setHasCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: null, code: null });
  const navigate = useNavigate();

  const canAskCode = useMemo(() => {
    return hasCodeSent && !errors?.email;
  }, [errors, hasCodeSent]);

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

  const signInSso = () => null;

  const onSubmit = async (values: { email: string; code: string }) => {
    setIsLoading(true);
    if (values.email && !values.code) {
      await sendEmailOtp(values.email);
    } else {
      const { error } = await loginWithEmailOtp(values.email, values.code);
      if (!error) {
        navigate('/rules');
     }
    }
    if (!hasCodeSent) {
      setHasCodeSent(true);
    }
    setIsLoading(false);
  };

  const onFailure = (err) => { console.log(err); };

  const onChangeEmail = (event) => {
    setErrors({ ...errors, email: null });
    form.clearFieldError('email');
    form.setFieldValue('email', event.currentTarget.value);
    form.setFieldValue('code', '');
    if (hasCodeSent) {
      setHasCodeSent(false);
    }
  }

  const onChangeCode = (event) => {
    setErrors({ ...errors, code: null });
    form.setFieldValue('code', event.currentTarget.value || '');
  };

  const isButtonDisabled = () => {
    if (hasCodeSent) {
      return isLoading || !form.values.code.trim(); 
    } else {
      return isLoading || !form.values.email.trim();
    }
  };

  return (
    <>
      <Text size="lg" fw={500}>
        Welcome to Mittelware, login with
      </Text>

      <Group grow mb="md" mt="md">
        <Button leftSection={<GoogleIcon width={14} height={14} />} variant="default" radius="xl" onClick={() => signInSso('google')} />
        <Button leftSection={<FaXTwitter />} variant="default" radius="xl" onClick={() => signInSso('twitter')} />
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
            error={errors.email}
            radius="md"
            disabled={isLoading}
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
                error={errors.code}
                onChange={onChangeCode}
                disabled={isLoading}
              />
            </>
          ) : null}
        </Stack>
        <Group justify={canAskCode ? 'space-between' : 'flex-end'} mt="xl">
          {canAskCode ? (<Anchor component="button" type="button" c="dimmed" size="xs">
            Did not receive? Click to resend
          </Anchor>) : null}
          <Button loading={isLoading} type="submit" radius="xl" disabled={isButtonDisabled()}>
            {canAskCode ? 'Verify & Sign In' : 'Continue'}
          </Button>
        </Group>
      </form>
    </>
  );
}

export default Login;
