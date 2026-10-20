import PaymentReceiptView from "@/modules/loan/views/PaymentReceiptView";

type PageProps = { params: Promise<{ id: string; paymentId: string }> };

export default async function Page({ params }: PageProps) {
  const { id, paymentId } = await params;

  return <PaymentReceiptView loanId={Number(id)} paymentId={Number(paymentId)} />;
}
