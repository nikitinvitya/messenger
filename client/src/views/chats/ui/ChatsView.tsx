import { Box, Text } from "@mantine/core";
import cls from './ChatsView.module.scss';
import wallpaper from "@/shared/assets/ChatWallpaper.jpg";
import Image from "next/image";

export const ChatsView = () => {
  return (
    <Box className={cls.chatsViewPlaceholder}>
      <Image
        src={wallpaper}
        alt="Background"
        fill
        priority={true}
        unoptimized
        className={cls.wallpaper}
        placeholder="blur"
      />

      <Box className={cls.centeredBadge}>
        <Text size="sm">Select a chat to start messaging</Text>
      </Box>
    </Box>
  );
};