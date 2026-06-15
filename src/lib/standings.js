// Standings computed on read from fixtures (§7) — never stored as state.
// Uses event.points per sport and event.tieBreakers ordering.

const ZERO = () => ({
  played: 0, won: 0, drawn: 0, lost: 0,
  for: 0, against: 0, diff: 0, points: 0,
})

/**
 * Compute the standings table for one sport.
 * @param {string} sport - 'soccer' | 'netball'
 * @param {Array} fixtures - fixture docs
 * @param {Array} teams - team docs
 * @param {object} event - event config (points + tieBreakers)
 * @returns {Array} rows sorted best-first, each with team + tallies + rank
 */
export function computeStandings(sport, fixtures, teams, event) {
  const pts = event?.points?.[sport] || { win: 3, draw: 1, loss: 0 }
  const rows = {}
  for (const t of teams) rows[t.id] = { team: t, ...ZERO() }

  for (const fx of fixtures) {
    // Only round-robin games feed the table; playoff/final are knockout.
    if (fx.round !== 'roundRobin') continue
    const s = fx[sport]
    if (!s || s.status !== 'final') continue
    if (!fx.homeTeamId || !fx.awayTeamId) continue
    const h = rows[fx.homeTeamId]
    const a = rows[fx.awayTeamId]
    if (!h || !a) continue

    h.played++; a.played++
    h.for += s.home; h.against += s.away
    a.for += s.away; a.against += s.home

    if (s.home > s.away) {
      h.won++; h.points += pts.win
      a.lost++; a.points += pts.loss
    } else if (s.home < s.away) {
      a.won++; a.points += pts.win
      h.lost++; h.points += pts.loss
    } else {
      h.drawn++; a.drawn++
      h.points += pts.draw; a.points += pts.draw
    }
  }

  for (const id in rows) rows[id].diff = rows[id].for - rows[id].against

  const headToHead = buildHeadToHead(sport, fixtures)
  const order = event?.tieBreakers || ['points', 'scoreDiff', 'headToHead']

  const list = Object.values(rows).sort((x, y) => {
    for (const key of order) {
      if (key === 'points' && y.points !== x.points) return y.points - x.points
      if (key === 'scoreDiff' && y.diff !== x.diff) return y.diff - x.diff
      if (key === 'headToHead') {
        const hh = (headToHead[y.team.id]?.[x.team.id] ?? 0) - (headToHead[x.team.id]?.[y.team.id] ?? 0)
        if (hh !== 0) return hh
      }
    }
    // Final fallback: goals/goals-for then alphabetical for a stable order.
    if (y.for !== x.for) return y.for - x.for
    return x.team.name.localeCompare(y.team.name)
  })

  return list.map((r, i) => ({ ...r, rank: i + 1 }))
}

// headToHead[winner][loser] = number of wins between that pair (round-robin only).
function buildHeadToHead(sport, fixtures) {
  const hh = {}
  const bump = (w, l) => {
    hh[w] = hh[w] || {}
    hh[w][l] = (hh[w][l] || 0) + 1
  }
  for (const fx of fixtures) {
    if (fx.round !== 'roundRobin') continue
    const s = fx[sport]
    if (!s || s.status !== 'final' || !fx.homeTeamId || !fx.awayTeamId) continue
    if (s.home > s.away) bump(fx.homeTeamId, fx.awayTeamId)
    else if (s.away > s.home) bump(fx.awayTeamId, fx.homeTeamId)
  }
  return hh
}
