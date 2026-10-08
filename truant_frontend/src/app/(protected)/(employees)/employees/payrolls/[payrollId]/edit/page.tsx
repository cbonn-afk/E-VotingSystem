import PayrollEditPageClient from "./PayrollEditPageClient";

export default async function Page({ params }: { params: Promise<{ payrollId: string }> }) {
  const { payrollId } = await params;
  return <PayrollEditPageClient payrollId={payrollId} />;
}
