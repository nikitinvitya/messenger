'use client'

import { useEffect, useState, useRef, useCallback } from 'react';
import { Drawer, Stack, Box, Text, Group, ScrollArea, Divider, Loader, Center, TextInput, ActionIcon, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Image from 'next/image';

import { Chat } from '@/entities/chat';
import { getChatInfo } from '@/entities/chat/api/getChatInfo';
import { updateChat as updateChatApi } from '@/entities/chat/api/updateChat';
import { uploadMedia } from '@/entities/message/api/uploadMedia';
import { useChatStore } from '@/entities/chat/model/store';
import { AppAvatar } from '@/shared/ui/AppAvatar/ui/AppAvatar';
import { AppLink } from '@/shared/ui/AppLink/ui/AppLink';
import { AppRoutes } from '@/shared/config/routes';
import { AddMemberModal } from '@/features/add-group-member/ui/AddMemberModal';

import EditIcon from '@/shared/assets/EditIcon.svg';
import cls from './GroupInfo.module.scss';

interface GroupInfoProps {
  opened: boolean;
  onClose: () => void;
  chatID: number;
}

export const GroupInfo = ({ opened, onClose, chatID }: GroupInfoProps) => {
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const updateChatStore = useChatStore((state) => state.updateChat);
  const chatFromStore = useChatStore((state) => state.chats.find(c => c.id === chatID));

  const [addModalOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInfo = useCallback(async () => {
    if (!chatID) return;
    try {
      const data = await getChatInfo(chatID);
      setChatData(data);
      setNewName(data.name || '');
      updateChatStore(chatID, data);
    } catch (e) {
      console.error(e);
    }
  }, [chatID, updateChatStore]);

  useEffect(() => {
    if (opened) {
      setIsLoading(true);
      fetchInfo().finally(() => setIsLoading(false));
    }
  }, [opened, fetchInfo]);

  useEffect(() => {
    if (chatFromStore) {
      setChatData(prev => ({ ...prev, ...chatFromStore }));
      if (!isEditingName) {
        setNewName(chatFromStore.name || '');
      }
    }
  }, [chatFromStore, isEditingName]);

  const handleSaveName = async () => {
    if (!newName.trim() || !chatData || newName === chatData.name) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateChatApi(chatID, {
        name: newName,
        avatarURL: chatData.avatarURL || undefined
      });
      updateChatStore(chatID, updated);
      setIsEditingName(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatData) return;

    setIsUpdating(true);
    try {
      const { url } = await uploadMedia(file);
      const updated = await updateChatApi(chatID, {
        avatarURL: url,
        name: chatData.name || undefined
      });

      setChatData(prev => prev ? { ...prev, avatarURL: updated.avatarURL } : null);
      updateChatStore(chatID, updated);
    } catch (error) {
      console.error("Failed to update group avatar:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        title="Group Info"
        size="sm"
        classNames={{ body: cls.infoWrapper }}
      >
        {isLoading ? (
          <Center h="100%"><Loader size="md" /></Center>
        ) : chatData ? (
          <div className={cls.contentContainer}>
            <Box className={cls.groupHeader}>
              <Box className={cls.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
                <AppAvatar src={chatData.avatarURL} name={chatData.name || 'Group'} size={100} radius='50%' />
                <div className={cls.avatarOverlay}>Change</div>
                {isUpdating && <Loader size="sm" className={cls.avatarLoader} />}
              </Box>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />

              <div className={cls.nameSection}>
                {isEditingName ? (
                  <Group gap="xs" wrap="nowrap" w="100%">
                    <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} size="xs" style={{ flex: 1 }} />
                    <Button size="xs" onClick={handleSaveName} loading={isUpdating}>Save</Button>
                  </Group>
                ) : (
                  <Group gap="xs" justify="center">
                    <Text fw={700} size="xl">{chatData.name}</Text>
                    <ActionIcon variant="subtle" color="gray" onClick={() => setIsEditingName(true)}>
                      <Image src={EditIcon.src} width={18} height={18} alt="edit" />
                    </ActionIcon>
                  </Group>
                )}
                <Text className={cls.participantCount}>
                  {chatData.participants?.length || 0} participants
                </Text>
              </div>
            </Box>

            <Button variant="light" fullWidth onClick={openAdd} mb="md">Add Member</Button>
            <Divider label="Participants" labelPosition="center" mb="sm" />

            <ScrollArea className={cls.participantsScroll} type="auto">
              <Stack gap={0}>
                {chatData.participants?.map(user => (
                  <AppLink key={user.id} href={`${AppRoutes.profile}/${user.username}`} onClick={onClose} className={cls.userLink}>
                    <Group className={cls.userRow} wrap="nowrap">
                      <AppAvatar src={user.avatarURL} name={user.username} isOnline={user.isOnline} />
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" className={cls.username}>{user.username}</Text>
                        <Text size="xs" c={user.isOnline ? "green" : "dimmed"}>{user.isOnline ? 'online' : 'offline'}</Text>
                      </Box>
                    </Group>
                  </AppLink>
                ))}
              </Stack>
            </ScrollArea>
          </div>
        ) : (
          <Center><Text c="red">Failed to load group info</Text></Center>
        )}
      </Drawer>

      <AddMemberModal opened={addModalOpened} onClose={closeAdd} chatID={chatID} onSuccess={fetchInfo} />
    </>
  );
};