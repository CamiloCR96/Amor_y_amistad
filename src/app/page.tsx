import Graph from "@/components/Graph";
import GiftBanner from "@/components/GiftBanner";
import { publicPeople } from "@/lib/participants";

export default function Home() {
  const people = publicPeople();
  return (
    <>
      <header className="hero">
        <p className="eyebrow">Septiembre · Celebración secreta</p>
        <h1 className="title">
          Amor <em>y</em> Amistad
        </h1>
        <p className="lede">
          Una red de conexiones secretas entre {people.length} personas. Cada quien recibe un enlace
          personal, lo abre y descubre a quién le toca consentir.
        </p>
      </header>

      <section className="stage">
        <Graph people={people} mode="tease" />
        <p className="hint">
          Las líneas que ves son puro despiste. Las conexiones de verdad solo aparecen en tu enlace
          personal.
        </p>
      </section>

      <section className="stack">
        <GiftBanner />
        <p className="note">
          ¿Ya tienes tu enlace? Ábrelo desde el mensaje que te llegó. Si no te ha llegado, reclama.
        </p>
      </section>
    </>
  );
}
