'use client';

import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Box, Group } from '@mantine/core';
import { z } from 'zod';
import { signUpByEmail } from '../model/api';
import { useRouter } from 'next/navigation';
import {useState} from "react";
import cls from './SignUpForm.module.scss'
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";

const signUpSchema = z.object({
  email: z.email({ message: 'Invalid email format' }),
  username: z.string().min(3, { message: 'Username must contain at least 3 characters' }),
  password: z.string().min(8, { message: 'Password must contain at least 8 characters' }),
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
    initialValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },

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
      router.push('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.error) {
        if (err.response.data.error === 'Username already exists') {
          form.setFieldError('username', 'This username is already taken');
        } else if (err.response.data.error === 'Email already exists') {
          form.setFieldError('email', 'This email is already in use');
        } else {
          form.setErrors({ root: 'An unexpected error occurred' });
        }
      }
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <Box
      component="form"
      onSubmit={form.onSubmit(handleSubmit)}
      className={cls.signUpForm}>
      {form.errors.root && (
        <p className={cls.errors}>{form.errors.root}</p>
      )}

      <TextInput
        required
        label="Email"
        placeholder="your@email.com"
        key={form.key('email')}
        {...form.getInputProps('email')}
      />

      <TextInput
        required
        label="Username"
        placeholder="username"
        key={form.key('username')}
        {...form.getInputProps('username')}
      />

      <PasswordInput
        required
        label="Password"
        placeholder="Password"
        key={form.key('password')}
        {...form.getInputProps('password')}
      />

      <PasswordInput
        required
        label="Confirm password"
        placeholder="password"
        key={form.key('confirmPassword')}
        {...form.getInputProps('confirmPassword')}
      />

      <AppLink href={'/login'} >Already have an account? Login</AppLink>

      <Group className={cls.formFooter}>
        <Button type="submit" loading={isLoading} className={cls.signUpBtn}>
          Create account
        </Button>
      </Group>
    </Box>
  );
}