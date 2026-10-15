import type { Metadata } from "next";

import PortalApplicationView from "@/modules/loan/portal/PortalApplicationView";

export const metadata: Metadata = { title: "My application" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <PortalApplicationView applicationId={Number(id)} />;
}
