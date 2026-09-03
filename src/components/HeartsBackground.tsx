// Corazones que suben lentamente al fondo. Posiciones deterministas
// (aritmetica entera) para que servidor y cliente pinten lo mismo.
const COUNT = 14;

function prand(i: number, salt: number): number {
  const v = (i * 9301 + salt * 49297 + 233) % 233280;
  return v / 233280;
}

const HEARTS = Array.from({ length: COUNT }, (_, i) => ({
  x: Math.round(prand(i, 1) * 100),
  size: Math.round(10 + prand(i, 2) * 22),
  duration: Math.round(20 + prand(i, 3) * 22),
  delay: -Math.round(prand(i, 4) * 40),
  drift: Math.round((prand(i, 5) - 0.5) * 60),
}));

export default function HeartsBackground() {
  return (
    <div className="bg-hearts" aria-hidden="true">
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="bg-heart"
          style={
            {
              "--x": `${h.x}%`,
              "--s": `${h.size}px`,
              "--t": `${h.duration}s`,
              "--d": `${h.delay}s`,
              "--drift": `${h.drift}px`,
            } as React.CSSProperties
          }
        >
          <svg viewBox="-4 -4 8 8" width="100%" height="100%">
            <path
              d="M0 3 C-2.4 1.2 -3.6 -0.2 -3.2 -1.6 C-2.8 -2.9 -1.2 -3.2 0 -2 C1.2 -3.2 2.8 -2.9 3.2 -1.6 C3.6 -0.2 2.4 1.2 0 3 Z"
              fill="currentColor"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
