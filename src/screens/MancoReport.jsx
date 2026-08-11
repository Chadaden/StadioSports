import { useState } from 'react'
import { useData } from '../store/DataProvider'
import { useIsScorekeeper } from '../store/RoleContext'
import { sportHomeAwayIds } from '../lib/matchState'
import { computeStandings } from '../lib/standings'

// MANCO report — one-tap assembly + PDF export (build spec §8, Phase 4).
// Visible only to the Scorekeeper (§3). Assembles a snapshot from current
// Firestore / demo data and either opens the print dialog (CSS @media print)
// or exports via jsPDF. The print-stylesheet fallback is the MVP (§2 note).

export function MancoReportButton() {
  const isScorekeeper = useIsScorekeeper()
  const [open, setOpen] = useState(false)
  if (!isScorekeeper) return null
  return (
    <>
      <button className="mgr-btn-primary" style={{ marginBottom: 12 }} onClick={() => setOpen(true)}>
        Generate MANCO report
      </button>
      {open && <MancoModal onClose={() => setOpen(false)} />}
    </>
  )
}

function MancoModal({ onClose }) {
  const { teams = [], fixtures = [], travel = {}, event } = useData()
  const [exporting, setExporting] = useState(false)

  const soccerRows = computeStandings('soccer', fixtures, teams, event)
  const netballRows = computeStandings('netball', fixtures, teams, event)
  const played = fixtures.filter(
    (f) => f.soccer?.status === 'final' || f.netball?.status === 'final',
  )

  // Round-robin fixtures always share one pairing across both sports, but the
  // playoff/final slots can seat different teams per sport once auto-
  // populated (§8) — so every score, scorer and card below is tagged with
  // its own sport's pairing via sportHomeAwayIds, never one shared
  // headlinePairing, or a divergent fixture would print one sport's score
  // under the other sport's team codes.
  const sportResult = (fx, sport) => {
    const s = fx[sport]
    if (s?.status !== 'final') return null
    const { homeTeamId, awayTeamId } = sportHomeAwayIds(fx, sport)
    return {
      home: teams.find((t) => t.id === homeTeamId),
      away: teams.find((t) => t.id === awayTeamId),
      score: s,
    }
  }

  const allScorers = []
  const allCards = []
  for (const fx of played) {
    for (const sport of ['soccer', 'netball']) {
      const s = fx[sport]
      if (!s) continue
      const { homeTeamId, awayTeamId } = sportHomeAwayIds(fx, sport)
      const home = teams.find((t) => t.id === homeTeamId)
      const away = teams.find((t) => t.id === awayTeamId)
      for (const sc of s.scorers || []) {
        allScorers.push({ ...sc, sport, homeTeam: home?.code, awayTeam: away?.code, matchNo: fx.matchNo })
      }
      for (const c of s.cards || []) {
        allCards.push({ ...c, sport, homeTeam: home?.code, awayTeam: away?.code, matchNo: fx.matchNo })
      }
    }
  }

  const exportPdf = async () => {
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      let y = 20

      const line = (text, size = 10, bold = false) => {
        pdf.setFontSize(size)
        pdf.setFont('helvetica', bold ? 'bold' : 'normal')
        const lines = pdf.splitTextToSize(text, 170)
        pdf.text(lines, 20, y)
        y += lines.length * (size * 0.4) + 3
        if (y > 270) { pdf.addPage(); y = 20 }
      }

      line('STADIO Inter-campus Sports Day', 18, true)
      line('Management Committee (MANCO) Report', 12)
      line(`Generated: ${new Date().toLocaleString('en-ZA')}`, 9)
      y += 4

      // Attendance
      line('1. Attendance', 13, true)
      for (const t of teams) {
        const tv = travel[t.id]
        const att = tv?.attendance || {}
        line(`${t.name}: ${att.present ?? 0} / ${att.total ?? 0} present`)
      }
      y += 4

      // Results
      line('2. Match results', 13, true)
      for (const fx of played) {
        const parts = ['soccer', 'netball'].map((sport) => {
          const r = sportResult(fx, sport)
          if (!r) return null
          const label = sport === 'soccer' ? 'Soccer' : 'Netball'
          return `${label} ${r.home?.code ?? 'TBD'} ${r.score.home}–${r.score.away} ${r.away?.code ?? 'TBD'}`
        }).filter(Boolean)
        line(`M${fx.matchNo}  ${parts.join('  ·  ')}`)
      }
      y += 4

      // Standings
      for (const [sport, rows] of [['Soccer', soccerRows], ['Netball', netballRows]]) {
        line(`3. ${sport} standings`, 13, true)
        for (const r of rows) {
          line(`${r.rank}. ${r.team.name}  P${r.played} W${r.won} D${r.drawn} L${r.lost}  +/−${r.diff}  Pts ${r.points}`)
        }
        y += 4
      }

      // Scorers
      if (allScorers.length) {
        line('4. Goal / point scorers', 13, true)
        for (const sc of allScorers) {
          line(`${sc.sport === 'soccer' ? 'Soccer' : 'Netball'}: ${sc.name ?? '—'} (${sc.teamId}) · M${sc.matchNo}${sc.minute ? ` ${sc.minute}'` : ''}`)
        }
        y += 4
      }

      // Cards
      if (allCards.length) {
        line('5. Disciplinary', 13, true)
        for (const c of allCards) {
          line(`${c.type === 'red' ? 'Red' : 'Yellow'} card: ${c.name ?? '—'} (${c.teamId}) · M${c.matchNo}${c.minute ? ` ${c.minute}'` : ''}`)
        }
      }

      pdf.save('STADIO-Sports-Day-MANCO-Report.pdf')
    } catch (err) {
      console.error('PDF generation failed:', err)
      window.print()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight: 800, fontSize: 16 }}>MANCO Report</span>
          <button className="modal-close" onClick={onClose}>Close</button>
        </div>

        <div className="report-preview">
          <ReportSection title="Attendance">
            {teams.map((t) => {
              const att = travel[t.id]?.attendance || {}
              return (
                <div className="rp-row" key={t.id}>
                  <span>{t.name}</span>
                  <span className="rp-val">{att.present ?? 0} / {att.total ?? 0}</span>
                </div>
              )
            })}
          </ReportSection>

          <ReportSection title="Results">
            {played.length === 0 && <div className="muted">No completed matches yet.</div>}
            {played.map((fx) => (
              <div className="rp-row" key={fx.id}>
                <span>M{fx.matchNo}</span>
                <span className="rp-val">
                  {['soccer', 'netball'].map((sport) => {
                    const r = sportResult(fx, sport)
                    if (!r) return null
                    const label = sport === 'soccer' ? 'Soccer' : 'Netball'
                    return (
                      <span key={sport}>
                        {label} {r.home?.code ?? 'TBD'} {r.score.home}–{r.score.away} {r.away?.code ?? 'TBD'}{' '}
                      </span>
                    )
                  })}
                </span>
              </div>
            ))}
          </ReportSection>

          <ReportSection title="Soccer standings">
            <StandingsTable rows={soccerRows} />
          </ReportSection>

          <ReportSection title="Netball standings">
            <StandingsTable rows={netballRows} />
          </ReportSection>

          {allScorers.length > 0 && (
            <ReportSection title="Scorers">
              {allScorers.map((sc, i) => (
                <div className="rp-row" key={i}>
                  <span>{sc.sport === 'soccer' ? 'Soccer' : 'Netball'}: {sc.name ?? '—'}</span>
                  <span className="rp-val">{sc.teamId} M{sc.matchNo}{sc.minute ? ` ${sc.minute}'` : ''}</span>
                </div>
              ))}
            </ReportSection>
          )}

          {allCards.length > 0 && (
            <ReportSection title="Disciplinary">
              {allCards.map((c, i) => (
                <div className="rp-row" key={i}>
                  <span>{c.type === 'red' ? 'Red' : 'Yellow'} card: {c.name ?? '—'}</span>
                  <span className="rp-val">{c.teamId} M{c.matchNo}</span>
                </div>
              ))}
            </ReportSection>
          )}
        </div>

        <button
          className="mgr-btn-primary"
          style={{ borderRadius: 0, minHeight: 52 }}
          onClick={exportPdf}
          disabled={exporting}
        >
          {exporting ? 'Generating…' : 'Export PDF'}
        </button>
      </div>
    </div>
  )
}

function ReportSection({ title, children }) {
  return (
    <div className="rp-section">
      <div className="kicker" style={{ marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function StandingsTable({ rows }) {
  return (
    <div>
      {rows.map((r) => (
        <div className="rp-row" key={r.team.id} style={r.rank === 1 ? { color: '#3f4346', fontWeight: 700 } : {}}>
          <span>{r.rank}. {r.team.name}</span>
          <span className="rp-val">P{r.played} +/−{r.diff} {r.points}pts</span>
        </div>
      ))}
    </div>
  )
}
