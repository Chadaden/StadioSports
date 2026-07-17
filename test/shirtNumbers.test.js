import test from 'node:test'
import assert from 'node:assert/strict'

import { players } from '../src/data/seed.js'

test('all 32 submitted soccer players have their supplied shirt number', () => {
  const soccerPlayers = Object.values(players).flat().filter((player) => player.sport === 'soccer' && player.role === 'player')
  assert.equal(soccerPlayers.length, 32)
  assert.equal(soccerPlayers.every((player) => Number.isInteger(player.shirtNumber)), true)

  for (const campus of ['centurion', 'musgrave', 'durbanville', 'waterfall']) {
    const numbers = players[campus]
      .filter((player) => player.sport === 'soccer' && player.role === 'player')
      .map((player) => player.shirtNumber)
      .sort((a, b) => a - b)
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8])
  }
})
