
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import styles from "./SnakeGame.module.css";

const GRID_SIZE = 16;
const INITIAL_SNAKE = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
];

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

function randomFood(snake) {
  const empty = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!snake.some((part) => part.x === x && part.y === y)) {
        empty.push({ x, y });
      }
    }
  }

  if (!empty.length) return null;

  return empty[Math.floor(Math.random() * empty.length)];
}

export default function SnakeGame({ standalone = false }) {
      const isOnline = useOnlineStatus();
  const [returning, setReturning] = useState(false);

  const returnToMalidag = async () => {
    if (returning) return;

    setReturning(true);

    try {
      const response = await fetch(
        `/api/connectivity?t=${Date.now()}`,
        { cache: "no-store" }
      );

      if (response.status !== 204) {
        throw new Error("Connection not restored");
      }

      // Restore the last storefront page when available.
      const previousPage = sessionStorage.getItem(
        "malidag-last-storefront-page"
      );

     const destination =
  previousPage &&
  previousPage.startsWith("/") &&
  !previousPage.startsWith("//") &&
  !previousPage.includes("\\") &&
  !previousPage.startsWith("/offline") &&
  !previousPage.startsWith("/api/") &&
  !previousPage.startsWith("/admin") &&
  !previousPage.startsWith("/seller")
    ? previousPage
    : "/";

window.location.assign(destination);

    } catch {
      alert("Malidag is still unreachable. Please try again.");
      setReturning(false);
    }
  };
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 11, y: 8 });
  const [direction, setDirection] = useState(DIRECTIONS.ArrowRight);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const directionRef = useRef(DIRECTIONS.ArrowRight);
  const directionChangedRef = useRef(false);
  const foodRef = useRef(food);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

const changeDirection = useCallback((next) => {
  if (directionChangedRef.current) return;

  const current = directionRef.current;

  if (
    next.x === -current.x &&
    next.y === -current.y
  ) {
    return;
  }

  directionRef.current = next;
  directionChangedRef.current = true;
  setDirection(next);
}, []);


  const resetGame = () => {
    const initial = INITIAL_SNAKE.map((part) => ({ ...part }));

    setSnake(initial);
    setFood({ x: 11, y: 8 });
    foodRef.current = { x: 11, y: 8 };
    directionRef.current = DIRECTIONS.ArrowRight;
    directionChangedRef.current = false;
    setDirection(DIRECTIONS.ArrowRight);
    setScore(0);
    setGameOver(false);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || gameOver) return;

    const handleKey = (event) => {
      if (DIRECTIONS[event.key]) {
        event.preventDefault();
        changeDirection(DIRECTIONS[event.key]);
      }

      if (event.code === "Space") {
        event.preventDefault();
        setRunning(false);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [running, gameOver, changeDirection]);

  useEffect(() => {
    if (!running || gameOver) return;

    const timer = setInterval(() => {
     setSnake((previous) => {
  directionChangedRef.current = false;

  const nextDirection = directionRef.current;
        const head = previous[0];

        const newHead = {
          x: head.x + nextDirection.x,
          y: head.y + nextDirection.y,
        };

        const currentFood = foodRef.current;

        const eating =
          currentFood &&
          newHead.x === currentFood.x &&
          newHead.y === currentFood.y;

        const body = eating ? previous : previous.slice(0, -1);

        const hitWall =
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE;

        const hitBody = body.some(
          (part) => part.x === newHead.x && part.y === newHead.y
        );

        if (hitWall || hitBody) {
          setGameOver(true);
          setRunning(false);
          return previous;
        }

        const nextSnake = [newHead, ...body];

        if (eating) {
          setScore((current) => current + 10);
          const nextFood = randomFood(nextSnake);
          foodRef.current = nextFood;
          setFood(nextFood);

          if (!nextFood) {
            setGameOver(true);
            setRunning(false);
          }
        }

        return nextSnake;
      });
    }, 160);

    return () => clearInterval(timer);
  }, [running, gameOver]);

  const cells = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isHead = snake[0].x === x && snake[0].y === y;
      const isSnake = snake.some(
        (part) => part.x === x && part.y === y
      );
      const isFood = food && food.x === x && food.y === y;

      cells.push(
        <div
          key={`${x}-${y}`}
          style={{
            background: isHead
              ? "#ffe39a"
              : isSnake
              ? "#d5a947"
              : isFood
              ? "#fb7185"
              : "#192538",
            borderRadius: isSnake || isFood ? "25%" : "0",
          }}
        />
      );
    }
  }


  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <img
          src="/malidag.png"
          alt="Malidag"
          className={styles.logo}
        />

        <div>
          <h1 className={styles.title}>Malidag Snake</h1>
          <p className={styles.subtitle}>
            You're offline. Play while we reconnect!
          </p>
        </div>
      </div>

      <div className={styles.scoreBar}>
        <span>Score: {score}</span>
        <span>
          {gameOver ? "Game Over" : running ? "Playing" : "Ready"}
        </span>
      </div>

      <div
        role="img"
        aria-label="Snake game board"
        className={styles.board}
      >
        {cells}
      </div>

      <div className={styles.controls}>
        {[
          { label: "▲", key: "ArrowUp", column: 2, row: 1 },
          { label: "◀", key: "ArrowLeft", column: 1, row: 2 },
          { label: "▶", key: "ArrowRight", column: 3, row: 2 },
          { label: "▼", key: "ArrowDown", column: 2, row: 3 },
        ].map((control) => (
          <button
            key={control.key}
            type="button"
            aria-label={control.key.replace("Arrow", "Move ")}
            className={styles.directionButton}
            style={{
              gridColumn: control.column,
              gridRow: control.row,
            }}
            onClick={() =>
              changeDirection(DIRECTIONS[control.key])
            }
          >
            {control.label}
          </button>
        ))}

        <button
          type="button"
          className={styles.playButton}
          onClick={() => {
            if (gameOver || (!running && score === 0)) {
              resetGame();
            } else {
              setRunning((current) => !current);
            }
          }}
        >
          {gameOver
            ? "Restart"
            : running
              ? "Pause"
              : score > 0
                ? "Resume"
                : "Play"}
        </button>
      </div>

      <p className={styles.help}>
        Arrow keys to move · Space to pause
      </p>

      {standalone && isOnline && (
        <button
          type="button"
          onClick={returnToMalidag}
          disabled={returning}
          className={styles.returnButton}
        >
          {returning ? "Connecting..." : "Back to Malidag →"}
        </button>
      )}
    </div>
  );
}
