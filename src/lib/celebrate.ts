export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function fireConfetti() {
  if (prefersReducedMotion()) return;
  const confetti = (await import("canvas-confetti")).default;
  const opts = { disableForReducedMotion: true, zIndex: 60, spread: 70, startVelocity: 45 };
  confetti({ ...opts, particleCount: 90, origin: { x: 0.2, y: 0.7 }, angle: 60 });
  confetti({ ...opts, particleCount: 90, origin: { x: 0.8, y: 0.7 }, angle: 120 });
}
