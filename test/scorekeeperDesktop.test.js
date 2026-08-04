import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('the scorekeeper has a laptop layout with parallel remotes and a persistent reference panel', async () => {
  const [fixtures, styles] = await Promise.all([
    read('../src/skins/stardial/FixturesScreen.jsx'),
    read('../src/skins/stardial.css'),
  ])
  assert.match(fixtures, /ScorekeeperContext/)
  assert.match(fixtures, /Match-day reference/)
  assert.match(styles, /@media \(min-width: 900px\)/)
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styles, /position: sticky/)
})
