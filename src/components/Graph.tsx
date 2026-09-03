"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { curveBetween, curvePath, ringPositions, type Curve } from "@/lib/layout";
import { cx } from "./cx";

export type GraphPerson = { slug: string; name: string };
export type GraphEdge = { from: string; to: string };

type Props = {
  people: GraphPerson[];
  mode: "tease" | "reveal" | "admin";
  meSlug?: string;
  // En modo reveal: la conexion que se dibuja. Null mientras no se ha revelado.
  reveal?: GraphEdge | null;
  // En modo admin: todas las conexiones reales.
  edges?: GraphEdge[];
  onSelfClick?: () => void;
};

const DECOY_MS = 2700;
const HEART_PATH =
  "M0 3 C-2.4 1.2 -3.6 -0.2 -3.2 -1.6 C-2.8 -2.9 -1.2 -3.2 0 -2 C1.2 -3.2 2.8 -2.9 3.2 -1.6 C3.6 -0.2 2.4 1.2 0 3 Z";
const ARROW_PATH = "M0 0 L-2.6 1.4 L-2.6 -1.4 Z";
const EDGE_HUES = [340, 28, 45, 280, 200, 160];

function randomPairs(n: number, k: number): [number, number][] {
  const pairs: [number, number][] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (pairs.length < k && guard++ < 300) {
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (a === b) continue;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([a, b]);
  }
  return pairs;
}

// El tamaño se decide por la palabra mas larga: un nombre compuesto como
// "Juan Carlos" parte en dos lineas en vez de encogerse.
function nameSize(name: string): string {
  const longest = Math.max(...name.trim().split(/\s+/).map((w) => w.length));
  const ratio = longest <= 6 ? 0.21 : longest <= 8 ? 0.185 : longest <= 10 ? 0.155 : 0.13;
  return `calc(var(--node) * ${ratio})`;
}

function fmt(v: number): string {
  return v.toFixed(2);
}

function Arrow({ curve, className }: { curve: Curve; className?: string }) {
  return (
    <path
      className={cx("edge-arrow", className)}
      d={ARROW_PATH}
      transform={`translate(${fmt(curve.end.x)} ${fmt(curve.end.y)}) rotate(${curve.angleDeg.toFixed(1)})`}
    />
  );
}

export default function Graph({ people, mode, meSlug, reveal = null, edges = [], onSelfClick }: Props) {
  const positions = useMemo(() => ringPositions(people.length), [people.length]);
  const index = useMemo(() => new Map(people.map((p, i) => [p.slug, i] as const)), [people]);
  const [decoys, setDecoys] = useState<{ id: number; pairs: [number, number][] }>({ id: 0, pairs: [] });
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const motionRef = useRef<SVGAnimateMotionElement>(null);

  const focus = mode === "admin" ? (pinned ?? hover) : null;
  const teasing = mode === "tease" || (mode === "reveal" && !reveal);

  // Lineas de despiste: parejas al azar que aparecen y se desvanecen.
  useEffect(() => {
    if (!teasing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const k = Math.min(6, Math.max(2, Math.floor(people.length / 2)));
    let id = 0;
    const roll = () => {
      if (document.hidden) return;
      setDecoys({ id: ++id, pairs: randomPairs(people.length, k) });
    };
    roll();
    const timer = window.setInterval(roll, DECOY_MS);
    return () => window.clearInterval(timer);
  }, [teasing, people.length]);

  const revealCurve = useMemo(() => {
    if (!reveal) return null;
    const a = index.get(reveal.from);
    const b = index.get(reveal.to);
    if (a === undefined || b === undefined) return null;
    return curveBetween(positions[a], positions[b]);
  }, [reveal, index, positions]);

  // El corazon recorre la linea. SMIL con begin="indefinite" para arrancarlo
  // a mano: si el SVG ya estaba montado, un begin fijo se habria perdido.
  useEffect(() => {
    if (!revealCurve) return;
    const el = motionRef.current;
    if (!el) return;
    const timer = window.setTimeout(() => el.beginElement(), 350);
    return () => window.clearTimeout(timer);
  }, [revealCurve]);

  const adminCurves = useMemo(() => {
    if (mode !== "admin") return [];
    return edges.flatMap((e, i) => {
      const a = index.get(e.from);
      const b = index.get(e.to);
      if (a === undefined || b === undefined) return [];
      return [{ ...e, curve: curveBetween(positions[a], positions[b]), hue: EDGE_HUES[i % EDGE_HUES.length] }];
    });
  }, [mode, edges, index, positions]);

  const isRelated = (slug: string) =>
    focus !== null &&
    (slug === focus || edges.some((e) => (e.from === focus && e.to === slug) || (e.to === focus && e.from === slug)));

  return (
    <div
      className={cx("graph", `graph-${mode}`, reveal && "graph-revealed", focus && "graph-focus")}
      onMouseLeave={mode === "admin" ? () => setHover(null) : undefined}
    >
      <svg className="graph-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs>
          {revealCurve && (
            <linearGradient
              id="aya-reveal-grad"
              gradientUnits="userSpaceOnUse"
              x1={fmt(revealCurve.start.x)}
              y1={fmt(revealCurve.start.y)}
              x2={fmt(revealCurve.end.x)}
              y2={fmt(revealCurve.end.y)}
            >
              <stop offset="0" stopColor="#ff5d8f" />
              <stop offset="1" stopColor="#f4c76b" />
            </linearGradient>
          )}
        </defs>

        {teasing &&
          decoys.pairs.map(([a, b], i) => (
            <path
              key={`${decoys.id}-${i}`}
              className="edge edge-decoy"
              d={curvePath(curveBetween(positions[a], positions[b]))}
              style={{ animationDelay: `${i * 110}ms, 0ms` }}
            />
          ))}

        {adminCurves.map((e) => {
          const hot = focus !== null && (e.from === focus || e.to === focus);
          return (
            <g
              key={`${e.from}>${e.to}`}
              className={cx("edge-admin", hot && "edge-hot")}
              style={{ color: `hsl(${e.hue} 88% 74%)` }}
            >
              <path className="edge" d={curvePath(e.curve)} />
              <Arrow curve={e.curve} />
            </g>
          );
        })}

        {revealCurve && (
          <g className="edge-reveal-group">
            <path id="aya-reveal-path" className="edge edge-reveal" d={curvePath(revealCurve)} pathLength={1} />
            <Arrow curve={revealCurve} className="edge-arrow-reveal" />
            <path className="edge-heart" d={HEART_PATH}>
              <animateMotion
                ref={motionRef}
                dur="1.6s"
                begin="indefinite"
                fill="freeze"
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.45 0 0.2 1"
              >
                <mpath href="#aya-reveal-path" />
              </animateMotion>
            </path>
          </g>
        )}
      </svg>

      {people.map((p, i) => {
        const at = positions[i];
        const isMe = p.slug === meSlug;
        const isTarget = reveal?.to === p.slug;
        const lit = reveal ? isMe || isTarget : false;
        const selfClickable = mode === "reveal" && isMe && !reveal && Boolean(onSelfClick);
        const clickable = selfClickable || mode === "admin";
        const className = cx(
          "node",
          isMe && "node-me",
          lit && "node-lit",
          reveal && !lit && "node-dim",
          isTarget && "node-target",
          focus !== null && (isRelated(p.slug) ? "node-hot" : "node-cold"),
          pinned === p.slug && "node-pinned",
        );
        const style = { left: `${at.x}%`, top: `${at.y}%`, "--i": i } as CSSProperties;
        const body = (
          <span className="node-body" data-hue={i % 4}>
            <span className="node-name" style={{ fontSize: nameSize(p.name) }}>
              {p.name}
            </span>
          </span>
        );
        const tag = isTarget ? (
          <span className="node-tag node-tag-gold">tu conexión</span>
        ) : isMe ? (
          <span className="node-tag">tú</span>
        ) : null;

        if (!clickable) {
          return (
            <div key={p.slug} className={className} style={style}>
              {body}
              {tag}
            </div>
          );
        }

        return (
          <button
            key={p.slug}
            type="button"
            className={className}
            style={style}
            aria-label={mode === "admin" ? `Ver conexiones de ${p.name}` : `Revelar mi conexión, ${p.name}`}
            onClick={() => {
              if (mode === "admin") setPinned((v) => (v === p.slug ? null : p.slug));
              else onSelfClick?.();
            }}
            onMouseEnter={mode === "admin" ? () => setHover(p.slug) : undefined}
            onFocus={mode === "admin" ? () => setHover(p.slug) : undefined}
            onBlur={mode === "admin" ? () => setHover(null) : undefined}
          >
            {body}
            {tag}
          </button>
        );
      })}
    </div>
  );
}
