// Geometria compartida del grafo. Todo en porcentajes 0..100 de un lienzo cuadrado.

export type Point = { x: number; y: number };

// Radio aproximado de un nodo en unidades del lienzo, para que las lineas
// nazcan y mueran en el borde del circulo y no en su centro.
export const NODE_RADIUS = 6.8;

// Los nodos se reparten en un anillo. A partir de 9 personas se alternan
// dos radios para que parezca una constelacion y quepan mas nombres.
// Con 16 o mas, los anillos se separan un poco mas para que no se toquen
// los nodos en un celular angosto.
export function ringPositions(n: number): Point[] {
  const outer = n >= 16 ? 45 : 42;
  const inner = n >= 16 ? 29 : 31;
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = n > 8 ? (i % 2 === 0 ? outer : inner) : 40;
    out.push({ x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) });
  }
  return out;
}

function norm(dx: number, dy: number): Point {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export type Curve = { start: Point; ctrl: Point; end: Point; angleDeg: number };

// Curva cuadratica que se dobla suavemente hacia el centro del lienzo.
export function curveBetween(a: Point, b: Point, bend = 0.28): Curve {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const ctrl = { x: mx + (50 - mx) * bend, y: my + (50 - my) * bend };
  const dirStart = norm(ctrl.x - a.x, ctrl.y - a.y);
  const dirEnd = norm(b.x - ctrl.x, b.y - ctrl.y);
  const start = { x: a.x + dirStart.x * NODE_RADIUS, y: a.y + dirStart.y * NODE_RADIUS };
  const end = { x: b.x - dirEnd.x * (NODE_RADIUS + 1.2), y: b.y - dirEnd.y * (NODE_RADIUS + 1.2) };
  const angleDeg = (Math.atan2(dirEnd.y, dirEnd.x) * 180) / Math.PI;
  return { start, ctrl, end, angleDeg };
}

export function curvePath(c: Curve): string {
  const f = (v: number) => v.toFixed(2);
  return `M ${f(c.start.x)} ${f(c.start.y)} Q ${f(c.ctrl.x)} ${f(c.ctrl.y)} ${f(c.end.x)} ${f(c.end.y)}`;
}

export function edgePath(a: Point, b: Point): string {
  return curvePath(curveBetween(a, b));
}
