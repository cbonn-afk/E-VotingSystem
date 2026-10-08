import RoleFormView from "@/modules/users/views/RoleFormView";

type PageProps = {
  params: Promise<{ roleId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { roleId } = await params;

  return <RoleFormView mode="edit" roleId={roleId} />;
}
