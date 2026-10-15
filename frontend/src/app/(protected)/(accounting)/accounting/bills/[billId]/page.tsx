import BillDetailView from "@/modules/accounting/views/bills/BillDetailView";

type PageProps = { params: Promise<{ billId: string }> };

export default async function Page({ params }: PageProps) {
  const { billId } = await params;
  return <BillDetailView billId={billId} />;
}
