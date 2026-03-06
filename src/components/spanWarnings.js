"use client";

import React from "react";
import useScreenSize from "./useIsMobile";
import { usePathname, useRouter } from "next/navigation";

function SpanWarnings() {
  const { isTablet, isDesktop } = useScreenSize();
  const router = useRouter();
  const pathname = usePathname();

  // Return nothing if not on homepage
  if (pathname !== "/") return null;

  return (
    <div style={{ backgroundColor: "#ddd5", width: "100%", height: "100%" }}>
      {!(isTablet || isDesktop) && (
        <span
          className="span-warningsmall"
          style={{
            backgroundColor: "#ddd5",
            maxWidth: "100%",
            maxHeight: "100%",
            margin: "0px",
          }}
        >
          We are displaying products that ship to your location. You can select a
          different location in the menu above.
          <span
            onClick={() => router.push("/international-shipping")}
            style={{
              color: "blue",
              marginLeft: "5px",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Learn about international shipping here
          </span>
        </span>
      )}
    </div>
  );
}

export default SpanWarnings;
