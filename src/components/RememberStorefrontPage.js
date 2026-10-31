
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RememberStorefrontPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname === "/offline") return;

    // Only save storefront pages, never API or offline routes.
    const excluded = ["/api", "/admin", "/seller", "/login", "/register"];

    if (
      excluded.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      )
    ) {
      return;
    }

    const query = searchParams.toString();
    const page = pathname + (query ? `?${query}` : "");

    sessionStorage.setItem("malidag-last-storefront-page", page);
  }, [pathname, searchParams]);

  return null;
}
