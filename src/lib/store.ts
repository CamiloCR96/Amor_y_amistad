import IORedis from "ioredis";
import { Redis } from "@upstash/redis";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface Store {
  readonly kind: "redis" | "memory";
  // Guarda solo si la clave no existe. Devuelve el valor que quedo guardado.
  setIfAbsent<T extends JsonValue>(key: string, value: T): Promise<T>;
  getMany<T extends JsonValue>(keys: string[]): Promise<(T | null)[]>;
  incrWithTtl(key: string, ttlSeconds: number): Promise<number>;
}

class RedisStore implements Store {
  readonly kind = "redis" as const;
  constructor(private readonly r: Redis) {}

  async setIfAbsent<T extends JsonValue>(key: string, value: T): Promise<T> {
    const ok = await this.r.set(key, value, { nx: true });
    if (ok === "OK") return value;
    const existing = await this.r.get<T>(key);
    return existing ?? value;
  }

  async getMany<T extends JsonValue>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    return this.r.mget<(T | null)[]>(...keys);
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const n = await this.r.incr(key);
    // Se refresca siempre: si el EXPIRE del primer INCR fallara, la clave
    // quedaria sin vencimiento y esa IP no podria volver a entrar nunca.
    await this.r.expire(key, ttlSeconds);
    return n;
  }
}

// Redis por TCP (Render Key Value, Railway, un Redis propio). Next corre como
// servidor de larga vida, asi que una conexion persistente es lo natural.
class TcpRedisStore implements Store {
  readonly kind = "redis" as const;
  constructor(private readonly r: IORedis) {}

  async setIfAbsent<T extends JsonValue>(key: string, value: T): Promise<T> {
    const payload = JSON.stringify(value);
    const ok = await this.r.set(key, payload, "NX");
    if (ok === "OK") return value;
    const existing = await this.r.get(key);
    return existing ? (JSON.parse(existing) as T) : value;
  }

  async getMany<T extends JsonValue>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const raw = await this.r.mget(keys);
    return raw.map((v) => {
      if (!v) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return null;
      }
    });
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const n = await this.r.incr(key);
    await this.r.expire(key, ttlSeconds);
    return n;
  }
}

type MemoryEntry = { value: JsonValue; expiresAt: number | null };

class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private readonly map = new Map<string, MemoryEntry>();

  private live(key: string): MemoryEntry | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && e.expiresAt <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    return e;
  }

  async setIfAbsent<T extends JsonValue>(key: string, value: T): Promise<T> {
    const e = this.live(key);
    if (e) return e.value as T;
    this.map.set(key, { value, expiresAt: null });
    return value;
  }

  async getMany<T extends JsonValue>(keys: string[]): Promise<(T | null)[]> {
    return keys.map((k) => (this.live(k)?.value as T | undefined) ?? null);
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const e = this.live(key);
    const n = (typeof e?.value === "number" ? e.value : 0) + 1;
    this.map.set(key, {
      value: n,
      expiresAt: e?.expiresAt ?? Date.now() + ttlSeconds * 1000,
    });
    return n;
  }
}

const g = globalThis as unknown as { __ayaStore?: Store };

export function getStore(): Store {
  if (g.__ayaStore) return g.__ayaStore;

  // 1) Redis por TCP: Render Key Value y compatibles.
  const tcpUrl = process.env.REDIS_URL?.trim();
  if (tcpUrl) {
    g.__ayaStore = new TcpRedisStore(
      new IORedis(tcpUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
        // Render entrega la instancia por TLS cuando la URL es rediss://
        ...(tcpUrl.startsWith("rediss://") ? { tls: {} } : {}),
      }),
    );
    return g.__ayaStore;
  }

  // 2) Redis por REST: Upstash.
  const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (restUrl && restToken) {
    g.__ayaStore = new RedisStore(new Redis({ url: restUrl, token: restToken }));
    return g.__ayaStore;
  }

  // 3) Memoria: sirve para probar en local, no para produccion.
  if (process.env.NODE_ENV === "production") {
    console.warn("[amor-y-amistad] Sin Redis: usando memoria. El estado se pierde entre reinicios.");
  }
  g.__ayaStore = new MemoryStore();
  return g.__ayaStore;
}
