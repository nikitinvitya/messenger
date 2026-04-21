import {useRouter} from "next/navigation";
import {useChatStore} from "@/entities/chat/model/store";
import {useEffect, useState} from "react";
import {useDebouncedValue} from "@mantine/hooks";
import {UserSearchResponse} from "@/entities/user/model/model";
import {searchUsers} from "@/entities/user/api/searchUsers";
import {createChat} from "@/entities/chat/api/createChat";
import {Box, Button, Modal, ScrollArea, TextInput, Text, Badge, ActionIcon} from "@mantine/core";
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
  const addChat = useChatStore(state => state.addChat)

  useEffect(() => {
    if(debouncedSearch.trim().length > 0) {
      searchUsers(debouncedSearch).then(setSearchResult).catch(console.error)
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

    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      opened={isOpened}
      onClose={onClose}
      title={"Create new group"}
      classNames={{
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
              rightSection={
                <ActionIcon onClick={() => toggleUsers(user)}>
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
                    <Text size="sm">{user.username}</Text>
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
        disabled={!groupName.trim()}
      >
        Create
      </Button>
    </Modal>
  )
}