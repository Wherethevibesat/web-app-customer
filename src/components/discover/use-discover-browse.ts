"use client";

import { useCallback, useState } from "react";
import type { DiscoverBrowseSection } from "@/lib/types/discover";

export function useDiscoverBrowse() {
  const [open, setOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<
    DiscoverBrowseSection | undefined
  >();

  const openBrowse = useCallback((section?: DiscoverBrowseSection) => {
    setInitialSection(section);
    setOpen(true);
  }, []);

  const closeBrowse = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, initialSection, openBrowse, closeBrowse };
}
