# Venti b-day! ♡

Juego web mobile-first de un solo uso para una fiesta de cumpleaños en la playa. Estética girly Sanrio coreana, rosa pastel, con tres fases:

1. **Trivia** sobre la cumpleañera + cultura general
2. **¿Quién es más probable que...?** con votos en tiempo real
3. **Captura de foto** en vivo con countdown de 10 segundos
4. **Wrapped** estilo Spotify con estadísticas, fotos polaroid y exportación PNG/GIF

## Stack

- SvelteKit 2 + Svelte 5 (runes) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Realtime + Storage)
- Vercel (hosting)
- IndexedDB para checkpoints + recuperación
- html-to-image + gif.js.optimized para exportación

## Setup rápido

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Crear proyecto Supabase

1. Crear proyecto gratis en [supabase.com](https://supabase.com)
2. Copiar URL y `anon` key (Project Settings → API)
3. Llenar `.env`:

```env
PUBLIC_GAME_ID=venti-bday-2026
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Aplicar el schema

En Supabase Studio → SQL Editor, copia y ejecuta el contenido de `supabase/migrations/0001_init.sql`.

Esto crea:
- Tablas `game`, `players`, `trivia_answers`, `wml_votes`, `photos`
- Políticas RLS permisivas (juego privado, no datos sensibles)
- Realtime publication para todas las tablas
- Bucket de Storage `photos` público
- La fila inicial del juego con id `venti-bday-2026`

### 4. (Opcional) Desplegar edge function

La edge function `advance-phase` valida server-side que todos hayan respondido antes de revelar:

```bash
supabase functions deploy advance-phase --no-verify-jwt
```

Si no la despliegas, las transiciones suceden vía mutación directa desde el cliente — funciona pero sin la validación atómica de "todos respondieron".

### 5. Dev local

```bash
pnpm run dev
```

Abre `http://localhost:5173`.

### 6. Build + deploy

```bash
pnpm run build  # build local
```

Para deploy en Vercel:
1. `vercel` (primer deploy)
2. Configurar variables `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_GAME_ID` en el dashboard de Vercel

## Personalización

### Contenido del juego

- **Preguntas trivia**: edita `src/lib/content/trivia.json`
  - `type: "multiple"` con `options` y `answer`
  - `type: "open"` con `answer` + `answer_alts` (variantes válidas)
  - `about: "venti" | "general"` para clasificar
- **Quién es más probable**: edita `src/lib/content/whos_most_likely.json`

Los IDs son arbitrarios (kebab-case). El orden se baraja al iniciar el juego (guardado en `game.config.trivia_order/wml_order`).

### Diseño

- **Paleta**: `src/app.css` → bloque `@theme`
- **Colores de avatar**: `src/lib/design/colors.ts` → `PLAYER_PALETTE`
- **Decoraciones coreanas**: `src/lib/design/stickers.ts` → `KOREAN_DECORATIONS`

### Personajes Sanrio (importante)

Los doodles actuales son SVG hechos en el repo (genéricos). Si quieres usar PNGs reales de personajes Sanrio (Pochacco, Pompompurin, Cinnamoroll, My Melody, Hello Kitty, Snoopy):

1. Descarga los PNGs transparentes (Pinterest, Google Images, etc.)
2. Optimízalos a ~200-400px y comprime a WebP/PNG con [squoosh.app](https://squoosh.app)
3. Colócalos en `static/stickers/` con nombres como `pochacco.png`, `kitty.png`, etc.
4. Reemplaza los `<KittyDoodle>` en los componentes por `<img src="/stickers/pochacco.png">`

⚠️ **Importante**: las imágenes de personajes Sanrio tienen copyright. Este proyecto es para uso personal one-time. **No publicar el repo público con esas imágenes**.

### Configuración del juego

`src/lib/config.ts`:
- `MIN_PLAYERS_TO_START` (default 2)
- `PHOTO_COUNTDOWN_SECONDS` (default 10)
- `PHASE_ADVANCE_TIMEOUT_MS` (timeout anti-deadlock)

## Estructura

```
venti-bday/
├── src/
│   ├── routes/
│   │   ├── +page.svelte               # Landing "Venti b-day!"
│   │   ├── join/+page.svelte          # Entrada de nombre
│   │   ├── play/+page.svelte          # Router de fases activas
│   │   └── wrapped/[playerId]/        # Resumen personalizado + export
│   ├── lib/
│   │   ├── components/
│   │   │   ├── BowButton.svelte
│   │   │   ├── GlassCard.svelte
│   │   │   ├── PlayerAvatar.svelte
│   │   │   ├── FloatingStickers.svelte
│   │   │   ├── HeartLoader.svelte
│   │   │   ├── ReadyToggle.svelte
│   │   │   ├── KittyDoodle.svelte
│   │   │   └── phases/
│   │   │       ├── Lobby.svelte
│   │   │       ├── Trivia.svelte
│   │   │       ├── WhosMostLikely.svelte
│   │   │       └── PhotoCapture.svelte
│   │   ├── stores/
│   │   │   ├── game.svelte.ts
│   │   │   └── player.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── realtime.ts
│   │   │   ├── mutations.ts
│   │   │   └── types.ts
│   │   ├── content/
│   │   │   ├── trivia.json
│   │   │   └── whos_most_likely.json
│   │   ├── persistence/
│   │   │   └── idb.ts
│   │   ├── camera/
│   │   │   └── capture.ts
│   │   ├── design/
│   │   │   ├── colors.ts
│   │   │   └── stickers.ts
│   │   └── config.ts
│   ├── app.css
│   └── app.html
├── supabase/
│   ├── migrations/0001_init.sql
│   └── functions/advance-phase/index.ts
├── static/
│   └── gif.worker.js
└── package.json
```

## Pendientes / próxima iteración

- [ ] SFX (pop, sparkle, reveal, chime, camera) en `static/sfx/`
- [ ] PWA / service worker para cachear assets
- [ ] Música de fondo opcional (toggle en header)
- [ ] PNGs reales de personajes Sanrio
- [ ] Idle animations adicionales en avatares
- [ ] Self-hosting de fuentes coreanas (ahora vía Google Fonts CDN)
- [ ] Testing en teléfonos reales (iOS Safari, Chrome Android)
- [ ] Lighthouse mobile audit
- [ ] Timeout/skip automático para jugadores desconectados
- [ ] Hidratación desde IndexedDB checkpoint al cargar (helpers ya escritos en `src/lib/persistence/idb.ts`)

## Notas

- El juego está pensado para una sola sala con id `venti-bday-2026` (configurable en `.env`).
- Sin auth: cada jugador se identifica con UUID generado en cliente + nombre.
- El wrapped queda accesible para siempre en `/wrapped/[playerId]` mientras el proyecto Supabase exista.
- En modo demo (sin Supabase configurado), la landing y la entrada de nombre funcionan pero el lobby muestra mensaje de configuración pendiente.
