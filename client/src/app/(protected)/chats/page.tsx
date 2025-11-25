'use client'

import {Button} from "@mantine/core";
import {useUserStore} from "@/entities/user";
import {AppRoutes} from "@/shared/config/routes";
import {useRouter} from "next/navigation";

export default function Chats() {
  const logoutUser = useUserStore((state) => state.logout)
  const router = useRouter()


  const handleLogout = async () => {
    await logoutUser();
    router.refresh();
    router.push(AppRoutes.login);
  };

  return (
    <div>
      <Button onClick={handleLogout} >
        Выйти
      </Button>
    </div>
  );
}
