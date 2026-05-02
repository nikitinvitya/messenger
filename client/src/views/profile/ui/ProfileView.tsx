'use client'

import { useState, useRef, useEffect } from 'react';
import { Modal, Avatar, Text, Stack, ActionIcon, Box, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { User } from '@/entities/user/model/model';
import { BASE_URL } from '@/shared/constants/api';
import { getAvatarColor } from '@/shared/lib/getAvatarColor';
import { useUserStore } from '@/entities/user';
import { updateUserInfo } from '@/entities/user/api/updateUserInfo';
import { uploadMedia } from '@/entities/message/api/uploadMedia';
import Image from 'next/image';
import XIcon from '@/shared/assets/XIcon.svg';
import EditIcon from '@/shared/assets/EditIcon.svg';
import LogoutIcon from "@/shared/assets/LogoutIcon.svg"
import cls from './ProfileView.module.scss';

interface ProfileViewProps {
  targetUser: User;
}

export const ProfileView = ({ targetUser }: ProfileViewProps) => {
  const router = useRouter();
  const { user: currentUser, setUser, logout } = useUserStore();
  const isMyProfile = currentUser?.id === targetUser.id;

  const displayUser = isMyProfile ? (currentUser || targetUser) : targetUser;

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(displayUser.username);
  const [bio, setBio] = useState(displayUser.bio || '');
  const [avatarURL, setAvatarURL] = useState(displayUser.avatarURL || '');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const SERVER_URL = BASE_URL!.replace('/api/v1', '');

  const handleClose = () => router.back();

  const handleLogout = async () => {
    await logout();
    router.push('/sign-in');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const data = await uploadMedia(file);
      setAvatarURL(data.url);
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const avatarColor = getAvatarColor(displayUser.username);
  const currentDisplayAvatar = isMyProfile ? avatarURL : displayUser.avatarURL;

  return (
    <Modal
      opened={true}
      onClose={handleClose}
      centered
      withCloseButton={false}
      size="380px"
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
          <Avatar
            src={currentDisplayAvatar ? `${SERVER_URL}${currentDisplayAvatar}` : null}
            className={cls.mainAvatar}
            styles={{
              root: { backgroundColor: avatarColor, width: '100%', height: '100%' },
              placeholder: { color: '#fff', fontWeight: 600, fontSize: '48px' }
            }}
          >
            {displayUser.username.charAt(0).toUpperCase()}
          </Avatar>
          {isMyProfile && isEditing && <div className={cls.avatarOverlay}>Change</div>}
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
        </Box>

        <Box className={cls.buttonArea}>
          <Group gap={5}>
            {isMyProfile && (
              <ActionIcon variant="subtle" color="red" size="lg" onClick={handleLogout}>
                <Image src={LogoutIcon.src} width={22} height={22} alt="logout" />
              </ActionIcon>
            )}
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleClose}>
              <Image src={XIcon.src} width={22} height={22} alt="close" />
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
            </Stack>
          )}
        </Box>

        <Box className={cls.bioArea}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" fw={500}>Bio</Text>
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
                <Text size="sm">{displayUser.bio || 'No bio yet'}</Text>
              )}
            </Box>
            {isMyProfile && !isEditing && (
              <ActionIcon variant="subtle" color="gray" onClick={() => setIsEditing(true)}>
                <Image src={EditIcon.src} width={18} height={18} alt="edit" />
              </ActionIcon>
            )}
          </Group>
          {isEditing && (
            <Group grow mt="md" gap="xs">
              <Button size="xs" onClick={handleSave} loading={isLoading}>Save</Button>
            </Group>
          )}
        </Box>
      </Box>
    </Modal>
  );
};