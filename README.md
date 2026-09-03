# Amor y Amistad

Landing para el sorteo de Amor y Amistad: un grafo con todas las personas, un enlace personal para cada quien y un panel privado para el organizador.

## Cómo funciona

**Un solo enlace para todo el grupo.** Lo pegas en el chat y ya.

- Quien lo abre ve el grafo con todos los nombres y una lista para buscar el suyo.
- Elige su nombre, confirma que es esa persona, y se le dibuja su conexión con el recordatorio del regalo. Queda registrado con fecha y hora.
- Ese nombre queda tomado: si otro entra después y toca el mismo, le sale que esa persona ya reveló. Nadie ve la conexión de nadie más.
- El teléfono se acuerda de quién eres, así que puede volver a abrir el enlace y ver su persona otra vez.
- Si su nombre no está en la lista, le sale un aviso pidiéndole que no siga y que hable con el organizador.
- El organizador entra a `/admin` con contraseña y ve todo en vivo: quién ya eligió, a quién le toca cada quien, y puede reiniciar votos si algo se enreda.

El sorteo se calcula completo desde el principio con el algoritmo de Sattolo, a partir del secreto (o de `SORTEO_SEED`). Por eso es imposible que se repita alguien o que el último quede sin opciones: es un único ciclo donde nadie se regala a sí mismo, no hay parejas mutuas y todos dan y reciben exactamente un regalo. Lo que va pasando cuando la gente elige es solo destapar lo que ya estaba decidido.

### Enlaces privados, por si acaso

Además del enlace del grupo, cada persona tiene uno propio con la forma `/r/<token>` que la identifica sola, sin tener que elegir su nombre. Los ves en la tabla del panel. Sirven si alguien tocó el nombre equivocado o si prefieres mandárselo aparte a alguien.

## Paso 1: poner a la gente

Edita `src/lib/participants.ts`. Cada persona tiene:

- `name`: como se ve dentro del nodo y en la lista.
- `slug`: identificador en minúsculas, sin espacios ni tildes.

**Cierra la lista antes de mandar el enlace.** Si agregas, quitas o reordenas gente después, el sorteo cambia y el registro arranca de cero (es a propósito: así nadie queda con una conexión vieja que ya no existe).

### Amarrar conexiones a mano

En el mismo archivo, `fixedEdges` deja fijar parejas concretas. El resto se reparte al azar respetando esas:

```ts
export const fixedEdges: FixedEdge[] = [
  { from: "camilo", to: "valeria" },   // Camilo le regala a Valeria
  { from: "sergio", to: "camilo" },    // Sergio le regala a Camilo
];
```

Una persona puede aparecer una sola vez dando y una sola vez recibiendo. Si las reglas dejan a alguien sin salida, la app te lo dice en vez de armar un sorteo malo.

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
5. Abre `https://amor-y-amistad.onrender.com/admin`, entra con tu contraseña y copia el mensaje para el grupo. Ese es el único enlace que tienes que mandar.

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

## Reiniciar los votos

En el panel, abajo, hay un botón **Reiniciar los N votos**: borra el registro de quién ya eligió y todos vuelven a poder entrar. Sirve para hacer pruebas o si algo se enredó. También puedes reiniciar a una sola persona desde su fila en la tabla, por si alguien tocó el nombre equivocado.

Reiniciar **no cambia a quién le toca cada quien**: eso se calcula del secreto, no del registro.

## Volver a sortear

Si de verdad quieres otras parejas, define o cambia `SORTEO_SEED` y vuelve a desplegar. Los enlaces siguen siendo los mismos y el registro arranca en cero.

## Estructura

```
src/app/page.tsx               El enlace del grupo: elegir nombre y revelar
src/app/actions.ts             Registra la eleccion y firma la cookie del telefono
src/app/r/[token]/page.tsx     Enlace privado de cada persona (opcional)
src/app/api/reveal/route.ts    Revelacion desde el enlace privado
src/app/admin/                 Panel del organizador, login y reinicio de votos
src/lib/participants.ts        Lista de personas y conexiones fijas
src/lib/draw.ts                Sorteo determinista (Sattolo) con conexiones fijas
src/lib/session.ts             Cookie firmada que recuerda quien eres en ese telefono
src/lib/store.ts               Redis por TCP, por REST, o memoria en local
src/components/NamePicker.tsx  La lista de nombres con buscador
src/components/Graph.tsx       El grafo: despiste, revelacion o vista de admin
render.yaml                    Blueprint de Render (sitio + Key Value)
```
