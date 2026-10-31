
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Keep production disabled until final testing is complete.
    const ENABLE_PRODUCTION_OFFLINE = true;

    const isLocalhost =
      window.location.hostname === "localhost";

    if (!isLocalhost && !ENABLE_PRODUCTION_OFFLINE) {
      return;
    }

    const registerWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });

        console.log(
          "Malidag service worker registered:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "Malidag service worker registration failed:",
          error
        );
      }
    };

    registerWorker();
  }, []);

  return null;
}
