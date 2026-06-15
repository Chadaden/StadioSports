import { jsPDF } from 'jspdf';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { computeStandings } from './standings.js';

const TEAM_NAMES = {
  centurion: 'Centurion',
  musgrave: 'Musgrave',
  durbanville: 'Durbanville',
  waterfall: 'Waterfall',
};

function fmtDate() {
  return new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function generateMancoReport({ fixtures, teams, travel }) {
  const teamIds = Object.keys(teams);
  const standings = computeStandings(fixtures, teamIds);

  // Collect scorers + cards per sport
  const events = { soccer: [], netball: [] };
  for (const fix of fixtures) {
    for (const sport of ['soccer', 'netball']) {
      const s = fix[sport];
      if (!s) continue;
      const homeName = teams[fix.homeTeamId]?.name || fix.homeTeamId;
      const awayName = teams[fix.awayTeamId]?.name || fix.awayTeamId;
      const matchLabel = `M${fix.matchNo} ${homeName} vs ${awayName}`;
      (s.scorers || []).forEach((sc) => {
        events[sport].push({ match: matchLabel, type: 'Goal', player: sc.name || sc, team: sc.team || '' });
      });
      (s.cards || []).forEach((c) => {
        events[sport].push({ match: matchLabel, type: `${c.colour === 'yellow' ? 'Yellow' : 'Red'} Card`, player: c.name || c, team: c.team || '', minute: c.minute || '' });
      });
    }
  }

  // Attendance summary
  const attendanceSummary = Object.entries(travel).map(([tid, t]) => ({
    team: teams[tid]?.name || tid,
    present: t.attendance?.present ?? 0,
    total: t.attendance?.total ?? 0,
    milestone: t.milestone || t.status || 'local',
  }));

  // Build PDF
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  let y = 20;

  function addLine(text, size = 11, bold = false, color = [83, 87, 91]) {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    pdf.text(text, 15, y);
    y += size * 0.5 + 2;
  }

  function addSectionHeader(text) {
    y += 4;
    pdf.setFillColor(59, 177, 229);
    pdf.rect(15, y - 5, pageW - 30, 9, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(text.toUpperCase(), 17, y);
    y += 8;
  }

  function checkPage() {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
  }

  // Header
  pdf.setFillColor(83, 87, 91);
  pdf.rect(0, 0, 210, 18, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('STADIO NATIONAL SPORTS DAY 2026', 15, 11);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MANCO Report — Confidential', pageW - 15, 11, { align: 'right' });
  y = 28;

  addLine(`Generated: ${fmtDate()}`, 9, false, [117, 123, 127]);
  addLine('Host: Centurion  |  Sports: Soccer & Netball', 9, false, [117, 123, 127]);
  y += 4;

  // Attendance
  addSectionHeader('Team Attendance');
  for (const a of attendanceSummary) {
    checkPage();
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(83, 87, 91);
    pdf.text(a.team, 17, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${a.present}/${a.total} present  |  Status: ${a.milestone}`, 70, y);
    y += 7;
  }

  // Standings
  for (const sport of ['soccer', 'netball']) {
    checkPage();
    addSectionHeader(`${sport.charAt(0).toUpperCase() + sport.slice(1)} Standings`);
    const rows = standings[sport] || [];
    const cols = ['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
    const colX = [17, 25, 80, 92, 103, 114, 125, 136, 147, 158];
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(117, 123, 127);
    cols.forEach((c, i) => pdf.text(c, colX[i], y));
    y += 5;
    rows.forEach((r, idx) => {
      checkPage();
      if (idx === 0) {
        pdf.setFillColor(240, 250, 232);
        pdf.rect(15, y - 4, pageW - 30, 7, 'F');
      }
      pdf.setFontSize(9);
      pdf.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
      pdf.setTextColor(83, 87, 91);
      pdf.text(String(idx + 1), colX[0], y);
      pdf.text(TEAM_NAMES[r.teamId] || r.teamId, colX[1], y);
      [r.P, r.W, r.D, r.L, r.GF, r.GA, r.GD, r.Pts].forEach((v, i) => {
        pdf.text(String(v), colX[i + 2], y);
      });
      y += 7;
    });
  }

  // Match results
  addSectionHeader('Match Results');
  for (const fix of fixtures) {
    checkPage();
    const homeName = teams[fix.homeTeamId]?.name || fix.homeTeamId;
    const awayName = teams[fix.awayTeamId]?.name || fix.awayTeamId;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(83, 87, 91);
    pdf.text(`M${fix.matchNo} ${fix.slotTime}  ${homeName} vs ${awayName}`, 17, y);
    pdf.setFont('helvetica', 'normal');
    const soc = fix.soccer;
    const net = fix.netball;
    const socStr = soc ? `Soccer: ${soc.home ?? '-'}–${soc.away ?? '-'} (${soc.status})` : '';
    const netStr = net ? `Netball: ${net.home ?? '-'}–${net.away ?? '-'} (${net.status})` : '';
    pdf.text([socStr, netStr].filter(Boolean).join('   '), 17, y + 5);
    y += 13;
  }

  // Events (goals/cards)
  for (const sport of ['soccer', 'netball']) {
    if (events[sport].length > 0) {
      checkPage();
      addSectionHeader(`${sport.charAt(0).toUpperCase() + sport.slice(1)} Match Events`);
      for (const ev of events[sport]) {
        checkPage();
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(83, 87, 91);
        const minStr = ev.minute ? ` (${ev.minute}')` : '';
        pdf.text(`${ev.match}  |  ${ev.type}: ${ev.player}${minStr}`, 17, y);
        y += 6;
      }
    }
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(174, 174, 175);
  pdf.text('STADIO National Sports Day 2026 — MANCO Report — Confidential', 15, 290);

  // Save snapshot to Firestore
  try {
    const snapshot = {
      createdAt: serverTimestamp(),
      standings,
      attendance: attendanceSummary,
      fixtureCount: fixtures.length,
    };
    await addDoc(collection(db, 'events/nsd2026/reports'), snapshot);
  } catch (e) {
    console.warn('Failed to save report snapshot:', e);
  }

  // Download / open
  pdf.save(`MANCO-Report-NSD2026-${Date.now()}.pdf`);
}
