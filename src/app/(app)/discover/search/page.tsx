import { SearchBrowseView } from "@/components/pages/search-browse-view";

export default function DiscoverSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; neighborhood?: string }>;
}) {
  return <SearchBrowseView basePath="/discover/search" searchParams={searchParams} />;
}
