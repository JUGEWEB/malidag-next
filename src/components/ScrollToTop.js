"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    const el = document.getElementById("scrollable-content");
    if (el?.scrollTo) {
      el.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
}
