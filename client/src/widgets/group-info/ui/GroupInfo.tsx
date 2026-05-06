'use client'

import { useEffect, useState } from 'react';
import { Drawer, Stack, Box, Text, Group, ScrollArea, Divider, Loader, Center } from '@mantine/core';
import { Chat } from '@/entities/chat';
import { getChatInfo } from '@/entities/chat/api/getChatInfo';
import { AppAvatar } from '@/shared/ui/AppAvatar/ui/AppAvatar';
import { AppLink } from '@/shared/ui/AppLink/ui/AppLink';
import { AppRoutes } from '@/shared/config/routes';
import cls from './GroupInfo.module.scss';

interface GroupInfoProps {
  opened: boolean;
  onClose: () => void;
  chatID: number;
}

export const GroupInfo = ({ opened, onClose, chatID }: GroupInfoProps) => {
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (opened && chatID) {
      setIsLoading(true);
      getChatInfo(chatID)
        .then(setChatData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [opened, chatID]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title="Group Info"
      size="sm"
      classNames={{ body: cls.infoWrapper }}
    >
      {isLoading ? (
        <Center h="100%">
          <Loader size="md" />
        </Center>
      ) : chatData ? (
        <Stack gap="xl">
          <Box className={cls.groupName}>
            <AppAvatar
              src={chatData.avatarURL}
              name={chatData.name || 'Group'}
              size={100}
              radius='50%'
            />
            <Text fw={700} size="xl" mt="md">{chatData.name}</Text>
            <Text c="dimmed" size="sm">{chatData.participants?.length || 0} participants</Text>
          </Box>

          <Divider label="Participants" labelPosition="center" />

          <ScrollArea h="calc(100vh - 300px)" type="auto">
            <Stack gap="xs">
              {chatData.participants?.map(user => (
                <AppLink
                  key={user.id}
                  href={`${AppRoutes.profile}/${user.username}`}
                  onClick={onClose}
                  className={cls.userLink}
                >
                  <Group className={cls.userRow} wrap="nowrap">
                    <AppAvatar
                      src={user.avatarURL}
                      name={user.username}
                      isOnline={user.isOnline}
                    />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500} className={cls.username}>{user.username}</Text>
                      <Text size="xs" c={user.isOnline ? "green" : "dimmed"} fw={500}>
                        {user.isOnline ? 'online' : 'offline'}
                      </Text>
                    </Box>
                  </Group>
                </AppLink>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      ) : (
        <Center>
          <Text c="red">Failed to load group info</Text>
        </Center>
      )}
    </Drawer>
  );
};