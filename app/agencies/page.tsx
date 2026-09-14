import { getAgencies } from '@/app/actions/agencies';
import { AgencyTable } from '@/components/agencies/agency-table';

export const dynamic = 'force-dynamic';

export default async function AgenciesPage() {
  const agencies = await getAgencies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Partner Agencies
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage partner agencies at the top of the organizational structure.
        </p>
      </div>

      <AgencyTable agencies={agencies} />
    </div>
  );
}

