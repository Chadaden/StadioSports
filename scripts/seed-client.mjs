/**
 * STADIO NSD 2026 — client-SDK seed.
 *
 * Seeds Firestore using the Firebase Web SDK and the project's web config
 * (root .env, VITE_FIREBASE_* vars). Works without an Admin service-account
 * key because the MVP firestore.rules allow open writes under events/{id}/**.
 *
 * Run from the repo root after the web config is in .env:
 *   node scripts/seed-client.mjs
 *
 * For a production deploy, tighten firestore.rules and seed with the Admin
 * SDK (seed/seed.js) instead.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Minimal .env loader (no dotenv dependency) ───────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  let raw = '';
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    console.error(`No .env found at ${envPath}. Populate it from .env.example first.`);
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-project-id') {
  console.error('VITE_FIREBASE_PROJECT_ID is not set to a real project in .env.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EVENT_ID = env.VITE_EVENT_ID || 'nsd2026';
const EVENT_PATH = `events/${EVENT_ID}`;

const emptyScore = () => ({ status: 'upcoming', home: 0, away: 0, scorers: [], cards: [] });

const teams = {
  centurion: { name: 'Centurion', code: 'CEN', colorKey: 'sky', colorHex: '#3BB1E5', type: 'host', travel: null, rosterLoaded: false },
  waterfall: { name: 'Waterfall', code: 'WAT', colorKey: 'purple', colorHex: '#8A63A9', type: 'local', travel: null, rosterLoaded: false },
  musgrave: { name: 'Musgrave', code: 'MUS', colorKey: 'lime', colorHex: '#96C93E', type: 'travel', travel: { fromAirport: 'King Shaka International', viaAirport: 'OR Tambo International', mode: 'fly+bus' }, rosterLoaded: false },
  durbanville: { name: 'Durbanville', code: 'DUR', colorKey: 'red', colorHex: '#ED1C24', type: 'travel', travel: { fromAirport: 'Cape Town International', viaAirport: 'OR Tambo International', mode: 'fly+bus' }, rosterLoaded: true },
};

const durPlayers = [
  { id: 'dur_p1', firstName: 'Umair', surname: 'Aspeling', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p2', firstName: 'Cameron', surname: 'Clayton', sport: 'soccer', role: 'player', isGK: true, present: false },
  { id: 'dur_p3', firstName: 'Ugochukwu', surname: 'Ezeh', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p4', firstName: 'Noah', surname: 'Williams', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p5', firstName: 'Phumlani', surname: 'Sikwana', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p6', firstName: 'Sinegugu', surname: 'Mgoduka', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p7', firstName: 'Luke', surname: 'Alexander', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p8', firstName: 'Enrique', surname: 'Njalo', sport: 'soccer', role: 'player', isGK: false, present: false },
  { id: 'dur_p9', firstName: 'Shane', surname: 'Christians', sport: 'soccer', role: 'support', isGK: false, present: false },
  { id: 'dur_p10', firstName: 'Kerryn', surname: 'Busch', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p11', firstName: 'Michaela', surname: 'Lilley', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p12', firstName: 'Jana', surname: 'Jacobs', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p13', firstName: 'Shakirah', surname: 'Jacobs', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p14', firstName: 'Bridget', surname: 'Van Dyk', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p15', firstName: 'Anja', surname: 'Giliomee', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p16', firstName: 'Sumari', surname: 'Hanekom', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p17', firstName: 'Skyla', surname: 'Rademeyer', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p18', firstName: 'Catelyn', surname: 'Levey', sport: 'netball', role: 'player', isGK: false, present: false },
  { id: 'dur_p19', firstName: 'Stephany', surname: 'Kühn', sport: 'netball', role: 'support', isGK: false, present: false },
  { id: 'dur_p20', firstName: 'Monette', surname: 'Biggins', sport: 'soccer', role: 'hoc', isGK: false, present: false },
  { id: 'dur_p21', firstName: 'Quinton', surname: 'Du Toit', sport: 'soccer', role: 'support', isGK: false, present: false },
];

const fixtures = [
  { id: 'm1', matchNo: 1, slotTime: '11:45', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'musgrave', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm2', matchNo: 2, slotTime: '12:10', round: 'roundRobin', homeTeamId: 'durbanville', awayTeamId: 'waterfall', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm3', matchNo: 3, slotTime: '12:35', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'durbanville', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm4', matchNo: 4, slotTime: '14:00', round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'waterfall', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm5', matchNo: 5, slotTime: '14:25', round: 'roundRobin', homeTeamId: 'centurion', awayTeamId: 'waterfall', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm6', matchNo: 6, slotTime: '14:50', round: 'roundRobin', homeTeamId: 'musgrave', awayTeamId: 'durbanville', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm7', matchNo: 7, slotTime: '15:15', round: 'playoff', homeTeamId: 'tbd', awayTeamId: 'tbd', soccer: emptyScore(), netball: emptyScore() },
  { id: 'm8', matchNo: 8, slotTime: '15:40', round: 'final', homeTeamId: 'tbd', awayTeamId: 'tbd', soccer: emptyScore(), netball: emptyScore() },
];

const travelDocs = {
  centurion: { status: 'local', milestone: null, attendance: { present: 0, total: 0, markedAllAt: null }, etaISO: null },
  waterfall: { status: 'local', milestone: null, attendance: { present: 0, total: 0, markedAllAt: null }, etaISO: null },
  musgrave: { status: 'in_transit', milestone: 'checked_in', attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null },
  durbanville: { status: 'in_transit', milestone: 'checked_in', attendance: { present: 0, total: 21, markedAllAt: null }, etaISO: null },
};

async function seed() {
  console.log(`Seeding ${EVENT_PATH} in project "${firebaseConfig.projectId}"…`);

  await setDoc(doc(db, EVENT_PATH), {
    name: 'National Sports Day 2026',
    host: 'Centurion',
    dateISO: '2026-08-01',
    status: 'scheduled',
    sports: ['soccer', 'netball'],
    courts: { soccer: 'Indoor Soccer Court', netball: 'Netball Court' },
    streamUrl: { soccer: '', netball: '' },
    squadSizes: { soccer: 8, netball: 9 },
    points: { soccer: { win: 3, draw: 1, loss: 0 }, netball: { win: 2, draw: 1, loss: 0 } },
    tieBreakers: ['points', 'scoreDiff', 'headToHead'],
    pins: { scorekeeper: '1234', centurion: '0000', musgrave: '0000', durbanville: '0000', waterfall: '0000' },
  });
  console.log('✓ Event doc');

  for (const [id, data] of Object.entries(teams)) {
    await setDoc(doc(db, `${EVENT_PATH}/teams/${id}`), data);
  }
  console.log('✓ Teams');

  for (const { id, ...data } of durPlayers) {
    await setDoc(doc(db, `${EVENT_PATH}/teams/durbanville/players/${id}`), data);
  }
  console.log(`✓ Durbanville players (${durPlayers.length})`);

  for (const { id, ...data } of fixtures) {
    await setDoc(doc(db, `${EVENT_PATH}/fixtures/${id}`), data);
  }
  console.log('✓ Fixtures');

  for (const [id, data] of Object.entries(travelDocs)) {
    await setDoc(doc(db, `${EVENT_PATH}/travel/${id}`), data);
  }
  console.log('✓ Travel docs');

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
