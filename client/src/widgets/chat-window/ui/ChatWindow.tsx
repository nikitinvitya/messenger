import classNames from 'classnames';
import cls from './ChatWindow.module.scss'
import {Box, Button, Text} from "@mantine/core";
import {Message, MessageApiResponse} from "@/entities/message";
import {ChatHeader} from "@/widgets/chat-header";
import {MessageList} from "@/widgets/message-list";
import {SendMessageForm} from "@/features/send-message";
import wallpaper from "@/shared/assets/ChatWallpaper.jpg"
import {Chat} from "@/entities/chat";

interface ChatWindowProps {
  className?: string;
  initialMessages: Message[];
  blockStatus: MessageApiResponse["blockStatus"];
  chatID: string;
  chatName: string;
  chatType: Chat["type"];
}

export const ChatWindow = (props: ChatWindowProps) => {

  const {chatID, chatName, className, initialMessages, blockStatus, chatType} = props;

  const renderFooter = () => {
    switch (blockStatus) {
      case "recipient_blocked":
        return <Button>Unblock</Button>
      case "sender_blocked":
        return <Text>You are blocked</Text>
      default:
        return <SendMessageForm chatID={chatID} key={chatID} />
    }
  }

  return (
    <Box className={classNames(cls.chatWindow)} style={{backgroundImage: `url(${wallpaper.src})`}}>
      <ChatHeader chatName={chatName} />
      <MessageList
        chatType={chatType}
        messages={initialMessages} />

      <Box className={cls.blurFooter} />
      {renderFooter()}
    </Box>
  );
};
