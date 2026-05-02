import { ProfileView } from "@/views/profile";
import { getUserByUsername } from "@/entities/user/api/getUserByUsername";

export default async function ProfileModalPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const targetUser = await getUserByUsername(username);

  return <ProfileView targetUser={targetUser} />;
}