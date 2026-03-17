"use client";

import React from "react";
import useScreenSize from "./useIsMobile";
import { usePathname, useRouter } from "next/navigation";

function SpanWarnings() {
  const { isTablet, isDesktop } = useScreenSize();
  const router = useRouter();
  const pathname = usePathname();

  // Show only on homepage
  if (pathname !== "/") return null;

  // Hide on tablet & desktop
  if (isTablet || isDesktop) return null;

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#ddd5",
        padding: "10px 12px",
        textAlign: "center",
        fontSize: "0.9rem",
        lineHeight: "1.4",
      }}
    >
      <span>
        We are displaying products that ship to your location. You can select a
        different location in the menu above.
      </span>

      <span
        onClick={() => router.push("/international-shipping")}
        style={{
          color: "#0b5ed7",
          marginLeft: "6px",
          textDecoration: "underline",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        Learn about international shipping here
      </span>
    </div>
  );
}

export default SpanWarnings;