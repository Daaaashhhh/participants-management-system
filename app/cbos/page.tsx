import { getCbos } from '@/app/actions/cbos';
import { getAgencies } from '@/app/actions/agencies';
import { CboTable } from '@/components/cbos/cbo-table';

export const dynamic = 'force-dynamic';

export default async function CbosPage() {
  const [cbos, agencies] = await Promise.all([getCbos(), getAgencies()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Community-Based Organizations (CBOs)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage CBO branches linked to their respective partner agencies.
        </p>
      </div>

      <CboTable cbos={cbos} agencies={agencies} />
    </div>
  );
}

