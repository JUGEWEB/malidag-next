
"use client";

const FIVE_MINUTES = 2 * 60 * 1000;

// For testing only:
// const FIVE_MINUTES = 10 * 1000;

const STORAGE_KEY = "malidag-header-gradient-v1";

let currentGradient = null;
let timer = null;
let subscribers = new Set();
let initialized = false;
let phaseStartedAt = 0;
let isGradientPhase = false;
let brandGradient = null;

const isBrandStorefront = () => {
  if (typeof window === "undefined") return false;

  return /^\/[^/]+\/brand\/(?:theme1|theme2|theme3)(?:\/|$)/i.test(
    window.location.pathname
  );
};

const generateDarkGradient = () => {
  // Exclude yellow and gold hues
  const hueRanges = [
    [0, 15],
    [155, 185],
    [185, 250],
    [250, 290],
    [290, 345],
    [345, 359],
  ];

  const range =
    hueRanges[Math.floor(Math.random() * hueRanges.length)];

  const hue1 =
    range[0] + Math.random() * (range[1] - range[0]);

  const hue2 =
    range[0] + Math.random() * (range[1] - range[0]);

  return `linear-gradient(
    115deg,
    hsl(${hue1}, 65%, 24%),
    hsl(${hue2}, 75%, 42%),
    hsl(${hue1}, 65%, 27%)
  )`;
};

const getBrandGradient = () => {
  if (!brandGradient) {
    brandGradient = generateDarkGradient();
  }

  return brandGradient;
};

const notify = () => {
  subscribers.forEach((callback) => callback());
};

const saveState = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        gradient: currentGradient,
        isGradientPhase,
        phaseStartedAt,
      })
    );
  } catch (error) {
    console.warn("Gradient persistence unavailable:", error);
  }
};

const initialize = () => {
  if (initialized) return;
  initialized = true;

  const now = Date.now();

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );

    if (
      saved &&
      typeof saved.phaseStartedAt === "number" &&
      Number.isFinite(saved.phaseStartedAt) &&
      saved.phaseStartedAt > 0 &&
      typeof saved.isGradientPhase === "boolean" &&
      (saved.gradient === null ||
        typeof saved.gradient === "string")
    ) {
      phaseStartedAt = saved.phaseStartedAt;
      isGradientPhase = saved.isGradientPhase;
      currentGradient = isGradientPhase
        ? saved.gradient || generateDarkGradient()
        : null;

      return;
    }
  } catch (error) {
    console.warn("Could not restore gradient:", error);
  }

  // First visit starts with original background
  phaseStartedAt = now;
  isGradientPhase = false;
  currentGradient = null;
  saveState();
};

const updatePhase = () => {
  const now = Date.now();

  if (now < phaseStartedAt) {
    phaseStartedAt = now;
    isGradientPhase = false;
    currentGradient = null;
    saveState();
    notify();
    return;
  }

  const elapsed = now - phaseStartedAt;
  const passedPhases = Math.floor(elapsed / FIVE_MINUTES);

  if (passedPhases === 0) return;

  phaseStartedAt += passedPhases * FIVE_MINUTES;

  if (passedPhases % 2 === 1) {
    isGradientPhase = !isGradientPhase;
  }

  // Preserve the gradient if the saved phase is still active.
  // Generate a fresh one after advancing into a new gradient phase.
  currentGradient = isGradientPhase
    ? generateDarkGradient()
    : null;

  saveState();
  notify();
};

const scheduleNextPhase = () => {
  if (timer !== null) {
    window.clearTimeout(timer);
  }

  const remaining = Math.max(
    0,
    FIVE_MINUTES - (Date.now() - phaseStartedAt)
  );

  timer = window.setTimeout(() => {
    timer = null;
    updatePhase();

    if (subscribers.size > 0) {
      scheduleNextPhase();
    }
  }, remaining);
};

export const subscribeGradient = () => {
  return () => {};
};

// Gradients disabled globally
export const getGradientSnapshot = () => null;

export const getGradientServerSnapshot = () => null;

export const notifyGradientRouteChange = () => {
  notify();
};
