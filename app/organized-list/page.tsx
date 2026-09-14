import { getOrganizedHierarchy } from '@/app/actions/organized-list';
import { HierarchyView } from '@/components/organized-list/hierarchy-view';

export const dynamic = 'force-dynamic';

export default async function OrganizedListPage() {
  const data = await getOrganizedHierarchy();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Organized List
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hierarchical breakdown of Partner Agencies &rarr; CBOs &rarr; Participants, sorted alphabetically at every level.
        </p>
      </div>

      <HierarchyView initialData={data} />
    </div>
  );
}

