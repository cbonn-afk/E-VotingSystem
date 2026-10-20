import type { Metadata } from "next";

import PortalLoanView from "@/modules/loan/portal/PortalLoanView";

export const metadata: Metadata = { title: "My loan" };

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <PortalLoanView loanId={Number(id)} />;
}
