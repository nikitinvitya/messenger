'use client';

import { useState } from 'react';
import { Alert, Box, Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { z } from 'zod';
import { changePassword } from '../model/api';
import cls from './ChangePasswordModal.module.scss';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, { error: 'Password must contain at least 8 characters' }),
    newPassword: z.string().min(8, { error: 'Password must contain at least 8 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ opened, onClose }: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validate: (values) => {
      const result = changePasswordSchema.safeParse(values);
      if (result.success) {
        return {};
      }

      const zodErrors = z.treeifyError(result.error);
      const errors: Record<string, string> = {};

      if (zodErrors.properties) {
        for (const key in zodErrors.properties) {
          const fieldKey = key as keyof ChangePasswordFormData;
          if (zodErrors.properties[fieldKey]?.errors?.length) {
            errors[fieldKey] = zodErrors.properties[fieldKey].errors[0];
          }
        }
      }

      return errors;
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      handleClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { code?: string; error?: string } } })?.response?.data;
      if (data?.code === 'INVALID_CURRENT_PASSWORD') {
        form.setFieldError('currentPassword', 'Current password is incorrect');
      } else {
        form.setErrors({ root: data?.error || 'Failed to change password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Change password"
      centered
      size="sm"
      classNames={{ content: cls.modalContent }}
    >
      <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {form.errors.root && (
            <Alert color="red" variant="light">
              <Text size="sm">{form.errors.root}</Text>
            </Alert>
          )}

          <PasswordInput
            required
            label="Current password"
            {...form.getInputProps('currentPassword')}
          />
          <PasswordInput
            required
            label="New password"
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            required
            label="Confirm new password"
            {...form.getInputProps('confirmPassword')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Save
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
