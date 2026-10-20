import LoanDetailView from "@/modules/loan/views/LoanDetailView";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <LoanDetailView loanId={Number(id)} />;
}
