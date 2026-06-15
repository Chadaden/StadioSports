/* eslint-disable react-refresh/only-export-components */
// Role context (§3). Resolved once from the URL; never changes within a session.
// Screens read this to decide whether to render organiser controls. For the
// Viewer it returns { role: 'viewer' } and every control renders nothing.

import { createContext, useContext, useMemo } from 'react'
import { resolveRole, ROLES } from '../lib/roles'

const RoleContext = createContext({ role: ROLES.VIEWER, teamId: null })

export function RoleProvider({ children }) {
  const value = useMemo(() => resolveRole(), [])
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  return useContext(RoleContext)
}

export function useIsScorekeeper() {
  return useRole().role === ROLES.SCOREKEEPER
}

export function useIsManager() {
  return useRole().role === ROLES.MANAGER
}
