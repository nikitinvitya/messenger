'use client'

import classNames from 'classnames';
import cls from './ChatList.module.scss'
import {Group} from "@mantine/core";
import {Chat, ChatListItem} from "@/entities/chat";

interface ChatListProps {
  className?: string;
  chatList: Chat[];
}

export const ChatList = ({chatList}: ChatListProps) => {
  return (
    <Group className={classNames(cls.chatList)}>
      {chatList
        .filter((chat): chat is Chat & { lastMessage: NonNullable<Chat["lastMessage"]> } =>
          chat.lastMessage !== undefined
        )
        .map(chat => (
          <ChatListItem chatInfo={chat} key={chat.id} />
        ))
      }
    </Group>
  );
};

