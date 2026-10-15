import VendorDetailView from "@/modules/accounting/views/vendors/VendorDetailView";

type PageProps = { params: Promise<{ vendorId: string }> };

export default async function Page({ params }: PageProps) {
  const { vendorId } = await params;
  return <VendorDetailView vendorId={vendorId} />;
}
