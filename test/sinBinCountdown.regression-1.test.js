import test from 'node:test'
import assert from 'node:assert/strict'

import { sinBinRemainingSeconds } from '../src/lib/matchState.js'

// Regression: ISSUE-002 — a stale render tick displayed 2:01 / 10:01 immediately after card issue.
// Found by /qa on 2026-07-17.
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-17.md
test('sin-bin display never exceeds the configured card duration', () => {
  const issuedAt = '2026-07-17T10:00:00.000Z'
  const staleRenderTick = Date.parse(issuedAt) - 400

  assert.equal(sinBinRemainingSeconds({ type: 'yellow', issuedAt }, staleRenderTick), 120)
  assert.equal(sinBinRemainingSeconds({ type: 'red', issuedAt }, staleRenderTick), 600)
})
