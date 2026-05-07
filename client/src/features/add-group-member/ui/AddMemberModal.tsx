'use client'

import { useState, useEffect } from 'react';
import { Modal, TextInput, ScrollArea, Box, Text, Group, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { searchUsers } from '@/entities/user/api/searchUsers';
import { AppAvatar } from '@/shared/ui/AppAvatar/ui/AppAvatar';
import { addParticipant } from '@/entities/chat/api/addParticipant';

interface AddMemberModalProps {
  opened: boolean;
  onClose: () => void;
  chatID: number;
  onSuccess: () => void;
}

export const AddMemberModal = ({ opened, onClose, chatID, onSuccess }: AddMemberModalProps) => {
  const [query, setQuery] = useState('');
  const [debounced] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (debounced.trim()) {
      searchUsers(debounced).then(setResults);
    } else {
      setResults([]);
    }
  }, [debounced]);

  const handleAdd = async (userID: number) => {
    try {
      await addParticipant(chatID, userID);
      onSuccess();
      onClose();
      setQuery('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add Member" centered size="sm">
      <TextInput
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        mb="md"
      />
      <ScrollArea h={300}>
        {results.map(user => (
          <Box
            key={user.id}
            onClick={() => handleAdd(user.id)}
            p="xs"
            style={{ cursor: 'pointer', borderRadius: '8px' }}
          >
            <Group>
              <AppAvatar name={user.username} src={user.avatarURL} size={32} />
              <Text size="sm">{user.username}</Text>
            </Group>
          </Box>
        ))}
      </ScrollArea>
    </Modal>
  );
};