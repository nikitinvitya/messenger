import classNames from 'classnames';
import cls from './ChatListHeader.module.scss'
import {Box, Button, Text} from "@mantine/core";
import {SearchUser} from "@/features/search-user";
import ArrowIcon from '@/shared/assets/ArrowIcon.svg'
import Image from "next/image"

interface ChatListHeaderProps {
  isActiveSearch: boolean;
  setIsActiveSearch: (state: boolean) => void;
  setSearchResults: (results: any[]) => void;
  className?: string;
}

export const ChatListHeader = ({isActiveSearch, setIsActiveSearch, setSearchResults}: ChatListHeaderProps) => {
  return (
    <Box className={classNames(cls.chatListHeader)}>
      {isActiveSearch ?
        <Button className={cls.headerButton} onClick={() => setIsActiveSearch(false)}>
          <Image
            src={ArrowIcon.src}
            fill
            alt={"exit"}
          ></Image>
        </Button>
        :
        <></>
      }

      <SearchUser
        isActiveSearch={isActiveSearch}
        setIsActiveSearch={setIsActiveSearch}
        onSearchUpdate={setSearchResults}/>
    </Box>
  );
};

