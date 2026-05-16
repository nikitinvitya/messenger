'use client'

import cls from './SearchUser.module.scss'
import {useEffect, useState} from "react";
import {Input} from "@/shared/ui/Input/ui/Input";
import {useDebouncedValue} from "@mantine/hooks";
import {searchUsers} from "@/entities/user/api/searchUsers";
import {UserSearchResponse} from "@/entities/user/model/model";
import Image from "next/image";
import SearchIcon from "@/shared/assets/SearchIcon.svg"

interface SearchUserProps {
  isActiveSearch: boolean;
  setIsActiveSearch: (state: boolean) => void;
  onSearchUpdate: (results: UserSearchResponse[]) => void;
  className?: string;
}

export const SearchUser = (props: SearchUserProps) => {
  const  {setIsActiveSearch, onSearchUpdate, isActiveSearch} = props
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 300);

  useEffect(() => {
    if(!isActiveSearch) {
      setQuery("")
    }
  }, [isActiveSearch]);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await searchUsers(debouncedQuery);
      onSearchUpdate(users);
    };
    fetchUsers().catch(() => {});
  }, [debouncedQuery, onSearchUpdate])

  return (
    <label className={cls.searchUser}>
      <Image src={SearchIcon.src} alt={"search"} width={40} height={40} className={cls.searchUserIcon}/>
      <Input
        className={cls.searchUserInput}
        placeholder={"Search"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={() => setIsActiveSearch(true)}/>
    </label>
  );
};

