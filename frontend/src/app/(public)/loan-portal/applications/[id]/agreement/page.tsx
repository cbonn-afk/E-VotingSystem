import AgreementPrintView from "@/modules/loan/views/AgreementPrintView";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <AgreementPrintView applicationId={Number(id)} audience="member" />;
}
