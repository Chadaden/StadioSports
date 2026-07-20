import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('manager sessions subscribe only to their assigned campus roster', () => {
  const source = read('src/store/DataProvider.jsx')
  assert.match(source, /role === 'manager' && t\.id !== myTeamId/)
  assert.match(source, /'teams', myTeamId, 'private'/)
  assert.match(source, /getDocs\(profilesRef\)\.then\(applyProfiles, reportError\)/)
  assert.match(source, /loading: loading \|\| profilesLoading/)
  assert.match(source, /coreReady && rostersReady/)
})

test('manager Team and Travel screens stay scoped to the assigned campus', () => {
  const team = read('src/screens/TeamScreen.jsx')
  const travel = read('src/screens/TravelScreen.jsx')
  assert.match(team, /teams\.find\(\(t\) => t\.id === myTeamId\)/)
  assert.doesNotMatch(team, /select|team selector/i)
  assert.match(travel, /teams\.filter\(\(team\) => team\.id === teamId\)/)
})

test('production source contains no pictographic interface icons', () => {
  const srcDir = fileURLToPath(new URL('src', root))
  const files = []
  const visit = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) visit(path)
      else if (/\.(js|jsx|css)$/.test(name)) files.push(path)
    }
  }
  visit(srcDir)

  const pictographs = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  const offenders = files.filter((file) => pictographs.test(readFileSync(file, 'utf8')))
  assert.deepEqual(offenders, [])
})
