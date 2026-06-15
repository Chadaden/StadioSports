// Role resolution from the URL (§3 — three roles via three links).
//
// Phase 1 ships the public VIEWER only. The Scorekeeper (Phase 2) and Team
// Manager (Phase 3) links are resolved here so the write-scoped UI can layer
// on without restructuring. The Viewer must show ZERO trace of organiser
// tools, so screens read `role` and simply render nothing extra when 'viewer'.
//
// Link shape (provisional, finalised in Phase 5 with proper auth):
//   /              → viewer  (public, no auth)
//   /?role=scorekeeper&key=…   → scorekeeper (tablet)
//   /?role=manager&team=durbanville&key=…  → team manager (one per team)

export const ROLES = { VIEWER: 'viewer', SCOREKEEPER: 'scorekeeper', MANAGER: 'manager' }

export function resolveRole(search = window.location.search) {
  const p = new URLSearchParams(search)
  const role = (p.get('role') || '').toLowerCase()
  if (role === ROLES.SCOREKEEPER) return { role: ROLES.SCOREKEEPER, teamId: null }
  if (role === ROLES.MANAGER) return { role: ROLES.MANAGER, teamId: p.get('team') || null }
  return { role: ROLES.VIEWER, teamId: null }
}
