import { SimpleShell } from "@/components/simple-shell";

export default function CompanyPortalPage({ params }: { params: { slug: string } }) {
  return <SimpleShell expectedSlug={params.slug} />;
}
