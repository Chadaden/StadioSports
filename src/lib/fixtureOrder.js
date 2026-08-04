function hasStatus(fixture, status) {
  return ['soccer', 'netball'].some((sport) => fixture?.[sport]?.status === status)
}

export function fixtureDisplayGroups(fixtures) {
  const active = []
  const published = []

  for (const fixture of fixtures || []) {
    if (['soccer', 'netball'].every((sport) => fixture?.[sport]?.status === 'final')) {
      published.push(fixture)
    } else {
      active.push(fixture)
    }
  }

  const priority = (fixture) => {
    if (hasStatus(fixture, 'live')) return 0
    if (hasStatus(fixture, 'upcoming')) return 1
    return 2
  }
  active.sort((a, b) => priority(a) - priority(b) || (a.matchNo || 0) - (b.matchNo || 0))
  published.sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0))
  return { active, published }
}
