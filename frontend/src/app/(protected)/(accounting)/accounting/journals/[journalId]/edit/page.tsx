import JournalEditView from "@/modules/accounting/views/journals/JournalEditView";

type PageProps = {
  params: Promise<{ journalId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { journalId } = await params;

  return <JournalEditView journalId={journalId} />;
}
