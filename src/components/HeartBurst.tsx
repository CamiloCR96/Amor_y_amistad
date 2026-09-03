"use client";

const EMOJI = ["💖", "💘", "💗", "❤️", "💝", "🩷", "✨"];
const COUNT = 30;

function prand(i: number, salt: number): number {
  const v = (i * 7919 + salt * 104729 + 17) % 65521;
  return v / 65521;
}

const PIECES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + prand(i, 1) * 0.5;
  const dist = 140 + prand(i, 2) * 260;
  return {
    emoji: EMOJI[i % EMOJI.length],
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist * 0.8) - 60,
    rot: Math.round((prand(i, 3) - 0.5) * 240),
    delay: Math.round(prand(i, 4) * 350),
    size: Math.round(18 + prand(i, 5) * 22),
  };
});

export default function HeartBurst() {
  return (
    <div className="burst" aria-hidden="true">
      {PIECES.map((p, i) => (
        <i
          key={i}
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--r": `${p.rot}deg`,
              "--d": `${p.delay}ms`,
              "--s": `${p.size}px`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </i>
      ))}
    </div>
  );
}
