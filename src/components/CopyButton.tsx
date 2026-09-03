"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "./cx";

type Props = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export default function CopyButton({ text, label = "Copiar", copiedLabel = "Copiado", className }: Props) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDone(false), 1600);
    } catch {
      window.prompt("Copia este texto:", text);
    }
  };

  return (
    <button type="button" className={cx("btn btn-small", done && "btn-done", className)} onClick={copy}>
      {done ? copiedLabel : label}
    </button>
  );
}
