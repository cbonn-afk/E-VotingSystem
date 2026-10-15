import BillEditView from "@/modules/accounting/views/bills/BillEditView";

type PageProps = { params: Promise<{ billId: string }> };

export default async function Page({ params }: PageProps) {
  const { billId } = await params;
  return <BillEditView billId={billId} />;
}
