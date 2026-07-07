// ============================================================================
// PRIVATE PLAYER PROFILES — shape reference (POPIA, build spec §9)
// ----------------------------------------------------------------------------
// The real data lives in privateProfiles.local.js, which is GIT-IGNORED
// because this repo is public: emergency contacts, cell numbers and medical
// conditions must never land in git history. Copy this file to
//
//   src/data/privateProfiles.local.js
//
// and fill it from the campus sheet (one entry per player, keyed by the same
// player ids as seed.js). ID numbers, DOB, gender and emails are deliberately
// excluded from ingest.
//
// Where it's used (only ever for the manager role):
//   · store/DataProvider.jsx lazy-loads it in demo mode
//   · scripts/seed-firestore.mjs seeds it to the manager-only subcollection
//     events/{id}/teams/{teamId}/private/{playerId}
// Both degrade gracefully when the file is absent — managers just see
// "No private details on file".
// ============================================================================

export const playerProfiles = {
  'dur-00': {
    phone: '072 000 0000', // player's own cell, '0XX XXX XXXX'
    emergencyName: 'Jane Example (Mother)',
    emergencyPhone: '083 000 0000',
    medical: 'Asthmatic', // null when none
    dietary: 'Halaal', // null when none
    notes: null, // free text from the sheet's Notes column
  },
}
