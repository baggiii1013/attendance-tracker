import UserDetailClient from "./UserDetailClient";

export const metadata = {
  title: "User Detail — Admin",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetailClient userId={id} />;
}
