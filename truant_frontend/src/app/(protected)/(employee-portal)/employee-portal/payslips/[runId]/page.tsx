import MyPayslipPrintView from "@/modules/production/views/MyPayslipPrintView";

export default async function MyPayslipPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  return <MyPayslipPrintView payrollRunId={runId} />;
}
