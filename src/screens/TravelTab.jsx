import { useTeams } from '../hooks/useTeams.js';
import { useTravel } from '../hooks/useTravel.js';
import { usePlayers } from '../hooks/usePlayers.js';
import TravelCard from '../components/TravelCard.jsx';

const EVENT_ID = import.meta.env.VITE_EVENT_ID || 'nsd2026';

const TEAM_ORDER = ['centurion', 'musgrave', 'durbanville', 'waterfall'];

function TeamTravelCard({ teamId, teams, travel, eventId }) {
  const players = usePlayers(teamId, eventId);
  return (
    <TravelCard
      teamId={teamId}
      teamData={teams[teamId]}
      travelData={travel[teamId]}
      players={players}
      eventId={eventId}
    />
  );
}

export default function TravelTab() {
  const teams = useTeams(EVENT_ID);
  const travel = useTravel(EVENT_ID);

  const orderedTeams = TEAM_ORDER.filter((tid) => teams[tid]);

  return (
    <div>
      <div className="section-header">
        <span className="section-title">Team Travel Status</span>
      </div>
      {orderedTeams.map((tid) => (
        <TeamTravelCard
          key={tid}
          teamId={tid}
          teams={teams}
          travel={travel}
          eventId={EVENT_ID}
        />
      ))}
      {orderedTeams.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✈️</div>
          <div className="empty-state-text">No travel data yet</div>
          <div className="empty-state-sub">Travel status will appear once data is seeded</div>
        </div>
      )}
    </div>
  );
}
