import classNames from 'classnames';
import cls from './MessageList.module.scss';
import { Message, MessageItem } from "@/entities/message";
import { Box } from "@mantine/core";

interface MessageListProps {
  className?: string;
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const flagsById = new Map();
  const GAP = 5 * 60 * 1000;

  for (let i = 0; i < sorted.length; i++) {
    const msg = sorted[i];
    const prev = sorted[i - 1];
    const next = sorted[i + 1];

    const timeGapPrev = prev
      ? new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()
      : Infinity;

    const timeGapNext = next
      ? new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime()
      : Infinity;

    const isFirst =
      !prev ||
      prev.sender.id !== msg.sender.id ||
      timeGapPrev > GAP;

    const isLast =
      !next ||
      next.sender.id !== msg.sender.id ||
      timeGapNext > GAP;

    flagsById.set(msg.id, { isFirst, isLast });
  }

  return (
    <Box className={cls.messageList}>
      {messages.map((message) => {
        const flags = flagsById.get(message.id) || { isFirst: true, isLast: true };

        return (
          <MessageItem
            key={message.id}
            messageInfo={message}
            isFirstOfGroup={flags.isFirst}
            isLastOfGroup={flags.isLast}
          />
        );
      })}
    </Box>
  );
};
