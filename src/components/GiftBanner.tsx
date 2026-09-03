import { cx } from "./cx";

// El recordatorio que va arriba de cada revelacion.
export default function GiftBanner({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={cx("gift", compact && "gift-compact")} role="note">
      <span className="gift-icon" aria-hidden="true">
        🎁
      </span>
      <div className="gift-body">
        <p className="gift-kicker">Recordatorio oficial</p>
        <p className="gift-text">
          Ya saben: el valor mínimo del regalo es de <strong>30 mil pesos</strong>. Sí, el mismo chiste de
          ese día. <span aria-hidden="true">😏</span>
        </p>
        <p className="gift-fine">Parece chiste, pero no lo es. Que cada quien reciba un buen regalo.</p>
      </div>
    </aside>
  );
}
