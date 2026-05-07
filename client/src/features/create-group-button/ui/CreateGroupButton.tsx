'use client'

import {useState} from "react";
import {ActionIcon, Affix, Box} from "@mantine/core";
import {CreateGroupModal} from "@/features/create-group";
import cls from "./CreateGroupButton.module.scss"

export const CreateGroupButton = () => {
  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <Box className={cls.createGroupBtnWrapper}>
        <ActionIcon
          onClick={() => setIsOpened(true)}
          className={cls.actionIcon}
        >
          <span>+</span>
        </ActionIcon>
      </Box>

      <CreateGroupModal isOpened={isOpened} onClose={() => setIsOpened(false)}/>
    </>
  )
}