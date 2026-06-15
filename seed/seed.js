/**
 * STADIO National Sports Day 2026 — Firestore Seed Script
 *
 * Prerequisites:
 *   1. cd seed && npm install
 *   2. Download a Firebase Admin SDK service account JSON from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   3. Set env vars:
 *      export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
 *      export FIREBASE_PROJECT_ID=your-project-id
 *   4. Run: node seed.js
 */

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
});

const db = admin.firestore();
const EVENT_ID = 'nsd2026';
const EVENT_PATH = `events/${EVENT_ID}`;

async function seed() {
  console.log('Seeding STADIO NSD 2026 data…');

  // ── Event doc ──────────────────────────────────────────────────────────────
  await db.doc(EVENT_PATH).set({
    name: 'National Sports Day 2026',
    host: 'Centurion',
    dateISO: '2026-08-01',
    status: 'scheduled',
    sports: ['soccer', 'netball'],
    courts: { soccer: 'Indoor Soccer Court', netball: 'Netball Court' },
    streamUrl: { soccer: '', netball: '' },
    squadSizes: { soccer: 8, netball: 9 },
    points: {
      soccer: { win: 3, draw: 1, loss: 0 },
      netball: { win: 2, draw: 1, loss: 0 },
    },
    tieBreakers: ['points', 'scoreDiff', 'headToHead'],
    pins: {
      scorekeeper: '1234',
      centurion: '0000',
      musgrave: '0000',
      durbanville: '0000',
      waterfall: '0000',
    },
  });
  console.log('✓ Event doc');

  // ── Teams ──────────────────────────────────────────────────────────────────
  const teams = {
    centurion: {
      name: 'Centurion',
      code: 'CEN',
      colorKey: 'sky',
      colorHex: '#3BB1E5',
      type: 'host',
      travel: null,
      rosterLoaded: false,
    },
    waterfall: {
      name: 'Waterfall',
      code: 'WAT',
      colorKey: 'purple',
      colorHex: '#8A63A9',
      type: 'local',
      travel: null,
      rosterLoaded: false,
    },
    musgrave: {
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
    durbanville: {
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
  };

  for (const [id, data] of Object.entries(teams)) {
    await db.doc(`${EVENT_PATH}/teams/${id}`).set(data);
  }
  console.log('✓ Teams');

  // ── Durbanville players ────────────────────────────────────────────────────
  const durPlayers = [
    { id: 'dur_p1',  firstName: 'Umair',     surname: 'Aspeling',     sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p2',  firstName: 'Cameron',   surname: 'Clayton',      sport: 'soccer',  role: 'player',  isGK: true,  present: false },
    { id: 'dur_p3',  firstName: 'Ugochukwu', surname: 'Ezeh',         sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p4',  firstName: 'Noah',      surname: 'Williams',     sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p5',  firstName: 'Phumlani',  surname: 'Sikwana',      sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p6',  firstName: 'Sinegugu',  surname: 'Mgoduka',      sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p7',  firstName: 'Luke',      surname: 'Alexander',    sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p8',  firstName: 'Enrique',   surname: 'Njalo',        sport: 'soccer',  role: 'player',  isGK: false, present: false },
    { id: 'dur_p9',  firstName: 'Shane',     surname: 'Christians',   sport: 'soccer',  role: 'support', isGK: false, present: false },
    { id: 'dur_p10', firstName: 'Kerryn',    surname: 'Busch',        sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p11', firstName: 'Michaela',  surname: 'Lilley',       sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p12', firstName: 'Jana',      surname: 'Jacobs',       sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p13', firstName: 'Shakirah',  surname: 'Jacobs',       sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p14', firstName: 'Bridget',   surname: 'Van Dyk',      sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p15', firstName: 'Anja',      surname: 'Giliomee',     sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p16', firstName: 'Sumari',    surname: 'Hanekom',      sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p17', firstName: 'Skyla',     surname: 'Rademeyer',    sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p18', firstName: 'Catelyn',   surname: 'Levey',        sport: 'netball', role: 'player',  isGK: false, present: false },
    { id: 'dur_p19', firstName: 'Stephany',  surname: 'Kühn',         sport: 'netball', role: 'support', isGK: false, present: false },
    { id: 'dur_p20', firstName: 'Monette',   surname: 'Biggins',      sport: 'soccer',  role: 'hoc',     isGK: false, present: false },
    { id: 'dur_p21', firstName: 'Quinton',   surname: 'Du Toit',      sport: 'soccer',  role: 'support', isGK: false, present: false },
  ];

  for (const p of durPlayers) {
    const { id, ...data } = p;
    await db.doc(`${EVENT_PATH}/teams/durbanville/players/${id}`).set(data);
  }
  console.log(`✓ Durbanville players (${durPlayers.length})`);

  // ── Fixtures ───────────────────────────────────────────────────────────────
  function emptyScore() {
    return { status: 'upcoming', home: 0, away: 0, scorers: [], cards: [] };
  }

  const fixtures = [
    { id: 'm1', matchNo: 1, slotTime: '11:45', round: 'roundRobin', homeTeamId: 'centurion',   awayTeamId: 'musgrave',    soccer: emptyScore(), netball: emptyScore() },
    { id: 'm2', matchNo: 2, slotTime: '12:10', round: 'roundRobin', homeTeamId: 'durbanville', awayTeamId: 'waterfall',   soccer: emptyScore(), netball: emptyScore() },
    { id: 'm3', matchNo: 3, slotTime: '12:35', round: 'roundRobin', homeTeamId: 'centurion',   awayTeamId: 'durbanville', soccer: emptyScore(), netball: emptyScore() },
    { id: 'm4', matchNo: 4, slotTime: '14:00', round: 'roundRobin', homeTeamId: 'musgrave',    awayTeamId: 'waterfall',   soccer: emptyScore(), netball: emptyScore() },
    { id: 'm5', matchNo: 5, slotTime: '14:25', round: 'roundRobin', homeTeamId: 'centurion',   awayTeamId: 'waterfall',   soccer: emptyScore(), netball: emptyScore() },
    { id: 'm6', matchNo: 6, slotTime: '14:50', round: 'roundRobin', homeTeamId: 'musgrave',    awayTeamId: 'durbanville', soccer: emptyScore(), netball: emptyScore() },
    { id: 'm7', matchNo: 7, slotTime: '15:15', round: 'playoff',    homeTeamId: 'tbd',         awayTeamId: 'tbd',         soccer: emptyScore(), netball: emptyScore() },
    { id: 'm8', matchNo: 8, slotTime: '15:40', round: 'final',      homeTeamId: 'tbd',         awayTeamId: 'tbd',         soccer: emptyScore(), netball: emptyScore() },
  ];

  for (const f of fixtures) {
    const { id, ...data } = f;
    await db.doc(`${EVENT_PATH}/fixtures/${id}`).set(data);
  }
  console.log('✓ Fixtures');

  // ── Travel docs ────────────────────────────────────────────────────────────
  const travelDocs = {
    centurion:   { status: 'local',      milestone: null,           attendance: { present: 0, total: 0,  markedAllAt: null }, etaISO: null },
    waterfall:   { status: 'local',      milestone: null,           attendance: { present: 0, total: 0,  markedAllAt: null }, etaISO: null },
    musgrave:    { status: 'in_transit', milestone: 'checked_in',   attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null },
    durbanville: { status: 'in_transit', milestone: 'checked_in',   attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null },
  };

  for (const [id, data] of Object.entries(travelDocs)) {
    await db.doc(`${EVENT_PATH}/travel/${id}`).set(data);
  }
  console.log('✓ Travel docs');

  console.log('\nSeed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
