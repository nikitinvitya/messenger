import classNames from 'classnames';
import cls from './ChatsView.module.scss'
import {Box} from "@mantine/core";
import {ChatList} from "@/widgets/chat-list";
import {getChats} from "@/entities/chat/api/getChats";

interface ChatsViewProps {
  className?: string;
}

export const ChatsView = async (props: ChatsViewProps) => {
  const chats = await getChats()
  return (
    <Box className={classNames(cls.chatsView)}>
      <ChatList chatList={chats} />
    </Box>
  );
};

