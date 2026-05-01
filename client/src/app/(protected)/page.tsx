import {redirect} from "next/navigation";
import {AppRoutes} from "@/shared/config/routes";
import {JWT_TOKEN_KEY} from "@/shared/constants/cookie";
import {cookies} from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_TOKEN_KEY);

  if (token) {
    redirect(AppRoutes.chats);
  } else {
    redirect(AppRoutes.login);
  }
}
