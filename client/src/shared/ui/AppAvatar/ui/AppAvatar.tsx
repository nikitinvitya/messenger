'use client'

import { Avatar, Indicator } from '@mantine/core';
import { getAvatarColor } from '@/shared/lib/getAvatarColor';
import { BASE_URL } from '@/shared/constants/api';

interface AppAvatarProps {
  src?: string | null;
  name: string;
  size?: number | string;
  isOnline?: boolean;
  radius?: number | string;
}

export const AppAvatar = ({ src, name, size = 40, isOnline = false, radius = "xl" }: AppAvatarProps) => {
  const SERVER_URL = BASE_URL!.replace('/api/v1', '');
  const avatarColor = getAvatarColor(name);
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <Indicator
      disabled={!isOnline}
      color="green"
      size={12}
      offset={4}
      position="bottom-end"
      withBorder
    >
      <Avatar
        src={src ? `${SERVER_URL}${src}` : null}
        size={size}
        radius={radius}
        styles={{
          root: { backgroundColor: avatarColor },
          placeholder: { color: '#fff', fontWeight: 600 }
        }}
      >
        {firstLetter}
      </Avatar>
    </Indicator>
  );
};