'use client';

import { useForm } from '@mantine/form';
import { Box, Button, Group, PasswordInput, TextInput, Text, Alert } from '@mantine/core';
import { z } from 'zod';
import { signIn } from '../model/api';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import cls from './SignInForm.module.scss'
import { AppLink } from "@/shared/ui/AppLink/ui/AppLink";
import { AppRoutes } from "@/shared/config/routes";
import { useUserStore } from "@/entities/user";

const signInSchema = z.object({
  identifier: z.string().min(3, {error: 'Username or email must contain at least 3 characters'}),
  password: z.string().min(8, { error: 'Password must contain at least 8 characters' }),
})

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const fetchUser = useUserStore((state) => state.fetchUser)

  const form = useForm<SignInFormData>({
    initialValues: { identifier: '', password: '' },
    validate: (values) => {
      const result = signInSchema.safeParse(values);
      if (result.success) {
        return {};
      }

      const zodErrors = z.treeifyError(result.error);
      const errors: Record<string, string> = {};

      if (zodErrors.properties) {
        for (const key in zodErrors.properties) {
          const fieldKey = key as keyof SignInFormData;

          if (zodErrors.properties[fieldKey]?.errors?.length) {
            errors[fieldKey] = zodErrors.properties[fieldKey].errors[0];
          }
        }
      }

      return errors;
    }
  });

  const handleSubmit = async (values: SignInFormData) => {
    setIsLoading(true);
    try {
      await signIn(values);
      await fetchUser();
      router.push(AppRoutes.chats);
    } catch (err: any) {
      const data = err.response?.data;
      form.setErrors({ root: data?.error || 'Invalid credentials or server error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)} className={cls.signInForm}>
      {form.errors.root && (
        <Alert color="red" variant="light" mb="md">
          <Text size="sm">{form.errors.root}</Text>
        </Alert>
      )}

      <TextInput
        required
        label="Username or email"
        placeholder="Username or email"
        {...form.getInputProps('identifier')}
      />

      <PasswordInput
        required
        label="Password"
        placeholder="Password"
        mt="md"
        {...form.getInputProps('password')}
      />

      <AppLink href={AppRoutes.signup}>Don't have an account? Sign up</AppLink>

      <Group className={cls.formFooter}>
        <Button type="submit" loading={isLoading} disabled={isLoading} className={cls.signInBtn}>
          Log in
        </Button>
      </Group>
    </Box>
  );
}
