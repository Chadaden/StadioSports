export default function TeamBadge({ team, showName = true }) {
  if (!team) return null;
  return (
    <span className="team-chip">
      <span className="team-dot" style={{ background: team.colorHex || '#AEAEAF' }} />
      {showName && (team.name || team.code || team.id)}
    </span>
  );
}
