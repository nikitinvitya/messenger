'use client'

import {useState} from "react";
import {ActionIcon, Affix} from "@mantine/core";
import {CreateGroupModal} from "@/features/create-group";
import cls from "./CreateGroupButton.module.scss"

export const CreateGroupButton = () => {
  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <Affix className={cls.createGroupBtn}>
        <ActionIcon
          onClick={() => setIsOpened(true)}
        >
          <span>+</span>
        </ActionIcon>
      </Affix>

      <CreateGroupModal isOpened={isOpened} onClose={() => setIsOpened(false)}/>
    </>
  )
}