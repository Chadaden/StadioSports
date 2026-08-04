import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('timer actions call their state transitions with only the sport state', async () => {
  const source = await readFile(new URL('../src/store/DataProvider.jsx', import.meta.url), 'utf8')
  for (const transition of ['startClockState', 'pauseClockState', 'resumeClockState', 'startSecondHalfState', 'resetClockState']) {
    assert.match(source, new RegExp(`\\(s\\) => ${transition}\\(s\\)`))
  }
})
