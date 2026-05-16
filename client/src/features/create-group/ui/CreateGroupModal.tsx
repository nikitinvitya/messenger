'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Box, Button, Modal, ScrollArea, TextInput, Text, Badge, ActionIcon, Group } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { UserSearchResponse } from "@/entities/user/model/model";
import { searchUsers } from "@/entities/user/api/searchUsers";
import { createChat } from "@/entities/chat/api/createChat";
import { AppAvatar } from "@/shared/ui/AppAvatar/ui/AppAvatar";

import cls from "./CreateGroupModal.module.scss"

interface GroupModalProps {
  isOpened: boolean;
  onClose: () => void;
}

export const CreateGroupModal = ({isOpened, onClose}: GroupModalProps) => {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300)
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResponse[]>([])
  const [searchResult, setSearchResult] = useState<UserSearchResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if(debouncedSearch.trim().length > 0) {
      searchUsers(debouncedSearch).then(setSearchResult).catch(() => {})
    } else {
      setSearchResult([])
    }
  }, [debouncedSearch]);

  const toggleUsers = (user: UserSearchResponse) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateGroup = async () => {
    if(!groupName.trim() || selectedUsers.length === 0) return

    setIsLoading(true)
    try {
      const payload = {
        userIDs: selectedUsers.map(user => user.id),
        name: groupName,
        chatType: "group" as const,
      }

      const {chatID} = await createChat(payload)
      setGroupName('')
      setSearchQuery('')
      setSearchResult([])

      router.push(`/chats/${chatID}`)
      onClose()

    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      opened={isOpened}
      onClose={onClose}
      title={"Create new group"}
      centered
      size="md"
      classNames={{
        inner: cls.modalInner,
        content: cls.modalContent,
        header: cls.modalHeader,
        title: cls.modalTitle,
        body: cls.modalBody,
      }}
    >
      <Box className={cls.fieldGroup}>
        <Text className={cls.label}>Group name</Text>
        <TextInput
          required
          placeholder={"Enter group name"}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </Box>

      <Box className={cls.fieldGroup}>
        <Text className={cls.label}>Participants</Text>

        <Box className={cls.selectedUsersList}>
          {selectedUsers.map(user => (
            <Badge
              key={user.id}
              variant="filled"
              className={cls.userBadge}
              leftSection={
                <AppAvatar
                  name={user.username}
                  src={user.avatarURL}
                  size={16}
                />
              }
              rightSection={
                <ActionIcon size="xs" onClick={() => toggleUsers(user)} variant="transparent" color="white">
                  &times;
                </ActionIcon>
              }
            >
              {user.username}
            </Badge>
          ))}
        </Box>

        <Box className={cls.searchWrapper}>
          <TextInput
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchResult.length > 0 && (
            <ScrollArea className={cls.resultsDropdown} offsetScrollbars>
              <Box>
                {searchResult.map(user => (
                  <Box
                    key={user.id}
                    onClick={() => toggleUsers(user)}
                    className={cls.resultItem}
                  >
                    <AppAvatar
                      src={user.avatarURL}
                      name={user.username}
                      isOnline={user.isOnline}
                      size={32}
                    />
                    <Text size="sm" fw={500}>{user.username}</Text>
                  </Box>
                ))}
              </Box>
            </ScrollArea>
          )}
        </Box>
      </Box>

      <Button
        className={cls.modalBtn}
        onClick={handleCreateGroup}
        loading={isLoading}
        disabled={!groupName.trim() || selectedUsers.length === 0}
      >
        Create
      </Button>
    </Modal>
  )
}