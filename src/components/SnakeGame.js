
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

export default function SnakeGame() {
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
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 2147483647,
      width: "100%",
      height: "100dvh",
      background: "#101827",
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "24px 16px",
      paddingTop: "max(24px, env(safe-area-inset-top))",
      paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      boxSizing: "border-box",
      overflowY: "auto",
      overscrollBehavior: "contain",
    }}
  >

      <img
        src="/malidag.png"
        alt="Malidag"
        width={76}
        height={76}
        style={{ borderRadius: 14, objectFit: "contain" }}
      />

      <h1 style={{ color: "#f5d68a", marginBottom: 4 }}>
        Malidag Snake
      </h1>

      <p style={{ color: "#cbd5e1", marginBottom: 20 }}>
        You're offline. Play while we reconnect!
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "min(90vw, 380px)",
          marginBottom: 12,
          color: "#f5d68a",
          fontWeight: "bold",
        }}
      >
        <span>Score: {score}</span>
        <span>{gameOver ? "Game Over" : running ? "Playing" : "Ready"}</span>
      </div>

      <div
        role="img"
        aria-label="Snake game board"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: 2,
          width: "min(90vw, 380px)",
          aspectRatio: "1",
          padding: 6,
          background: "#26344b",
          borderRadius: 12,
          boxSizing: "border-box",
        }}
      >
        {cells}
      </div>

      <button
        type="button"
        onClick={() => {
         if (gameOver || (!running && score === 0)) {
            resetGame();
          } else {
            setRunning((current) => !current);
          }
        }}
        style={{
          marginTop: 20,
          background: "#d5a947",
          color: "#101827",
          border: 0,
          borderRadius: 10,
          padding: "12px 30px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {gameOver ? "Play Again" : running ? "Pause" : score > 0 ? "Resume" : "Play Snake"}
      </button>

      
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 60px)",
    gap: 8,
    justifyContent: "center",
    marginTop: 20,
  }}
>
  {[
    { label: "▲", key: "ArrowUp", column: 2 },
    { label: "◀", key: "ArrowLeft", column: 1 },
    { label: "▼", key: "ArrowDown", column: 2 },
    { label: "▶", key: "ArrowRight", column: 3 },
  ].map((control) => (
    <button
      key={control.key}
      type="button"
      aria-label={control.key.replace("Arrow", "Move ")}
      onClick={() => changeDirection(DIRECTIONS[control.key])}
      style={{
        gridColumn: control.column,
        width: 60,
        height: 52,
        background: "#26344b",
        color: "#f5d68a",
        border: "1px solid #d5a947",
        borderRadius: 10,
        fontSize: 22,
        fontWeight: "bold",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      {control.label}
    </button>
  ))}
</div>


      <p style={{ color: "#94a3b8", fontSize: 13 }}>
        Use arrow keys to move. Press Space to pause.
      </p>
    </div>
  );
}
