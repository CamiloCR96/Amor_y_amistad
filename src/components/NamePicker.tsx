"use client";

import { useMemo, useState } from "react";
import { cx } from "./cx";

export type PickablePerson = { slug: string; name: string; taken: boolean };

type Props = {
  people: PickablePerson[];
  onPick: (slug: string) => void;
  disabled?: boolean;
};

// Quita tildes para que buscar "fabian" encuentre "Fabián".
function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function NamePicker({ people, onPick, disabled = false }: Props) {
  const [query, setQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const shown = useMemo(() => {
    const q = plain(query);
    if (!q) return people;
    return people.filter((p) => plain(p.name).includes(q));
  }, [people, query]);

  const pending = people.filter((p) => !p.taken).length;

  return (
    <section className="picker">
      <p className="card-kicker">Primero lo primero</p>
      <h2 className="picker-title">¿Quién eres?</h2>
      <p className="picker-lede">
        Busca tu nombre y tócalo. Solo se puede una vez, así que elige el tuyo de verdad.
      </p>

      <input
        type="search"
        className="picker-search"
        placeholder="Escribe tu nombre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar mi nombre"
        autoComplete="off"
      />

      <ul className="picker-grid">
        {shown.map((p) => (
          <li key={p.slug}>
            <button
              type="button"
              className={cx("picker-name", p.taken && "picker-name-taken")}
              onClick={() => onPick(p.slug)}
              disabled={disabled || p.taken}
              aria-label={p.taken ? `${p.name}, ya reveló` : `Soy ${p.name}`}
            >
              <span className="picker-name-text">{p.name}</span>
              {p.taken && <span className="picker-badge">ya reveló</span>}
            </button>
          </li>
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="picker-empty">
          No hay ningún nombre que se parezca a <strong>{query}</strong>.
        </p>
      )}

      <p className="picker-count">
        Faltan <strong>{pending}</strong> de {people.length} por revelar.
      </p>

      <button type="button" className="picker-help-link" onClick={() => setShowHelp((v) => !v)}>
        No encuentro mi nombre
      </button>

      {showHelp && (
        <div className="picker-help" role="note">
          <p>
            <strong>Entonces no sigas.</strong> No elijas un nombre que no sea tuyo: le dañarías la sorpresa
            a esa persona y quedaría registrado como si ya hubiera revelado.
          </p>
          <p>
            Fíjate primero si estás con un apodo o con el nombre escrito de otra forma. Si de verdad no
            estás en la lista, escríbele al organizador para que te agregue con tu nombre correcto y te
            avise cuando ya puedas entrar.
          </p>
        </div>
      )}
    </section>
  );
}
