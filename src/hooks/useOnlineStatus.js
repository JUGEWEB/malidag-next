
"use client";

import { useEffect, useState } from "react";

const CHECK_INTERVAL = 5000;
const CHECK_TIMEOUT = 4000;
const MAX_FAILURES = 3;

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;
    let failures = 0;
    let requestId = 0;
    let controller = null;

    const checkConnection = async () => {
      if (!active) return;

      // Invalidate any previous request.
      const currentId = ++requestId;

      controller?.abort();

      if (!navigator.onLine) {
        failures = MAX_FAILURES;
        setIsOnline(false);
        return;
      }

      const currentController = new AbortController();
      controller = currentController;

      const timeout = setTimeout(() => {
        currentController.abort();
      }, CHECK_TIMEOUT);

      try {
        const response = await fetch(
          `/api/connectivity?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: currentController.signal,
          }
        );

        if (!active || currentId !== requestId) return;

        if (response.status === 204) {
          failures = 0;
          setIsOnline(true);
        } else {
          failures += 1;

          if (failures >= MAX_FAILURES) {
            setIsOnline(false);
          }
        }
      } catch {
        if (!active || currentId !== requestId) return;

        failures += 1;

        if (failures >= MAX_FAILURES) {
          setIsOnline(false);
        }
      } finally {
        clearTimeout(timeout);

        if (currentId === requestId) {
          controller = null;
        }
      }
    };

    const handleOffline = () => {
      requestId++;
      controller?.abort();
      controller = null;
      failures = MAX_FAILURES;
      setIsOnline(false);
    };

    const handleOnline = () => {
      failures = 0;
      checkConnection();
    };

    checkConnection();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(
      checkConnection,
      CHECK_INTERVAL
    );

    return () => {
      active = false;
      requestId++;
      controller?.abort();
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
