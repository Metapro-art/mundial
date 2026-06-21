// Construye el corpus histórico semilla del modelo (src/data/intl_results.json)
// a partir de martj42/international_results (results.csv, sin key).
//
// - Filtra a una ventana reciente (por defecto 36 meses hasta el último partido
//   jugado del dataset).
// - Descarta filas sin resultado (NA = partidos futuros).
// - Normaliza los nombres de las 48 selecciones del Mundial a su forma canónica
//   (la de openfootball/teams.json); el resto de selecciones conserva su nombre.
//
// Uso:
//   npm run data:intl                 # ventana de 36 meses
//   node scripts/build-intl-results.mjs --months 24
//   node scripts/build-intl-results.mjs --ref 2026-06-21 --months 36
import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const CSV_URL =
  'https://raw.githubusercontent.com/martj42/international_results/master/results.csv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEAMS_PATH = resolve(__dirname, '../src/data/teams.json')
const OUT_PATH = resolve(__dirname, '../src/data/intl_results.json')

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2)
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const MONTHS = Number(arg('months', '36'))
const REF_OVERRIDE = arg('ref', null) // YYYY-MM-DD o null (auto)

// ---- helpers --------------------------------------------------------------
function normKey(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Parser CSV mínimo que respeta comillas dobles.
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d
}

// ---- build alias -> canónico ----------------------------------------------
const teams = JSON.parse(await readFile(TEAMS_PATH, 'utf8'))
const canonByKey = new Map()
for (const t of teams) {
  for (const variant of [t.name, t.es, ...t.aliases]) {
    canonByKey.set(normKey(variant), t.name)
  }
}
function canonical(name) {
  return canonByKey.get(normKey(name)) ?? name
}

// ---- descarga + parseo ----------------------------------------------------
console.log('Descargando results.csv…')
const res = await fetch(CSV_URL)
if (!res.ok) {
  console.error(`Error HTTP ${res.status} al descargar el CSV`)
  process.exit(1)
}
const text = await res.text()
const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
const header = parseCsvLine(lines[0])
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]))

const required = ['date', 'home_team', 'away_team', 'home_score', 'away_score', 'tournament', 'neutral']
for (const k of required) {
  if (idx[k] === undefined) {
    console.error(`Columna faltante en el CSV: ${k}. Cabecera: ${header.join(',')}`)
    process.exit(1)
  }
}

const rows = []
for (let i = 1; i < lines.length; i++) {
  const f = parseCsvLine(lines[i])
  const hs = f[idx.home_score]
  const as = f[idx.away_score]
  if (hs === 'NA' || as === 'NA' || hs === '' || as === '') continue // futuro/sin resultado
  const homeGoals = Number(hs)
  const awayGoals = Number(as)
  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) continue
  rows.push({
    date: f[idx.date],
    home: f[idx.home_team],
    away: f[idx.away_team],
    homeGoals,
    awayGoals,
    competition: f[idx.tournament],
    neutral: String(f[idx.neutral]).toUpperCase() === 'TRUE',
  })
}

// ---- ventana temporal -----------------------------------------------------
rows.sort((a, b) => a.date.localeCompare(b.date))
const lastPlayed = REF_OVERRIDE ?? rows[rows.length - 1].date
const from = addMonths(`${lastPlayed}T00:00:00Z`, -MONTHS).toISOString().slice(0, 10)

const windowed = rows
  .filter((r) => r.date >= from && r.date <= lastPlayed)
  .map((r) => ({
    date: r.date,
    home: canonical(r.home),
    away: canonical(r.away),
    homeGoals: r.homeGoals,
    awayGoals: r.awayGoals,
    competition: r.competition,
    neutral: r.neutral,
  }))

// ---- stats de cobertura para los 48 ---------------------------------------
const wcNames = new Set(teams.map((t) => t.name))
const counts = new Map()
for (const r of windowed) {
  if (wcNames.has(r.home)) counts.set(r.home, (counts.get(r.home) ?? 0) + 1)
  if (wcNames.has(r.away)) counts.set(r.away, (counts.get(r.away) ?? 0) + 1)
}
const missing = [...wcNames].filter((n) => !counts.has(n))
const perTeam = [...counts.values()]
const minC = Math.min(...perTeam)
const maxC = Math.max(...perTeam)

await writeFile(OUT_PATH, JSON.stringify(windowed) + '\n', 'utf8')

console.log(`✓ Corpus escrito en ${OUT_PATH}`)
console.log(`  Ventana: ${from} → ${lastPlayed} (${MONTHS} meses)`)
console.log(`  Partidos totales en ventana: ${windowed.length} (de ${rows.length} jugados en el CSV)`)
console.log(`  Cobertura selecciones del Mundial: ${counts.size}/48 (min ${minC}, max ${maxC} partidos)`)
if (missing.length) console.log(`  ⚠ Sin partidos en la ventana: ${missing.join(', ')}`)
