'use client';

import { Box, Text, useComputedColorScheme } from '@mantine/core';
import cls from './ChatsView.module.scss';
import wallpaperLight from '@/shared/assets/ChatWallpaper.jpg';
import wallpaperDark from '@/shared/assets/ChatWallpaperDark.jpg';
import Image from 'next/image';

export const ChatsView = () => {
  const colorScheme = useComputedColorScheme('light');
  const wallpaper = colorScheme === 'dark' ? wallpaperDark : wallpaperLight;

  return (
    <Box className={cls.chatsViewPlaceholder}>
      <Image
        src={wallpaper}
        alt="Background"
        fill
        priority={true}
        unoptimized
        className={cls.wallpaper}
      />

      <Box className={cls.centeredBadge}>
        <Text size="sm">Select a chat to start messaging</Text>
      </Box>
    </Box>
  );
};