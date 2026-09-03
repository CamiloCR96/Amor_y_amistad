import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card setup notfound">
      <p className="card-kicker">Ups</p>
      <h1 className="modal-title">Este enlace no es válido</h1>
      <p className="modal-copy">
        Puede que esté incompleto o que no sea tuyo. Revisa el mensaje que te enviaron y abre el enlace
        completo.
      </p>
      <Link href="/" className="btn btn-ghost">
        Ir al inicio
      </Link>
    </section>
  );
}
