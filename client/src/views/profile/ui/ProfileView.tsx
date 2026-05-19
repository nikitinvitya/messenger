'use client'

import { useState, useRef } from 'react';
import {
  Modal,
  Text,
  Stack,
  ActionIcon,
  Box,
  TextInput,
  Textarea,
  Button,
  Group,
  Menu,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { User } from '@/entities/user/model/model';
import { BACKEND_ORIGIN } from '@/shared/constants/api';
import { useUserStore } from '@/entities/user';
import { updateUserInfo } from '@/entities/user/api/updateUserInfo';
import { uploadMedia } from '@/entities/message/api/uploadMedia';
import { createChat } from '@/entities/chat/api/createChat';
import { getChatInfo } from '@/entities/chat/api/getChatInfo';
import { useChatStore } from '@/entities/chat/model/store';
import { ChangePasswordModal } from '@/features/change-password';
import { AppAvatar } from "@/shared/ui/AppAvatar/ui/AppAvatar";
import Image from 'next/image';
import XIcon from '@/shared/assets/XIcon.svg';
import EditIcon from '@/shared/assets/EditIcon.svg';
import LogoutIcon from "@/shared/assets/LogoutIcon.svg";
import VerticalDotsIcon from '@/shared/assets/VerticalDotsIcon.svg';
import LightThemeIcon from '@/shared/assets/LightThemeIcon.svg';
import DarkThemeIcon from '@/shared/assets/DarkThemeIcon.svg';
import cls from './ProfileView.module.scss';

interface ProfileViewProps {
  targetUser: User;
}

export const ProfileView = ({ targetUser }: ProfileViewProps) => {
  const router = useRouter();
  const computedScheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();
  const { user: currentUser, setUser, logout } = useUserStore();
  const isMyProfile = currentUser?.id === targetUser.id;

  const displayUser = isMyProfile ? (currentUser || targetUser) : targetUser;

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(displayUser.username);
  const [bio, setBio] = useState(displayUser.bio || '');
  const [avatarURL, setAvatarURL] = useState(displayUser.avatarURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const isDark = computedScheme === 'dark';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaOrigin = BACKEND_ORIGIN;

  const handleClose = () => router.back();

  const handleLogout = async () => {
    await logout();
    router.push('/sign-in');
  };

  const handleToggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const handleSendMessage = async () => {
    setIsCreatingChat(true);
    try {
      const res = await createChat({
        userIDs: [targetUser.id],
        chatType: "private",
      });

      try {
        const chat = await getChatInfo(res.chatID);
        useChatStore.getState().addChat(chat);
      } catch {
      }

      handleClose();

      setTimeout(() => {
        router.push(`/chats/${res.chatID}`);
      }, 50);

    } catch {
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const data = await uploadMedia(file);
      setAvatarURL(data.url);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updated = await updateUserInfo({ username, bio, avatarURL });
      setUser(updated);
      setIsEditing(false);

      if (updated.username !== targetUser.username) {
        router.replace(`/profile/${updated.username}`);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const currentDisplayAvatar = isMyProfile ? avatarURL : targetUser.avatarURL;
  const currentIsOnline = isMyProfile ? true : targetUser.isOnline;

  return (
    <Modal
      opened={true}
      onClose={handleClose}
      centered
      withCloseButton={false}
      size="400px"
      padding={0}
      classNames={{
        content: cls.modalContent,
        overlay: cls.modalOverlay,
      }}
    >
      <Box className={cls.gridContainer}>
        <Box
          className={`${cls.avatarArea} ${isMyProfile && isEditing ? cls.editable : ''}`}
          onClick={() => isMyProfile && isEditing && fileInputRef.current?.click()}
        >
          <AppAvatar
            src={currentDisplayAvatar}
            name={displayUser.username}
            isOnline={currentIsOnline}
            size={120}
            radius="50%"
          />
          {isMyProfile && isEditing && <div className={cls.avatarOverlay}>Change</div>}
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
        </Box>

        <Box className={cls.buttonArea}>
          <Group gap={8}>
            {isMyProfile && (
              <Menu shadow="md" width={220} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Profile options">
                    <Image src={VerticalDotsIcon.src} width={24} height={24} alt="options" />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    onClick={handleToggleTheme}
                    leftSection={
                      <Image
                        src={isDark ? LightThemeIcon.src : DarkThemeIcon.src}
                        width={18}
                        height={18}
                        alt=""
                      />
                    }
                  >
                    {isDark ? 'Light theme' : 'Dark theme'}
                  </Menu.Item>
                  <Menu.Item onClick={() => setIsChangePasswordOpen(true)}>
                    Change password
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    onClick={handleLogout}
                    leftSection={<Image src={LogoutIcon.src} width={18} height={18} alt="" />}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleClose}>
              <Image src={XIcon.src} width={24} height={24} alt="close" />
            </ActionIcon>
          </Group>
        </Box>

        <Box className={cls.usernameArea}>
          {isEditing ? (
            <TextInput
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="xs"
              w="100%"
            />
          ) : (
            <Stack gap={0}>
              <Text fw={700} size="xl" truncate>{displayUser.username}</Text>
              {currentIsOnline && <Text c="blue" size="xs" fw={500}>online</Text>}
            </Stack>
          )}
        </Box>

        <Box className={cls.bioArea}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" fw={600} mb={4}>Bio</Text>
              {isEditing ? (
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  autosize
                  minRows={2}
                  size="sm"
                />
              ) : (
                <Text size="sm" lineClamp={3}>{displayUser.bio || 'No bio yet'}</Text>
              )}
            </Box>
            {isMyProfile && !isEditing && (
              <ActionIcon variant="subtle" color="gray" onClick={() => setIsEditing(true)}>
                <Image src={EditIcon.src} width={20} height={20} alt="edit" />
              </ActionIcon>
            )}
          </Group>

          {isEditing && (
            <Group grow mt="md" gap="xs">
              <Button size="xs" onClick={handleSave} loading={isLoading}>Save</Button>
            </Group>
          )}

        </Box>
        {!isMyProfile && (
          <Button
            fullWidth
            variant="light"
            mt="md"
            onClick={handleSendMessage}
            loading={isCreatingChat}
            className={cls.sendMessageBtn}
          >
            Send Message
          </Button>
        )}
      </Box>

      {isMyProfile && (
        <ChangePasswordModal
          opened={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}
    </Modal>
  );
};