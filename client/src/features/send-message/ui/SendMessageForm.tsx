'use client'
import cls from './SendMessageForm.module.scss'
import {sendMessage} from "@/entities/message/api/sendMessage";
import {useForm} from "@mantine/form";
import Image from "next/image"
import {Box, Button, Textarea} from "@mantine/core";
import SendIcon from "@/shared/assets/SendIcon.svg"

interface SendMessageFormProps {
  className?: string;
  chatID: number;
}

export const SendMessageForm = ({chatID}: SendMessageFormProps) => {

  const form = useForm({
    initialValues: { content: '' },
  });


  const handleSubmit = async (values: {content: string}) => {
    if(!values.content.trim()) {
      return
    }
    try {
      await sendMessage(chatID, {content: values.content})
      form.reset()
    } catch (error) {
      console.error("Failed to send message")
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={cls.formWrapper}>
        <Textarea
          className={cls.sendForm}
          autosize={true}
          maxRows={10}
          placeholder="Message"
          {...form.getInputProps('content')}
        />

        <Button type="submit" className={cls.sendBtn}>
          <Image
            src={SendIcon}
            width={30}
            height={30}
            alt="send"
            className={cls.sendImage}/>
        </Button>
    </form>
  );
};

