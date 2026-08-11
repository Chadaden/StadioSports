import test from 'node:test'
import assert from 'node:assert/strict'

import { fixtureDisplayGroups } from '../src/lib/fixtureOrder.js'

const fixture = (id, matchNo, soccer, netball) => ({ id, matchNo, soccer: { status: soccer }, netball: { status: netball } })

test('keeps live and upcoming fixtures above collapsed published games', () => {
  const groups = fixtureDisplayGroups([
    fixture('m3', 3, 'final', 'final'),
    fixture('m2', 2, 'upcoming', 'upcoming'),
    fixture('m1', 1, 'live', 'live'),
    fixture('m4', 4, 'final', 'upcoming'),
  ])
  assert.deepEqual(groups.active.map((item) => item.id), ['m1', 'm2', 'm4'])
  assert.deepEqual(groups.published.map((item) => item.id), ['m3'])
})
