import test from 'node:test'
import assert from 'node:assert/strict'

import { computeAutoPairings, roundRobinComplete } from '../src/lib/standings.js'

const teams = [
  { id: 'centurion', name: 'Centurion' },
  { id: 'musgrave', name: 'Musgrave' },
  { id: 'durbanville', name: 'Durbanville' },
  { id: 'waterfall', name: 'Waterfall' },
]

const event = {
  points: { soccer: { win: 3, draw: 1, loss: 0 } },
  tieBreakers: ['points', 'scoreDiff', 'goalsFor', 'headToHead', 'goalsAgainst'],
}

const blankSport = () => ({ status: 'upcoming', home: 0, away: 0, scorers: [], cards: [] })
const finalResult = (home, away) => ({ ...blankSport(), status: 'final', home, away })

// Mirrors the real event's 6-game single round-robin pairing (seed.js m1-m6),
// plus the two knockout placeholders (§8) auto-population targets.
const baseFixtures = () => [
  { id: 'm1', matchNo: 1, round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'waterfall', soccer: blankSport() },
  { id: 'm2', matchNo: 2, round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'durbanville', soccer: blankSport() },
  { id: 'm3', matchNo: 3, round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'musgrave', soccer: blankSport() },
  { id: 'm4', matchNo: 4, round: 'roundRobin', homeTeamId: 'waterfall', awayTeamId: 'durbanville', soccer: blankSport() },
  { id: 'm5', matchNo: 5, round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'durbanville', soccer: blankSport() },
  { id: 'm6', matchNo: 6, round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'waterfall', soccer: blankSport() },
  { id: 'm7', matchNo: 7, round: 'playoff', homeTeamId: null, awayTeamId: null, soccer: blankSport() },
  { id: 'm8', matchNo: 8, round: 'final', homeTeamId: null, awayTeamId: null, soccer: blankSport() },
]

test('roundRobinComplete is false until every round-robin fixture has a final result for that sport', () => {
  const fixtures = baseFixtures()
  assert.equal(roundRobinComplete('soccer', fixtures), false)

  fixtures[0].soccer = finalResult(2, 0)
  assert.equal(roundRobinComplete('soccer', fixtures), false)

  for (let i = 1; i < 6; i++) fixtures[i].soccer = finalResult(1, 0)
  assert.equal(roundRobinComplete('soccer', fixtures), true)

  // A sport with no results yet of its own is unaffected by another sport's table.
  assert.equal(roundRobinComplete('netball', fixtures), false)
})

test('computeAutoPairings seats 1st vs 2nd in the final and 3rd vs 4th in the playoff, once complete', () => {
  const fixtures = baseFixtures()
  fixtures[0].soccer = finalResult(2, 0) // centurion beats waterfall
  fixtures[1].soccer = finalResult(2, 0) // musgrave beats durbanville
  fixtures[2].soccer = finalResult(2, 0) // centurion beats musgrave
  fixtures[3].soccer = finalResult(2, 0) // waterfall beats durbanville
  fixtures[4].soccer = finalResult(2, 0) // centurion beats durbanville
  fixtures[5].soccer = finalResult(2, 0) // musgrave beats waterfall
  // Standings: centurion 9pts (1st), musgrave 6pts (2nd), waterfall 3pts (3rd), durbanville 0pts (4th).

  const pairings = computeAutoPairings('soccer', fixtures, teams, event)
  assert.deepEqual(pairings.final, { homeTeamId: 'centurion', awayTeamId: 'musgrave' })
  assert.deepEqual(pairings.playoff, { homeTeamId: 'waterfall', awayTeamId: 'durbanville' })

  // Netball hasn't played a single game in this fixture set — not complete yet.
  assert.equal(computeAutoPairings('netball', fixtures, teams, event), null)
})

test('computeAutoPairings returns null until that sport\'s round-robin is complete', () => {
  const fixtures = baseFixtures()
  for (let i = 0; i < 5; i++) fixtures[i].soccer = finalResult(1, 0) // only 5 of 6 played
  assert.equal(computeAutoPairings('soccer', fixtures, teams, event), null)
})
