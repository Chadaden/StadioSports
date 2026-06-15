/**
 * Compute standings from fixtures array.
 * Returns { soccer: [...], netball: [...] } sorted by Pts, GD, then headToHead.
 */
export function computeStandings(fixtures, teamIds) {
  const sports = ['soccer', 'netball'];
  const result = {};

  for (const sport of sports) {
    // Build map: teamId -> stats
    const stats = {};
    for (const tid of teamIds) {
      stats[tid] = { teamId: tid, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
    }

    // Head-to-head results: [homeId][awayId] = { home, away }
    const h2h = {};

    for (const fix of fixtures) {
      const s = fix[sport];
      if (!s || s.status !== 'final') continue;
      const { homeTeamId, awayTeamId } = fix;
      if (!stats[homeTeamId] || !stats[awayTeamId]) continue;

      const hg = s.home ?? 0;
      const ag = s.away ?? 0;

      stats[homeTeamId].P++;
      stats[awayTeamId].P++;
      stats[homeTeamId].GF += hg;
      stats[homeTeamId].GA += ag;
      stats[awayTeamId].GF += ag;
      stats[awayTeamId].GA += hg;

      const pts = sport === 'soccer' ? { win: 3, draw: 1, loss: 0 } : { win: 2, draw: 1, loss: 0 };

      if (hg > ag) {
        stats[homeTeamId].W++;
        stats[awayTeamId].L++;
        stats[homeTeamId].Pts += pts.win;
        stats[awayTeamId].Pts += pts.loss;
      } else if (hg < ag) {
        stats[awayTeamId].W++;
        stats[homeTeamId].L++;
        stats[awayTeamId].Pts += pts.win;
        stats[homeTeamId].Pts += pts.loss;
      } else {
        stats[homeTeamId].D++;
        stats[awayTeamId].D++;
        stats[homeTeamId].Pts += pts.draw;
        stats[awayTeamId].Pts += pts.draw;
      }

      // Track h2h
      if (!h2h[homeTeamId]) h2h[homeTeamId] = {};
      if (!h2h[awayTeamId]) h2h[awayTeamId] = {};
      h2h[homeTeamId][awayTeamId] = { scored: hg, conceded: ag };
      h2h[awayTeamId][homeTeamId] = { scored: ag, conceded: hg };
    }

    // Compute GD
    for (const tid of teamIds) {
      stats[tid].GD = stats[tid].GF - stats[tid].GA;
    }

    const rows = Object.values(stats);
    rows.sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      // Head to head
      const aVb = h2h[a.teamId]?.[b.teamId];
      const bVa = h2h[b.teamId]?.[a.teamId];
      if (aVb && bVa) {
        const aH2hGD = aVb.scored - aVb.conceded;
        const bH2hGD = bVa.scored - bVa.conceded;
        if (bH2hGD !== aH2hGD) return bH2hGD - aH2hGD;
      }
      return a.teamId.localeCompare(b.teamId);
    });

    result[sport] = rows;
  }

  return result;
}
