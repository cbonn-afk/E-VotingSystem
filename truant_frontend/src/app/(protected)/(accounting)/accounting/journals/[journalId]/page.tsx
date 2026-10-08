import JournalDetailView from "@/modules/accounting/views/journals/JournalDetailView";

type PageProps = {
  params: Promise<{ journalId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { journalId } = await params;

  return <JournalDetailView journalId={journalId} />;
}
