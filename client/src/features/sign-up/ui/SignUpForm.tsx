'use client';

import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Box, Group } from '@mantine/core';
import { z } from 'zod';
import { signUpByEmail } from '../model/api';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import cls from './SignUpForm.module.scss'
import { AppLink } from "@/shared/ui/AppLink/ui/AppLink";
import { AppRoutes } from "@/shared/config/routes";

const signUpSchema = z.object({
  email: z.email({ error: 'Invalid email format' }),
  username: z.string().min(3, { error: 'Username must contain at least 3 characters' }),
  password: z.string().min(8, { error: 'Password must contain at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpFormData>({
    initialValues: { email: '', username: '', password: '', confirmPassword: '' },
    validate: (values) => {
      const result = signUpSchema.safeParse(values);
      if (result.success) {
        return {};
      }

      const zodErrors = z.treeifyError(result.error);
      const errors: Record<string, string> = {};

      if (zodErrors.properties) {
        for (const key in zodErrors.properties) {
          const fieldKey = key as keyof SignUpFormData;

          if (zodErrors.properties[fieldKey]?.errors?.length) {
            errors[fieldKey] = zodErrors.properties[fieldKey].errors[0];
          }
        }
      }

      return errors;
    }
  });

  const handleSubmit = async (values: SignUpFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = values;
      await signUpByEmail(dataToSend);
      router.push(AppRoutes.login);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.code === 'USERNAME_TAKEN') {
        form.setFieldError('username', 'This username is already taken');
      } else if (data?.code === 'EMAIL_TAKEN') {
        form.setFieldError('email', 'This email is already in use');
      } else {
        form.setErrors({ root: data?.error || 'Registration failed' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)} className={cls.signUpForm}>
      {form.errors.root && <p className={cls.errors}>{form.errors.root}</p>}

      <TextInput required label="Email" placeholder="your@email.com" {...form.getInputProps('email')} />
      <TextInput required label="Username" placeholder="username" mt="sm" {...form.getInputProps('username')} />
      <PasswordInput required label="Password" placeholder="Password" mt="sm" {...form.getInputProps('password')} />
      <PasswordInput required label="Confirm password" placeholder="Confirm password" mt="sm" {...form.getInputProps('confirmPassword')} />

      <AppLink href={AppRoutes.login}>Already have an account? Login</AppLink>

      <Group className={cls.formFooter}>
        <Button type="submit" disabled={isLoading} loading={isLoading} className={cls.signUpBtn}>
          Create account
        </Button>
      </Group>
    </Box>
  );
}
