'use client';

import {useForm} from '@mantine/form';
import {Box, Button, Group, PasswordInput, TextInput} from '@mantine/core';
import {z} from 'zod';
import {signIn} from '../model/api';
import {useRouter} from 'next/navigation';
import {useState} from "react";
import cls from './SignInForm.module.scss'
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";
import {AppRoutes} from "@/shared/config/routes";
import {useUserStore} from "@/entities/user";

const signInSchema = z.object({
  identifier: z.union([
    z.email({error: 'Invalid email format'}),
    z.string().min(3, {error: 'Username must contain at least 3 characters'})
  ]),
  password: z.string().min(8, { error: 'Password must contain at least 8 characters' }),
})

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const fetchUser = useUserStore((state) => state.fetchUser)

  const form = useForm<SignInFormData>({
    initialValues: {
      identifier: '',
      password: '',
    },

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
      console.error('Registration error:', err);
      if (err.response?.data?.error) {
        if (err.response.data.error === 'Invalid credentials') {
          form.setErrors({root: 'Invalid credentials'});
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
      className={cls.signInForm}>
      {form.errors.root && (
        <p className={cls.errors}>{form.errors.root}</p>
      )}

      <TextInput
        required
        label="Username or email"
        placeholder="Username or email"
        key={form.key('identifier')}
        {...form.getInputProps('identifier')}
      />

      <PasswordInput
        required
        label="Password"
        placeholder="Password"
        key={form.key('password')}
        {...form.getInputProps('password')}
      />

      <AppLink href={AppRoutes.signup} >Don't have an account? Sign up</AppLink>

      <Group className={cls.formFooter}>
        <Button type="submit" loading={isLoading} disabled={isLoading} className={cls.signInBtn}>
          Log in
        </Button>
      </Group>
    </Box>
  );
}