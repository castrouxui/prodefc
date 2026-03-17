# ProdeFC — Contexto para Claude Code

## Qué es este proyecto

App web de prode deportivo para grupos de amigos. Champions League 2024/25 como competición inicial. Los usuarios se unen a un grupo, pagan la entrada via Mercado Pago, y compiten pronosticando resultados de partidos.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS v3
- **Backend**: Supabase (Auth, Postgres, Realtime, Edge Functions)
- **Pagos**: Mercado Pago API (Checkout Pro)
- **Deploy**: Vercel
- **Estado**: Zustand (UI/session) + React Query (server state)
- **Tipografía**: DM Sans (Google Fonts)

## Estructura del proyecto

```
src/
  pages/          → una por pantalla (Home, Fixture, Ranking, Predict, Profile, Login)
  components/
    match/        → MatchCard, PredictForm, ScoreBadge
    ranking/      → RankingTable, RankRow
    layout/       → AppShell, TopBar, BottomNav
    ui/           → Badge, Avatar, Pill (primitivos reutilizables)
  lib/
    supabase.js   → cliente Supabase singleton
    scoring.js    → lógica de puntos (función pura, testeable)
    dates.js      → helpers de fechas
  hooks/          → useMatches, usePredictions, useRanking, useAuth
  store/          → authStore.js, groupStore.js (Zustand)
  styles/
    globals.css   → reset + base
    tokens.css    → variables CSS del design system
supabase/
  migrations/     → SQL de schema completo
  functions/
    create-preference/   → Edge Function: crea preferencia MP
    mp-webhook/          → Edge Function: recibe webhook de MP
```

## Design system

Referencia visual: Apple Sports app. Layout tipo feed compacto, filas densas, secciones por competición.

### Colores
- Accent dark mode: `#C8F000` (verde lima)
- Accent light mode: `#4CAF50` (verde)
- Fondo dark: `#1c1c1e` (app) / `#2c2c2e` (cards)
- Fondo light: `#f2f2f7` (app) / `#ffffff` (cards)
- Texto primario dark: `#ffffff`
- Texto secundario dark: `#636366`
- Texto primario light: `#1c1c1e`
- Texto secundario light: `#8e8e93`

### Tokens CSS (ver src/styles/tokens.css)
Usar siempre variables CSS, nunca valores hardcodeados.

### Tipografía
- Fuente: DM Sans (400, 500, 600, 700)
- Scores/números destacados: font-weight 700, letter-spacing negativo
- Labels en caps: font-size 11px, font-weight 600, letter-spacing 0.4px, uppercase

### Componentes clave
- **MatchCard**: fila compacta con equipos apilados, score a la derecha, estado/hora en el centro, badge de puntos inline
- **RankRow**: posición + avatar + nombre + puntos, fila propia resaltada con accent
- **BottomNav**: 4 tabs (Inicio, Fixture, Ranking, Perfil), icono + label

## Base de datos (Supabase)

### Tablas
- `profiles` — extiende auth.users (username, avatar_url)
- `groups` — nombre, invite_code, entry_amount, currency, created_by
- `group_members` — group_id, user_id, payment_status (pending/approved), payment_id
- `matches` — equipos, fecha, ronda, scores, status (scheduled/live/finished)
- `predictions` — user_id, match_id, group_id, home_pred, away_pred, points
- `payments` — user_id, group_id, mp_payment_id, mp_preference_id, amount, status

### RLS
Row Level Security activado en todas las tablas. Un usuario solo ve datos de grupos a los que pertenece con payment_status = 'approved'.

### Reglas de negocio
- Un pronóstico solo se puede cargar si `match.status = 'scheduled'` y `match.match_date > now()`
- Un pronóstico se bloquea automáticamente cuando arranca el partido
- Solo miembros con `payment_status = 'approved'` pueden cargar pronósticos

## Sistema de puntos

```js
// src/lib/scoring.js
function calculatePoints(prediction, result) {
  if (prediction.home_pred === result.home_score &&
      prediction.away_pred === result.away_score) return 3  // exacto
  
  const predDiff = prediction.home_pred - prediction.away_pred
  const resDiff  = result.home_score - result.away_score
  
  if (Math.sign(predDiff) === Math.sign(resDiff) && predDiff === resDiff) return 2  // ganador + diferencia
  if (Math.sign(predDiff) === Math.sign(resDiff)) return 1  // solo ganador
  return 0
}
```

## Flujo de pagos (Mercado Pago)

1. Usuario ingresa código de grupo → frontend muestra monto de entrada
2. Usuario confirma → frontend llama Edge Function `create-preference`
3. Edge Function llama `POST /checkout/preferences` en MP con monto + metadata (user_id, group_id)
4. MP devuelve `init_point` → frontend redirige al checkout externo de MP
5. Usuario paga → MP llama webhook a Edge Function `mp-webhook`
6. Edge Function verifica pago con `GET /v1/payments/:id` + valida `x-signature`
7. Si aprobado → actualiza `group_members.payment_status = 'approved'` y registra en `payments`
8. Frontend detecta cambio via Supabase Realtime → redirige al grupo

### Variables de entorno necesarias
```
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # solo en Edge Functions

# Mercado Pago
MP_ACCESS_TOKEN=             # solo en Edge Functions
MP_WEBHOOK_SECRET=           # para validar firma del webhook

# App
VITE_APP_URL=                # URL base para redirects de MP
```

## Convenciones de código

- Componentes: PascalCase, archivos `.jsx`
- Hooks: camelCase con prefijo `use`, archivos `.js`
- Stores: camelCase con sufijo `Store`, archivos `.js`
- Queries de Supabase: siempre en el hook correspondiente, nunca en el componente
- No usar `any` implícito — aunque no hay TypeScript, documentar props con JSDoc si son complejas
- Tailwind: clases utilitarias, no CSS inline salvo tokens del design system
- Colores: usar siempre variables CSS de `tokens.css`, nunca valores hex directos en componentes

## Comandos

```bash
npm run dev          # desarrollo local
npm run build        # build de producción
npm run preview      # preview del build
supabase start       # levanta Supabase local
supabase db push     # aplica migraciones
supabase functions serve  # sirve Edge Functions localmente
```

## Prioridad de desarrollo (V1)

1. Setup base (Vite + Tailwind + Supabase client + Auth con Google)
2. Schema de DB + migraciones
3. Crear grupo / unirse con código
4. Flujo de pago con Mercado Pago
5. Fixture de partidos (sync desde API-Football)
6. Cargar pronósticos
7. Ranking del grupo (con Realtime)
8. Historial de pronósticos propios

## Fuera de scope (V1)

- Distribución de premios (V2)
- Múltiples grupos por usuario simultáneos
- Notificaciones push
- Chat interno
- Estadísticas avanzadas
- Mundial 2026 (se agrega en V2 como segunda competición)
