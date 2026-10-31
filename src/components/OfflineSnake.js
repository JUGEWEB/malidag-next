
"use client";

import { useEffect, useState } from "react";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import SnakeGame from "@/components/SnakeGame";

export default function OfflineSnake() {
  const isOnline = useOnlineStatus();

  const [showGame, setShowGame] = useState(false);
  const [connectionRestored, setConnectionRestored] = useState(false);

  // Wait 3 seconds before showing the offline game.
  useEffect(() => {
    if (!isOnline) {
      setConnectionRestored(false);

      const timer = setTimeout(() => {
        setShowGame(true);
      }, 3000);

      return () => clearTimeout(timer);
    }

    if (showGame) {
      setConnectionRestored(true);
    }
  }, [isOnline, showGame]);

  // Prevent scrolling the marketplace behind the game.
  useEffect(() => {
    if (!showGame) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showGame]);

  if (!showGame) return null;

  return (
    <>
      <SnakeGame />

      {connectionRestored && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            background: "rgba(16, 24, 39, 0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <h2 style={{ color: "#f5d68a", fontSize: 28 }}>
            You're back online! 🎉
          </h2>

          <p style={{ marginBottom: 24 }}>
            Your shopping adventure continues.
          </p>

          <button
            type="button"
            onClick={() => {
              setShowGame(false);
              setConnectionRestored(false);
            }}
            style={{
              background: "#d5a947",
              color: "#101827",
              border: 0,
              borderRadius: 10,
              padding: "14px 28px",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Back to Malidag
          </button>
        </div>
      )}
    </>
  );
}
