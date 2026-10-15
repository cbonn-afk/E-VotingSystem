import LoanApplicationDetailView from "@/modules/loan/views/LoanApplicationDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <LoanApplicationDetailView applicationId={Number(id)} />;
}
