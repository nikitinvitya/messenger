'use client'

import { useState, useRef, useEffect } from 'react';
import { sendMessage } from "@/entities/message/api/sendMessage";
import { uploadMedia } from "@/entities/message/api/uploadMedia";
import { updateMessage } from "@/entities/message/api/updateMessage";
import { useMessageStore } from "@/entities/message/model/store";
import { useForm } from "@mantine/form";
import Image from "next/image"
import { Box, Button, Textarea, ActionIcon, Text } from "@mantine/core";
import SendIcon from "@/shared/assets/SendIcon.svg"
import AttachIcon from "@/shared/assets/AttachIcon.svg"
import XIcon from "@/shared/assets/XIcon.svg"
import EditIcon from "@/shared/assets/EditIcon.svg"
import ReplyIcon from "@/shared/assets/ReplyIcon.svg"
import cls from "./SendMessageForm.module.scss"
import { BASE_URL } from "@/shared/constants/api";

interface SendMessageFormProps {
  className?: string;
  chatID: number;
}

export const SendMessageForm = ({ chatID }: SendMessageFormProps) => {
  const [isUploading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    editingMessage, setEditingMessage,
    replyingToMessage, setReplyingToMessage
  } = useMessageStore();

  const form = useForm({
    initialValues: { content: '' },
  });

  useEffect(() => {
    if (editingMessage) {
      form.setFieldValue('content', editingMessage.content);
    }
  }, [editingMessage]);

  const handleCancelAction = () => {
    setEditingMessage(null);
    setReplyingToMessage(null);
    form.setFieldValue('content', '');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const data = await uploadMedia(file);
      setImageUrl(data.url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: { content: string }) => {
    if (!values.content.trim() && !imageUrl) return;

    try {
      if (editingMessage) {
        await updateMessage(editingMessage.id, values.content);
        setEditingMessage(null);
      } else {
        await sendMessage(chatID, {
          content: values.content,
          imageURL: imageUrl || undefined,
          replyToMessageID: replyingToMessage?.id
        });
        setReplyingToMessage(null);
      }

      form.reset();
      setImageUrl(null);
    } catch (error) {
      console.error("Failed to process message action", error);
    }
  }

  const SERVER_URL = BASE_URL!.replace("/api/v1", "");

  return (
    <Box className={cls.container}>
      {(editingMessage || replyingToMessage) && (
        <Box className={cls.actionPreview}>
          <div className={cls.accentBar} />
          <div className={cls.actionIcon}>
            <Image
              src={editingMessage ? EditIcon.src : ReplyIcon.src}
              width={18} height={18} alt="action"
            />
          </div>
          <div className={cls.actionContent}>
            <Text className={cls.actionTitle}>
              {editingMessage ? 'Edit Message' : replyingToMessage?.sender?.username}
            </Text>
            <Text className={cls.previewText}>
              {editingMessage?.content || (replyingToMessage?.imageURL ? '📷 Photo' : replyingToMessage?.content)}
            </Text>
          </div>
          <ActionIcon variant="subtle" color="gray" onClick={handleCancelAction} className={cls.closeActionBtn}>
            <Image src={XIcon.src} width={14} height={14} alt="close" />
          </ActionIcon>
        </Box>
      )}

      {imageUrl && (
        <Box className={cls.previewWrapper}>
          <div className={cls.previewItem}>
            <img src={`${SERVER_URL}${imageUrl}`} alt="preview" />
            <ActionIcon className={cls.removeBtn} onClick={() => setImageUrl(null)} variant="filled" color="red" size="xs">
              <Image src={XIcon.src} width={10} height={10} alt="remove" />
            </ActionIcon>
          </div>
        </Box>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)} className={cls.formWrapper}>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

        {!editingMessage && (
          <ActionIcon onClick={() => fileInputRef.current?.click()} variant="subtle" size="xl" loading={isUploading} className={cls.attachBtn}>
            <Image src={AttachIcon.src} width={24} height={24} alt="attach" />
          </ActionIcon>
        )}

        <Textarea
          className={cls.sendForm}
          autosize={true}
          maxRows={10}
          placeholder="Message"
          {...form.getInputProps('content')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              form.onSubmit(handleSubmit)();
            }
          }}
        />

        <Button type="submit" className={cls.sendBtn}>
          <Image src={SendIcon.src} width={30} height={30} alt="send" className={cls.sendImage} />
        </Button>
      </form>
    </Box>
  );
};