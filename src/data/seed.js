// ============================================================================
// SEED DATA — STADIO National Sports Day Live Hub
// ----------------------------------------------------------------------------
// Source of truth for LOCAL DEMO MODE and for seeding a fresh Firestore event.
// Derived from the build spec (§7 schema) and Inter_campus_sports_dayChad.xlsx.
//
// POPIA (§9): PUBLIC player docs carry NAMES, SPORT and ROLE only. Emergency
// contacts, cells, medical and dietary info live in the GIT-IGNORED
// data/privateProfiles.local.js (this repo is public — see
// privateProfiles.example.js) and are seeded to a manager-only Firestore
// subcollection — never into any publicly readable doc. ID numbers, DOB,
// gender and emails are deliberately not ingested at all.
//
// Data readiness: all submitted public roster rows are loaded. Centurion has
// soccer from the original sheet plus netball from Centurion_netball.xlsx
// received 6 Aug. Sensitive columns from that sheet were not committed.
// ============================================================================

export const EVENT_ID = 'national-sports-day-2026'

// ---------- event config (events/{eventId}) ----------
export const event = {
  name: 'STADIO Inter-campus Sports Day 2026',
  host: 'Centurion',
  dateISO: '2026-08-00', // TODO(client §11): confirm exact August date
  status: 'scheduled', // scheduled | live | complete
  sports: ['soccer', 'netball'],
  courts: { soccer: 'Indoor Soccer Court', netball: 'Netball Court' },
  // redirect only — the app never hosts the stream (§1)
  streamUrl: { soccer: '', netball: '' }, // TODO(client §11): stream link(s)
  squadSizes: { soccer: 8, netball: 9 },
  // Tournament notes (sheet): all games 20 minutes total — 10-minute halves
  // with a 5-minute halftime. Drives the scorekeeper match clock.
  matchFormat: { minutesPerHalf: 10, halves: 2, halftimeMinutes: 5 },
  points: {
    soccer: { win: 3, draw: 1, loss: 0 }, // client-confirmed 16 Jul
    netball: { win: 3, draw: 1, loss: 0 }, // client-confirmed 16 Jul — same as soccer
  },
  // Client-confirmed 16 Jul: points, goal difference, goals scored,
  // head-to-head, then fewest goals conceded.
  tieBreakers: ['points', 'scoreDiff', 'goalsFor', 'headToHead', 'goalsAgainst'],
}

// ---------- teams (events/{eventId}/teams/{teamId}) ----------
// Colours locked to the STADIO Higher Education colour codes (April 2026 update,
// STADIO-sports-hub-colour-system.md §2) — fixed per school, not home/away, and
// reserved for team identity only (never reused for sport-panel accents).
export const teams = [
  {
    id: 'centurion',
    name: 'Centurion',
    code: 'CEN',
    colorKey: 'law-rose',
    colorHex: '#BF4956',
    type: 'host',
    travel: null,
    rosterLoaded: true,
  },
  {
    id: 'musgrave',
    name: 'Musgrave',
    code: 'MUS',
    colorKey: 'blue',
    colorHex: '#3CB4E7',
    type: 'travel',
    travel: {
      fromAirport: 'King Shaka International',
      viaAirport: 'OR Tambo International',
      mode: 'fly+bus',
    },
    rosterLoaded: true,
  },
  {
    id: 'durbanville',
    name: 'Durbanville',
    code: 'DUR',
    colorKey: 'green',
    colorHex: '#9ACA3C',
    type: 'travel',
    travel: {
      fromAirport: 'Cape Town International',
      viaAirport: 'OR Tambo International',
      mode: 'fly+bus',
    },
    rosterLoaded: true,
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    code: 'WAT',
    colorKey: 'purple',
    colorHex: '#8D64AA',
    type: 'local',
    travel: null,
    rosterLoaded: true,
  },
]

// ---------- players (events/{eventId}/teams/{teamId}/players/{playerId}) ----------
// All campuses from Inter_campus_sports_dayChad.xlsx — names / sport / role /
// shirtNumber / isGK only; the sensitive columns are ingested into the git-ignored
// data/privateProfiles.local.js keyed by these same ids (manager-only, §9).
// Centurion: soccer from the sheet's "Player number details soccer" tab
// (14 Jul), plus netball from Centurion_netball.xlsx (6 Aug). The uploaded
// netball sheet also included ID number, DOB, gender, cell and email columns;
// those stay out of this public repo.
export const players = {
  centurion: [
    { id: 'cen-01', firstName: 'Bono hyphen', surname: 'Kholophe', role: 'player', sport: 'soccer', shirtNumber: 2, isGK: false },
    { id: 'cen-02', firstName: 'Dihlora', surname: 'Dinyake', role: 'player', sport: 'soccer', shirtNumber: 3, isGK: false },
    { id: 'cen-03', firstName: 'Neo', surname: 'Mokhutle', role: 'player', sport: 'soccer', shirtNumber: 4, isGK: false },
    { id: 'cen-04', firstName: 'Divhani', surname: 'Mudzielwana', role: 'player', sport: 'soccer', shirtNumber: 5, isGK: false },
    { id: 'cen-05', firstName: 'Phomelelo', surname: 'Phasha', role: 'player', sport: 'soccer', shirtNumber: 6, isGK: false },
    { id: 'cen-06', firstName: 'Mohau', surname: 'Keoagile', role: 'player', sport: 'soccer', shirtNumber: 7, isGK: false },
    { id: 'cen-07', firstName: 'Murangi', surname: 'Mashapha', role: 'player', sport: 'soccer', shirtNumber: 1, isGK: false },
    { id: 'cen-08', firstName: 'Tshegofatso', surname: 'Masubelele', role: 'player', sport: 'soccer', shirtNumber: 8, isGK: false },
    { id: 'cen-09', firstName: 'Ofentse', surname: 'Segole', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-10', firstName: 'Cebelihle', surname: 'Zwane', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-11', firstName: 'Khonani', surname: 'Munzhelele', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-12', firstName: 'Thabang', surname: 'Ntsabeng', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-13', firstName: 'Mmaskabane', surname: 'Theledi', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-14', firstName: 'Rorisang', surname: 'Kabane', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-15', firstName: 'Bianca', surname: 'Ngwabela', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-16', firstName: 'Vuthlarhi Tercia', surname: 'Shingange', role: 'player', sport: 'netball', isGK: false },
    { id: 'cen-17', firstName: 'Khuselo', surname: 'Nkala', role: 'player', sport: 'netball', isGK: false },
  ],
  musgrave: [
    { id: 'mus-01', firstName: 'Quaide', surname: 'Salie', role: 'support', sport: null, isGK: false },
    { id: 'mus-02', firstName: 'Hamza', surname: 'Amla', role: 'player', sport: 'soccer', shirtNumber: 2, isGK: false },
    { id: 'mus-03', firstName: 'Brady', surname: 'Harban', role: 'player', sport: 'soccer', shirtNumber: 3, isGK: false },
    { id: 'mus-04', firstName: 'Ismaaeel', surname: 'Sheik', role: 'player', sport: 'soccer', shirtNumber: 4, isGK: false },
    { id: 'mus-05', firstName: 'Anele', surname: 'Kubheka', role: 'support', sport: 'netball', isGK: false },
    { id: 'mus-06', firstName: 'Alwande', surname: 'Ramukhele', role: 'player', sport: 'soccer', shirtNumber: 1, isGK: false },
    { id: 'mus-07', firstName: 'Asanda', surname: 'Hlophe', role: 'player', sport: 'soccer', shirtNumber: 5, isGK: false },
    { id: 'mus-08', firstName: 'Ntando', surname: 'Mlambo', role: 'player', sport: 'soccer', shirtNumber: 6, isGK: false },
    { id: 'mus-09', firstName: 'Tumelo', surname: 'Mapotse', role: 'player', sport: 'soccer', shirtNumber: 7, isGK: false },
    { id: 'mus-10', firstName: 'Blessing Tafara', surname: 'Madimbu', role: 'player', sport: 'soccer', shirtNumber: 8, isGK: false },
    { id: 'mus-11', firstName: 'Siyabonga Malusi', surname: 'Maphumulo', role: 'support', sport: 'netball', isGK: false },
    { id: 'mus-12', firstName: 'Melissa Amanda', surname: 'Kitsher', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-13', firstName: 'Leigh-Anne', surname: 'Yeni', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-14', firstName: 'Skhanyiso', surname: 'Ndwalane', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-15', firstName: 'Caitlyn Amy', surname: 'Watt', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-16', firstName: 'Jada', surname: 'Le Cordier', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-17', firstName: 'Mawande', surname: 'Mpungose', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-18', firstName: 'Elaine', surname: 'De Kock', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-19', firstName: 'Jessica', surname: 'Peattie', role: 'player', sport: 'netball', isGK: false },
    { id: 'mus-20', firstName: 'Jacqueline Yvette', surname: 'Naidoo', role: 'hoc', sport: null, isGK: false },
  ],
  durbanville: [
    { id: 'dur-01', firstName: 'Monette', surname: 'Biggins', role: 'hoc', sport: null, isGK: false },
    { id: 'dur-02', firstName: 'Quinton', surname: 'Du Toit', role: 'support', sport: null, isGK: false },
    { id: 'dur-03', firstName: 'Umair', surname: 'Aspeling', role: 'player', sport: 'soccer', shirtNumber: 2, isGK: false },
    { id: 'dur-04', firstName: 'Cameron', surname: 'Clayton', role: 'player', sport: 'soccer', shirtNumber: 1, isGK: true },
    { id: 'dur-05', firstName: 'Ugochukwu', surname: 'Ezeh', role: 'player', sport: 'soccer', shirtNumber: 3, isGK: false },
    { id: 'dur-06', firstName: 'Noah', surname: 'Williams', role: 'player', sport: 'soccer', shirtNumber: 4, isGK: false },
    { id: 'dur-07', firstName: 'Phumlani', surname: 'Sikwana', role: 'player', sport: 'soccer', shirtNumber: 5, isGK: false },
    { id: 'dur-08', firstName: 'Sinegugu', surname: 'Mgoduka', role: 'player', sport: 'soccer', shirtNumber: 6, isGK: false },
    { id: 'dur-09', firstName: 'Luke', surname: 'Alexander', role: 'player', sport: 'soccer', shirtNumber: 7, isGK: false },
    { id: 'dur-10', firstName: 'Shane', surname: 'Christians', role: 'support', sport: 'soccer', isGK: false },
    { id: 'dur-11', firstName: 'Simon', surname: 'Kadzomba', role: 'player', sport: 'soccer', shirtNumber: 8, isGK: false },
    { id: 'dur-12', firstName: 'Kerryn', surname: 'Busch', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-13', firstName: 'Michaela', surname: 'Lilley', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-14', firstName: 'Jana', surname: 'Jacobs', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-15', firstName: 'Shakirah', surname: 'Jacobs', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-16', firstName: 'Bridget', surname: 'Van Dyk', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-17', firstName: 'Anja', surname: 'Giliomee', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-18', firstName: 'Sumari', surname: 'Hanekom', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-19', firstName: 'Skyla', surname: 'Rademeyer', role: 'player', sport: 'netball', isGK: false },
    { id: 'dur-20', firstName: 'Stephany', surname: 'Kühn', role: 'support', sport: 'netball', isGK: false },
    { id: 'dur-21', firstName: 'Catelyn', surname: 'Michelle Levey', role: 'player', sport: 'netball', isGK: false },
  ],
  waterfall: [
    { id: 'wat-01', firstName: 'Sekepe', surname: 'Ramodika', role: 'player', sport: 'soccer', shirtNumber: 2, isGK: false },
    { id: 'wat-02', firstName: 'Matsobane', surname: 'Mangoale', role: 'player', sport: 'soccer', shirtNumber: 3, isGK: false },
    { id: 'wat-03', firstName: 'Maumela Benedict', surname: 'Ngwekhulu', role: 'player', sport: 'soccer', shirtNumber: 1, isGK: false },
    { id: 'wat-04', firstName: 'Lihle', surname: 'Matika', role: 'player', sport: 'soccer', shirtNumber: 4, isGK: false },
    { id: 'wat-05', firstName: 'Siya', surname: 'Thusi', role: 'player', sport: 'soccer', shirtNumber: 5, isGK: false },
    { id: 'wat-06', firstName: 'Kutloano', surname: 'Mothibi', role: 'player', sport: 'soccer', shirtNumber: 6, isGK: false },
    { id: 'wat-07', firstName: 'Tayler Skye', surname: 'Thomas', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-08', firstName: 'Keabetswe', surname: 'Mokgoro', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-09', firstName: 'Gabisile', surname: 'Mdyogolo', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-10', firstName: 'Houlemata Kiesha', surname: 'Toure', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-11', firstName: 'Joy', surname: 'Makhubele', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-12', firstName: 'Luyanda', surname: 'Mcunukelwa', role: 'player', sport: 'soccer', shirtNumber: 7, isGK: false },
    { id: 'wat-13', firstName: 'Keven Nathaniel', surname: 'Marambakuyana', role: 'player', sport: 'soccer', shirtNumber: 8, isGK: false },
    { id: 'wat-14', firstName: 'Tshireletso', surname: 'Menyatsoe', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-15', firstName: 'Malebelo Refentse', surname: 'Sekgotodi', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-16', firstName: 'Pheladi', surname: 'Makua', role: 'player', sport: 'netball', isGK: false },
    { id: 'wat-17', firstName: 'Zanele', surname: 'Makganye', role: 'player', sport: 'netball', isGK: false },
  ],
}

// ---------- fixtures (events/{eventId}/fixtures/{fixtureId}) ----------
// Round-robin (m1–m6) → 3rd/4th playoff (m7) → final (m8), pairings and slot
// times from the sheet's Program tab. Round-robin pairings are fixed and
// shared by both sports (fixture-level homeTeamId/awayTeamId below). The
// playoff/final slots instead carry a per-sport homeTeamId/awayTeamId (null
// until auto-populated, see lib/standings.js computeAutoPairings), since
// soccer and netball run separate round-robin tables and can seat different
// teams in the same match slot (§8). Screens resolve the effective pairing
// for a sport via lib/matchState.js sportHomeAwayIds().
// `clock` powers the scorekeeper match timer (see lib/clock.js): null until
// kick-off, then { phase, runningSince, baseSeconds }.
const blankSport = () => ({
  status: 'upcoming', home: 0, away: 0, scorers: [], cards: [], clock: null,
  homeTeamId: null, awayTeamId: null,
})

export const fixtures = [
  { id: 'm1', matchNo: 1, slotTime: '10:30', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'waterfall', soccer: blankSport(), netball: blankSport() },
  { id: 'm2', matchNo: 2, slotTime: '11:00', round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'durbanville', soccer: blankSport(), netball: blankSport() },
  { id: 'm3', matchNo: 3, slotTime: '11:30', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'musgrave', soccer: blankSport(), netball: blankSport() },
  { id: 'm4', matchNo: 4, slotTime: '12:00', round: 'roundRobin', homeTeamId: 'waterfall', awayTeamId: 'durbanville', soccer: blankSport(), netball: blankSport() },
  { id: 'm5', matchNo: 5, slotTime: '12:30', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'durbanville', soccer: blankSport(), netball: blankSport() },
  { id: 'm6', matchNo: 6, slotTime: '13:00', round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'waterfall', soccer: blankSport(), netball: blankSport() },
  // Bracket pairings resolve from standings on the day (§11). TBD placeholders.
  { id: 'm7', matchNo: 7, slotTime: '14:00', round: 'playoff', homeTeamId: null, awayTeamId: null, soccer: blankSport(), netball: blankSport() },
  { id: 'm8', matchNo: 8, slotTime: '14:30', round: 'final', homeTeamId: null, awayTeamId: null, soccer: blankSport(), netball: blankSport() },
]

// ---------- travel / attendance (events/{eventId}/travel/{teamId}) ----------
// Local teams collapse to "Squad present"; travel teams show the milestone rail.
export const travel = {
  centurion: { status: 'local', milestone: null, attendance: { present: 0, total: 17, markedAllAt: null }, etaISO: null, travellers: 0 },
  waterfall: { status: 'local', milestone: null, attendance: { present: 0, total: 17, markedAllAt: null }, etaISO: null, travellers: 0 },
  musgrave: { status: 'in_transit', milestone: 'checked_in', attendance: { present: 0, total: 20, markedAllAt: null }, etaISO: null, travellers: 20 },
  durbanville: { status: 'in_transit', milestone: 'checked_in', attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null, travellers: 21 },
}

// ---------- announcements (events/{eventId}/announcements/{id}) ----------
export const announcements = [
  {
    id: 'a1',
    body: 'Welcome to STADIO Inter-campus Sports Day at Centurion Campus. Follow live scores, fixtures and standings right here.',
    createdAt: '2026-08-00T11:30:00',
  },
]

// ---------- day schedule (Schedule tab — static, from the Program sheet) ----------
export const schedule = [
  { time: '09:30', activity: 'Team arrivals, welcome & warm-up', venue: 'Main Court', kind: 'ceremony' },
  { time: '10:30', activity: 'Match 1 — Centurion vs Waterfall', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '11:00', activity: 'Match 2 — Musgrave vs Durbanville', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '11:30', activity: 'Match 3 — Centurion vs Musgrave', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '12:00', activity: 'Match 4 — Waterfall vs Durbanville', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '12:30', activity: 'Match 5 — Centurion vs Durbanville', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '13:00', activity: 'Match 6 — Musgrave vs Waterfall', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '13:25', activity: 'Lunch Break', venue: 'Catering Area', kind: 'break' },
  { time: '14:00', activity: '3rd / 4th Place Playoff', venue: 'Both Courts', kind: 'match' },
  { time: '14:30', activity: 'Championship Final', venue: 'Both Courts', kind: 'match' },
  { time: '15:00', activity: 'Prize Giving, Team Photos & Closing', venue: 'Main Court', kind: 'ceremony' },
]

// Milestone rail order for travelling squads (§6).
export const MILESTONES = ['checked_in', 'boarded', 'landed', 'on_bus', 'arrived']
export const MILESTONE_LABELS = {
  checked_in: 'Checked in',
  boarded: 'Boarded',
  landed: 'Landed',
  on_bus: 'On bus',
  arrived: 'Arrived',
}

// Convenience: full in-memory snapshot used by demo mode.
export function buildSeedSnapshot() {
  return {
    event: { id: EVENT_ID, ...event },
    teams: teams.map((t) => ({ ...t, players: players[t.id] || [] })),
    fixtures: fixtures.map((f) => structuredClone(f)),
    travel: structuredClone(travel),
    announcements: structuredClone(announcements),
  }
}
