"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function useScrollResetOnNavigate() {
  const pathname = usePathname(); // ✅ This is how Next.js 13+ tracks route changes in the app router

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]); // ✅ Will run every time the route path changes
}
