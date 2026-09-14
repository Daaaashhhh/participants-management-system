import { getParticipants } from '@/app/actions/participants';
import { getAgencies } from '@/app/actions/agencies';
import { getCbos } from '@/app/actions/cbos';
import { ParticipantTable } from '@/components/participants/participant-table';

export const dynamic = 'force-dynamic';

export default async function ParticipantsPage() {
  const [participants, agencies, cbos] = await Promise.all([
    getParticipants(),
    getAgencies(),
    getCbos(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Participant Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage enrolled participants, verify agency &amp; CBO assignments, and update statuses.
        </p>
      </div>

      <ParticipantTable
        participants={participants}
        agencies={agencies}
        cbos={cbos}
      />
    </div>
  );
}

