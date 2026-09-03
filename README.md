# Amor y Amistad

Landing para el sorteo de Amor y Amistad: un grafo con todas las personas, un enlace personal para cada quien y un panel privado para el organizador.

## Cómo funciona

- Cada persona recibe un enlace único con la forma `/r/<token>`. El token sale de una firma HMAC con el secreto de la app, así que no se puede adivinar ni deducir del nombre.
- Al abrirlo ve el grafo con todos los nombres y unas líneas de despiste que cambian solas. Al tocar **Revelar mi conexión** se dibuja su conexión real, aparece el recordatorio del regalo y queda registrado con fecha y hora.
- Si vuelve a abrir su enlace, ve otra vez la misma persona, marcada como ya revelada. Queda registrado y no cambia.
- El organizador entra a `/admin` con contraseña y ve todas las conexiones, quién ya reveló y cuándo, y copia el mensaje listo para mandar por WhatsApp, uno por persona.
- El sorteo es determinista: se calcula con el algoritmo de Sattolo a partir del secreto (o de `SORTEO_SEED`). Es un único ciclo, así que nadie se regala a sí mismo, no hay parejas mutuas y todos dan y reciben exactamente un regalo.

## Paso 1: poner a la gente

Edita `src/lib/participants.ts`. Cada persona tiene:

- `name`: como se ve dentro del nodo.
- `slug`: identificador en minúsculas, sin espacios ni tildes. Firma su enlace.

**Cierra la lista antes de repartir enlaces.** Si agregas, quitas o reordenas gente después, el sorteo cambia y el registro de revelaciones arranca de cero (es a propósito: así nadie queda con una conexión vieja que ya no existe).

## Paso 2: probar en local

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Sin variables de entorno, en local se usa un secreto de desarrollo, la contraseña de `/admin` es `admin` y el registro vive en memoria.

Para ver el flujo completo entra a `/admin`, copia el enlace de alguien y ábrelo en otra pestaña.

## Paso 3: subirlo a GitHub

Crea un repositorio **vacío** en GitHub (sin README ni .gitignore). Luego, desde esta carpeta:

```bash
git add .
git commit -m "Landing de Amor y Amistad"
git remote add origin https://github.com/TU_USUARIO/amor-y-amistad.git
git push -u origin main
```

## Paso 4: desplegar en Render

El archivo `render.yaml` ya deja todo definido: el sitio web y su Redis.

1. En Render, **New** y luego **Blueprint**.
2. Conecta el repositorio. Render lee `render.yaml` y te propone dos servicios: `amor-y-amistad` (el sitio) y `amor-y-amistad-kv` (el Redis).
3. Te va a pedir el valor de **`ADMIN_PASSWORD`**: escribe la contraseña con la que vas a entrar al panel. `APP_SECRET` lo genera Render solo, y `REDIS_URL` se conecta solo al Key Value.
4. **Apply**. El primer build tarda unos minutos.
5. Abre `https://amor-y-amistad.onrender.com/admin`, entra con tu contraseña y reparte los enlaces.

### Si prefieres crearlo a mano en vez del blueprint

**New** y luego **Web Service**, apuntando al repositorio, con:

- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`
- Variables: `APP_SECRET` (genera uno con `openssl rand -hex 32`), `ADMIN_PASSWORD`, y `REDIS_URL` con la **Internal URL** del Key Value que crees aparte.

### Dos cosas del plan gratis de Render

- El servicio se duerme tras un rato sin visitas y la primera carga puede tardar cerca de un minuto. Si vas a repartir los enlaces en vivo, abre el sitio un minuto antes para despertarlo.
- El Key Value gratis no guarda los datos para siempre: si Render lo reinicia, se borra el registro de quién ya reveló. **A quién le toca cada quien no cambia**, porque el sorteo se recalcula del secreto; lo único que se pierde es la marca de "ya revelé". Si quieres que eso no pase nunca, usa un Redis gratis de [Upstash](https://upstash.com) y en vez de `REDIS_URL` pon `KV_REST_API_URL` y `KV_REST_API_TOKEN`.

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `APP_SECRET` | Sí en producción | Firma los enlaces y la sesión del panel. Mínimo 16 caracteres. **Si lo cambias después de repartir, todos los enlaces mueren y el sorteo se rehace.** |
| `ADMIN_PASSWORD` | Sí para usar `/admin` | Contraseña del panel. Mínimo 6 caracteres. |
| `REDIS_URL` | Recomendada | Redis por TCP (Render Key Value). |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Alternativa | Redis por REST (Upstash). Se usa si no hay `REDIS_URL`. |
| `SORTEO_SEED` | No | Cambia el sorteo sin cambiar los enlaces. |
| `NEXT_PUBLIC_SITE_URL` | No | Fuerza la URL base de los enlaces del panel. |

Sin ningún Redis la app funciona, pero el registro se pierde en cada reinicio y el límite de intentos del panel deja de servir. El panel te lo avisa arriba.

## Volver a sortear

Define o cambia `SORTEO_SEED` y vuelve a desplegar. Los enlaces siguen siendo los mismos y el registro de revelaciones arranca en cero.

## Estructura

```
src/app/page.tsx            Landing con el grafo de despiste
src/app/r/[token]/page.tsx  Página personal de cada participante
src/app/api/reveal/route.ts Registra la revelación, una sola vez
src/app/admin/              Panel del organizador y su login
src/lib/participants.ts     Lista de personas
src/lib/draw.ts             Sorteo determinista (Sattolo)
src/lib/tokens.ts           Enlaces firmados
src/lib/store.ts            Redis por TCP, por REST, o memoria en local
src/components/Graph.tsx    El grafo: despiste, revelación o vista de admin
render.yaml                 Blueprint de Render (sitio + Key Value)
```
