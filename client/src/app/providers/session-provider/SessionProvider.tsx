'use client'

import {useUserStore} from "@/entities/user";
import {ReactNode, useEffect} from "react";

const SessionInitializer = () => {
  const fetchUser = useUserStore((state) => state.fetchUser)

  useEffect(() => {
    fetchUser().catch(console.error)
  }, []);

  return null
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SessionInitializer />
      {children}
    </>
  );
};