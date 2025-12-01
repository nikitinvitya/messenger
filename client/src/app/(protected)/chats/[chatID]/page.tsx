import {ChatView} from "@/views/chat";
import {notFound} from "next/navigation";

interface ChatPageProps {
  params: {
    chatID: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatID } = await params;

  if (isNaN(parseInt(chatID, 10))) {
    notFound();
  }

  return <ChatView chatID={chatID} />;
}
