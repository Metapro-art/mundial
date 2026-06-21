# ⚽ Mundial 2026 — Predictor de probabilidades

Web app que muestra los **partidos restantes** del Mundial 2026 (fase de grupos y
eliminatorias) y, al abrir un partido, calcula **todas las probabilidades de mercados**
(1X2, Over/Under, ambos anotan, marcadores más probables) con un **modelo estadístico
propio** (Elo + Dixon-Coles).

> **100% gratis y sin API keys.** El MVP se calcula entero en el navegador a partir de
> datos públicos sin clave. Las cuotas (opcionales) de la Fase 3 van detrás de una variable
> de entorno y nunca se commitean.

---

## 🚀 Cómo correr en local

Requisitos: **Node 18+** (probado en Node 24) y npm.

```bash
npm install
npm run dev      # arranca Vite en http://localhost:5173
```

Otros scripts:

```bash
npm run build    # type-check + build de producción (dist/)
npm run preview  # sirve el build de producción
npm test         # corre los tests del modelo (Vitest)
```

---

## 🧩 Stack

- **Vite + React + TypeScript + TailwindCSS**
- Lógica del modelo en **TypeScript puro** (`src/model/`), con **tests Vitest**.
- Deploy en **GitHub Pages** (la `base` de Vite es `/mundial/` en build).
- Banderas vía **[flagcdn.com](https://flagcdn.com)** (gratis, sin key).

---

## 🗂️ Estructura

```
src/
  data/         capa de datos (openfootball) + registro de equipos
    teams.json          48 selecciones: nombre, español, ISO-2, alias, grupo
    types.ts            tipos crudos (openfootball) y normalizados
    fixtures.ts         carga worldcup.json (en vivo + snapshot) y normaliza
    placeholders.ts     "2A" -> "2.º A", "W74" -> "Ganador M74", ...
    worldcup.snapshot.json   copia empaquetada (fallback sin conexión)
    intl_results.json   corpus histórico semilla (lo genera scripts/, Fase 2)
  lib/          utilidades (banderas, horarios, formato)
  model/        Elo + Dixon-Coles (Fase 2)
  components/   UI (lista de partidos, grupos, bracket, panel de mercados)
scripts/        generadores de datos (corpus histórico, snapshot)
```

---

## 📡 Fuentes de datos (todas gratis, sin key)

1. **Fixtures, grupos y bracket** —
   [`openfootball/worldcup.json`](https://github.com/openfootball/worldcup.json)
   rama `master`, archivo
   [`2026/worldcup.json`](https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json).
   La app lo lee **en vivo** y, si falla la red, usa la copia empaquetada en
   `src/data/worldcup.snapshot.json`.
2. **Histórico internacional** (para el modelo) —
   [`martj42/international_results`](https://github.com/martj42/international_results)
   (`results.csv`, 1872→hoy, sin key). Ver más abajo cómo regenerar el corpus.
3. **(Fase 3, opcional) Cuotas** — OddsPapi free tier, detrás de `VITE_ODDS_API_KEY`.
   Si la variable no existe, la app funciona igual sin la columna de cuotas.

### Actualizar el snapshot de fixtures

```bash
npm run data:fixtures   # descarga el worldcup.json actual y reescribe el snapshot
```

(De todos modos la app prioriza los datos en vivo; el snapshot es solo respaldo.)

---

## 🔢 El modelo (Fase 2)

> Sin xG: no hay fuente gratuita de xG para selecciones, así que el modelo se basa en goles.

- **`elo.ts`** — rating Elo por selección desde el corpus, con K-factor ajustado por
  importancia del partido y margen de goles.
- **`strength.ts`** — fuerza de ataque/defensa = goles marcados/recibidos ÷ promedio del
  corpus, con **decaimiento temporal** (half-life ~12 meses).
- **`dixoncoles.ts`** — λ local/visitante desde las fuerzas (mezclado con Elo), matriz de
  marcadores Poisson con corrección **Dixon-Coles** (ρ) para marcadores bajos. De la matriz
  salen 1X2, Over/Under 0.5/1.5/2.5/3.5, BTTS y los 5 marcadores más probables. La ventaja de
  localía solo aplica a los anfitriones (USA, Canadá, México).

### Regenerar el corpus histórico

```bash
npm run data:intl       # descarga martj42/results.csv, filtra, normaliza nombres
                        # y reescribe src/data/intl_results.json
```

El modelo lee de `src/data/intl_results.json` y **recalcula solo** al cargar la app.

---

## 🌐 Deploy a GitHub Pages

El repo se llama `mundial`, así que `vite.config.ts` usa `base: '/mundial/'` en build.
El workflow de GitHub Actions (`.github/workflows/deploy.yml`, Fase de deploy) publica
`dist/` en Pages en cada push a `master`.

---

## ⚠️ Aviso

Las probabilidades provienen de un modelo estadístico propio con fines informativos y
educativos. **No es consejo de apuestas.**
