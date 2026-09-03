export default function SetupNotice({ issues }: { issues: string[] }) {
  return (
    <section className="card setup">
      <p className="card-kicker">Falta configurar algo</p>
      <h1 className="modal-title">La app todavía no puede arrancar</h1>
      <ul className="setup-list">
        {issues.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <p className="note">
        En Render: Environment, y agrega la variable. Después de guardar, vuelve a desplegar.
      </p>
    </section>
  );
}
