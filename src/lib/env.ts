import { participantIssues, participants } from "./participants";

const DEV_SECRET = "dev-secret-solo-para-pruebas-locales-cambialo";
const DEV_ADMIN_PASSWORD = "admin";

export const isProduction = process.env.NODE_ENV === "production";

function readSecret(): string | null {
  const s = process.env.APP_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

export function getAppSecret(): string {
  const s = readSecret();
  if (s) return s;
  if (isProduction) {
    throw new Error("APP_SECRET no esta configurado (minimo 16 caracteres).");
  }
  return DEV_SECRET;
}

export function getAdminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  if (p && p.length >= 6) return p;
  return isProduction ? null : DEV_ADMIN_PASSWORD;
}

export function getDrawSeed(): string {
  const s = process.env.SORTEO_SEED?.trim();
  return s ? s : `${getAppSecret()}:sorteo`;
}

export function hasRedis(): boolean {
  if (process.env.REDIS_URL?.trim()) return true;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}

// Problemas que impiden que la app funcione. Se muestran en vez de la pagina.
export function getCriticalIssues(): string[] {
  const issues: string[] = [];
  if (isProduction && !readSecret()) {
    issues.push(
      "Falta la variable APP_SECRET (minimo 16 caracteres). Generala con: openssl rand -hex 32",
    );
  }
  issues.push(...participantIssues(participants));
  return issues;
}

// Avisos que no bloquean, pero que el organizador debe ver en el panel.
export function getAdminWarnings(): string[] {
  const warnings: string[] = [];
  if (!hasRedis()) {
    warnings.push(
      isProduction
        ? "No hay Redis configurado: el registro de quién ya reveló se pierde en cada despliegue o reinicio, y el límite de intentos del panel deja de funcionar. Conecta un Redis: en Render crea un Key Value y pega su Internal URL en REDIS_URL."
        : "Modo local sin Redis: el registro de revelaciones vive en memoria y se borra al reiniciar el servidor.",
    );
  }
  if (!isProduction) {
    warnings.push(
      `Modo desarrollo: la contraseña del panel es "${DEV_ADMIN_PASSWORD}" si no defines ADMIN_PASSWORD.`,
    );
  }
  return warnings;
}
