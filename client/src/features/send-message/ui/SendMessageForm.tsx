'use client'

import { useState, useRef } from 'react';
import { sendMessage } from "@/entities/message/api/sendMessage";
import { uploadMedia } from "@/entities/message/api/uploadMedia";
import { useForm } from "@mantine/form";
import Image from "next/image"
import { Box, Button, Textarea, ActionIcon } from "@mantine/core";
import SendIcon from "@/shared/assets/SendIcon.svg"
import AttachIcon from "@/shared/assets/AttachIcon.svg"
import XIcon from "@/shared/assets/XIcon.svg"
import cls from "./SendMessageForm.module.scss"
import {BASE_URL} from "@/shared/constants/api";

interface SendMessageFormProps {
  className?: string;
  chatID: number;
}

export const SendMessageForm = ({ chatID }: SendMessageFormProps) => {
  const [isUploading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    initialValues: { content: '' },
  });

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
      await sendMessage(chatID, {
        content: values.content,
        imageURL: imageUrl || undefined
      });
      form.reset();
      setImageUrl(null);
    } catch (error) {
      console.error("Failed to send message");
    }
  }

  const SERVER_URL = BASE_URL!.replace("/api/v1", "")

  return (
    <Box className={cls.container}>
      {imageUrl && (
        <Box className={cls.previewWrapper}>
          <div className={cls.previewItem}>
            <img src={`${SERVER_URL}${imageUrl}`} alt="preview" />
            <ActionIcon
              className={cls.removeBtn}
              onClick={() => setImageUrl(null)}
              variant="filled"
              color="red"
              size="xs"
            >
              <Image src={XIcon.src} width={12} height={12} alt="remove" />
            </ActionIcon>
          </div>
        </Box>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)} className={cls.formWrapper}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <ActionIcon
          onClick={() => fileInputRef.current?.click()}
          variant="subtle"
          size="xl"
          loading={isUploading}
          className={cls.attachBtn}
        >
          <Image src={AttachIcon.src} width={24} height={24} alt="attach"/>
        </ActionIcon>

        <Textarea
          className={cls.sendForm}
          autosize
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
          <Image src={SendIcon} width={30} height={30} alt="send" />
        </Button>
      </form>
    </Box>
  );
};