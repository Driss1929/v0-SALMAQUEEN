import UserProfile from "@/components/UserProfile"

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  return <UserProfile username={username} />
}
