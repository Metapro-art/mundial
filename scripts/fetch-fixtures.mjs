// Descarga el worldcup.json actual de openfootball y reescribe el snapshot
// empaquetado (src/data/worldcup.snapshot.json), que sirve de respaldo cuando
// no hay conexión. La app, de todos modos, prioriza los datos en vivo.
//
// Uso:  npm run data:fixtures
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/worldcup.snapshot.json')

const res = await fetch(URL)
if (!res.ok) {
  console.error(`Error al descargar fixtures: HTTP ${res.status}`)
  process.exit(1)
}
const json = await res.json()
if (!json?.matches?.length) {
  console.error('La respuesta no contiene partidos.')
  process.exit(1)
}

await writeFile(OUT, JSON.stringify(json, null, 1) + '\n', 'utf8')
console.log(`✓ Snapshot actualizado: ${json.matches.length} partidos -> ${OUT}`)
