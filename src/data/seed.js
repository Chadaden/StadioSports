// ============================================================================
// SEED DATA — STADIO National Sports Day Live Hub
// ----------------------------------------------------------------------------
// Source of truth for LOCAL DEMO MODE and for seeding a fresh Firestore event.
// Derived from the build spec (§7 schema) and Stadio_Sports_day_data.xlsx (§9).
//
// POPIA (§9): players carry NAMES, SPORT and ROLE only. No ID numbers, cells,
// emails, DOB, gender, medical or emergency-contact data is present anywhere.
//
// Data readiness (§9): only Durbanville has a real roster (21 people). The
// other three campuses carry planning numbers but no player rows — they are
// seeded with rosterLoaded:false and render a clean "Roster pending" state.
// ============================================================================

export const EVENT_ID = 'national-sports-day-2026'

// ---------- event config (events/{eventId}) ----------
export const event = {
  name: 'National Sports Day 2026',
  host: 'Centurion',
  dateISO: '2026-08-00', // TODO(client §11): confirm exact August date
  status: 'scheduled', // scheduled | live | complete
  sports: ['soccer', 'netball'],
  courts: { soccer: 'Indoor Soccer Court', netball: 'Netball Court' },
  // redirect only — the app never hosts the stream (§1)
  streamUrl: { soccer: '', netball: '' }, // TODO(client §11): stream link(s)
  squadSizes: { soccer: 8, netball: 9 },
  points: {
    soccer: { win: 3, draw: 1, loss: 0 }, // TODO(client §11): confirm
    netball: { win: 2, draw: 1, loss: 0 }, // TODO(client §11): confirm
  },
  tieBreakers: ['points', 'scoreDiff', 'headToHead'], // TODO(client §11): confirm order
}

// ---------- teams (events/{eventId}/teams/{teamId}) ----------
// Colours snapped to the STADIO spectrum (§4) — provisional, one-line swap.
export const teams = [
  {
    id: 'centurion',
    name: 'Centurion',
    code: 'CEN',
    colorKey: 'sky',
    colorHex: '#3BB1E5',
    type: 'host',
    travel: null,
    rosterLoaded: false,
  },
  {
    id: 'musgrave',
    name: 'Musgrave',
    code: 'MUS',
    colorKey: 'lime',
    colorHex: '#96C93E',
    type: 'travel',
    travel: {
      fromAirport: 'King Shaka International',
      viaAirport: 'OR Tambo International',
      mode: 'fly+bus',
    },
    rosterLoaded: false,
  },
  {
    id: 'durbanville',
    name: 'Durbanville',
    code: 'DUR',
    colorKey: 'red',
    colorHex: '#ED1C24',
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
    colorHex: '#8A63A9',
    type: 'local',
    travel: null,
    rosterLoaded: false,
  },
]

// ---------- players (events/{eventId}/teams/{teamId}/players/{playerId}) ----------
// Durbanville only. Names / sport / role / isGK — PII stripped at ingest (§9).
export const players = {
  durbanville: [
    { id: 'dur-01', firstName: 'Monette', surname: 'Biggins', role: 'hoc', sport: null, isGK: false },
    { id: 'dur-02', firstName: 'Quinton', surname: 'Du Toit', role: 'support', sport: null, isGK: false },
    { id: 'dur-03', firstName: 'Umair', surname: 'Aspeling', role: 'player', sport: 'soccer', isGK: false },
    { id: 'dur-04', firstName: 'Cameron', surname: 'Clayton', role: 'player', sport: 'soccer', isGK: true },
    { id: 'dur-05', firstName: 'Ugochukwu', surname: 'Ezeh', role: 'player', sport: 'soccer', isGK: false },
    { id: 'dur-06', firstName: 'Noah', surname: 'Williams', role: 'player', sport: 'soccer', isGK: false },
    { id: 'dur-07', firstName: 'Phumlani', surname: 'Sikwana', role: 'player', sport: 'soccer', isGK: false },
    { id: 'dur-08', firstName: 'Sinegugu', surname: 'Mgoduka', role: 'player', sport: 'soccer', isGK: false },
    { id: 'dur-09', firstName: 'Luke', surname: 'Alexander', role: 'player', sport: 'soccer', isGK: false },
    { id: 'dur-10', firstName: 'Shane', surname: 'Christians', role: 'support', sport: 'soccer', isGK: false },
    { id: 'dur-11', firstName: 'Enrique', surname: 'Njalo', role: 'player', sport: 'soccer', isGK: false },
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
  centurion: [],
  musgrave: [],
  waterfall: [],
}

// ---------- fixtures (events/{eventId}/fixtures/{fixtureId}) ----------
// Round-robin (m1–m6) → 3rd/4th playoff (m7) → final (m8). Same pairing drives
// both sports. Pre-event seed: every match "upcoming", no scores. Components
// fully support live/final so the board lights up when a scorekeeper writes.
const blankSport = () => ({ status: 'upcoming', home: 0, away: 0, scorers: [], cards: [] })

export const fixtures = [
  { id: 'm1', matchNo: 1, slotTime: '11:45', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'musgrave', soccer: blankSport(), netball: blankSport() },
  { id: 'm2', matchNo: 2, slotTime: '12:10', round: 'roundRobin', homeTeamId: 'durbanville', awayTeamId: 'waterfall', soccer: blankSport(), netball: blankSport() },
  { id: 'm3', matchNo: 3, slotTime: '12:35', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'durbanville', soccer: blankSport(), netball: blankSport() },
  { id: 'm4', matchNo: 4, slotTime: '14:00', round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'waterfall', soccer: blankSport(), netball: blankSport() },
  { id: 'm5', matchNo: 5, slotTime: '14:25', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'waterfall', soccer: blankSport(), netball: blankSport() },
  { id: 'm6', matchNo: 6, slotTime: '14:50', round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'durbanville', soccer: blankSport(), netball: blankSport() },
  // Bracket pairings resolve from standings on the day (§11). TBD placeholders.
  { id: 'm7', matchNo: 7, slotTime: '15:15', round: 'playoff', homeTeamId: null, awayTeamId: null, soccer: blankSport(), netball: blankSport() },
  { id: 'm8', matchNo: 8, slotTime: '15:40', round: 'final', homeTeamId: null, awayTeamId: null, soccer: blankSport(), netball: blankSport() },
]

// ---------- travel / attendance (events/{eventId}/travel/{teamId}) ----------
// Local teams collapse to "Squad present"; travel teams show the milestone rail.
export const travel = {
  centurion: { status: 'local', milestone: null, attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null, travellers: 0 },
  waterfall: { status: 'local', milestone: null, attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null, travellers: 0 },
  musgrave: { status: 'in_transit', milestone: 'checked_in', attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null, travellers: 20 },
  durbanville: { status: 'in_transit', milestone: 'checked_in', attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null, travellers: 21 },
}

// ---------- announcements (events/{eventId}/announcements/{id}) ----------
export const announcements = [
  {
    id: 'a1',
    body: 'Welcome to STADIO National Sports Day at Centurion Campus. Follow live scores, standings and squad travel right here.',
    createdAt: '2026-08-00T11:30:00',
  },
]

// ---------- day schedule (Schedule tab — static, §6) ----------
export const schedule = [
  { time: '11:45', activity: 'Soccer & Netball — Match 1', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '12:10', activity: 'Soccer & Netball — Match 2', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '12:35', activity: 'Soccer & Netball — Match 3', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '13:00', activity: 'Lunch Break', venue: 'Catering Area', kind: 'break' },
  { time: '14:00', activity: 'Soccer & Netball — Match 4', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '14:25', activity: 'Soccer & Netball — Match 5', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '14:50', activity: 'Soccer & Netball — Match 6', venue: 'Indoor Soccer Court · Netball Court', kind: 'match' },
  { time: '15:15', activity: '3rd / 4th Playoff', venue: 'Both Courts', kind: 'match' },
  { time: '15:40', activity: 'Finals', venue: 'Both Courts', kind: 'match' },
  { time: '16:10', activity: 'Prize Giving & Closing', venue: 'Main Court', kind: 'ceremony' },
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
