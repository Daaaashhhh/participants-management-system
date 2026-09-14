'use client';

import * as React from 'react';
import { OrganizedAgency } from '@/types/database';
import { StatusBadge } from '@/components/participants/status-badge';
import { formatDate } from '@/lib/utils';
import {
  Building2,
  Users2,
  UserCheck,
  Search,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  FoldVertical,
  UnfoldVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HierarchyViewProps {
  initialData: OrganizedAgency[];
}

export function HierarchyView({ initialData }: HierarchyViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  // Map of agencyId -> boolean to track expanded state
  const [collapsedAgencies, setCollapsedAgencies] = React.useState<Record<string, boolean>>({});

  const toggleAgency = (agencyId: string) => {
    setCollapsedAgencies((prev) => ({
      ...prev,
      [agencyId]: !prev[agencyId],
    }));
  };

  const collapseAll = () => {
    const allCollapsed = initialData.reduce((acc, a) => {
      acc[a.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setCollapsedAgencies(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedAgencies({});
  };

  // Filter tree based on search query
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return initialData;
    const q = searchTerm.toLowerCase();

    return initialData
      .map((agency) => {
        const agencyMatches = agency.name.toLowerCase().includes(q);

        const matchingCbos = agency.cbos
          .map((cbo) => {
            const cboMatches = cbo.name.toLowerCase().includes(q);
            const matchingParticipants = cbo.participants.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.status.toLowerCase().includes(q)
            );

            if (agencyMatches || cboMatches || matchingParticipants.length > 0) {
              return {
                ...cbo,
                participants:
                  agencyMatches || cboMatches ? cbo.participants : matchingParticipants,
              };
            }
            return null;
          })
          .filter(Boolean) as typeof agency.cbos;

        if (agencyMatches || matchingCbos.length > 0) {
          return {
            ...agency,
            cbos: agencyMatches ? agency.cbos : matchingCbos,
          };
        }
        return null;
      })
      .filter(Boolean) as OrganizedAgency[];
  }, [initialData, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hierarchy by Agency, CBO, or Participant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5">
            <UnfoldVertical className="h-3.5 w-3.5" />
            <span>Expand All</span>
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5">
            <FoldVertical className="h-3.5 w-3.5" />
            <span>Collapse All</span>
          </Button>
        </div>
      </div>

      {/* Hierarchical Tree Container */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No matching records found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm
              ? 'Try changing your search terms.'
              : 'Add Partner Agencies, CBOs, and Participants to view the hierarchy.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((agency) => {
            const isCollapsed = Boolean(collapsedAgencies[agency.id]);
            const totalAgencyParticipants = agency.cbos.reduce(
              (sum, c) => sum + c.participants.length,
              0
            );

            return (
              <div
                key={agency.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                {/* LEVEL 1: Partner Agency Header (Prominent and Bold) */}
                <button
                  type="button"
                  onClick={() => toggleAgency(agency.id)}
                  className="w-full flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white text-left hover:opacity-95 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-200 font-bold">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold tracking-tight text-white">
                          {agency.name}
                        </h2>
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-indigo-200 border border-white/10">
                          Partner Agency
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-normal mt-0.5">
                        {agency.cbos.length} CBO{agency.cbos.length === 1 ? '' : 's'} &bull;{' '}
                        {totalAgencyParticipants} Participant
                        {totalAgencyParticipants === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="p-1 rounded bg-white/10 text-slate-200">
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {/* Agency Children Container */}
                {!isCollapsed && (
                  <div className="p-5 space-y-4 bg-slate-50/40">
                    {agency.cbos.length === 0 ? (
                      <div className="p-6 rounded-lg border border-dashed border-slate-200 bg-white text-center">
                        <Users2 className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-slate-600">
                          No CBOs registered under {agency.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Create a CBO to assign participants.
                        </p>
                      </div>
                    ) : (
                      agency.cbos.map((cbo) => (
                        <div
                          key={cbo.id}
                          className="ml-0 sm:ml-4 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                        >
                          {/* LEVEL 2: CBO Header (Visually Distinct) */}
                          <div className="px-5 py-3 bg-slate-100/75 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                <Users2 className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                  {cbo.name}
                                </h3>
                              </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                              {cbo.participants.length} Participant
                              {cbo.participants.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {/* LEVEL 3: Participants List (Beneath their CBO) */}
                          <div className="p-3">
                            {cbo.participants.length === 0 ? (
                              <div className="py-4 text-center text-xs text-slate-400 italic">
                                No participants enrolled under {cbo.name}
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {cbo.participants.map((participant) => (
                                  <div
                                    key={participant.id}
                                    className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 rounded-lg transition-colors"
                                  >
                                    {/* Participant Name */}
                                    <div className="flex items-center gap-3">
                                      <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-200">
                                        <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                                      </div>
                                      <span className="text-sm font-semibold text-slate-900">
                                        {participant.name}
                                      </span>
                                    </div>

                                    {/* Status and Confirmation Date */}
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                      <StatusBadge status={participant.status} />

                                      {participant.date_confirmed ? (
                                        <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                          <CalendarCheck className="h-3 w-3 text-emerald-600" />
                                          <span>
                                            Confirmed: {formatDate(participant.date_confirmed)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">
                                          Pending confirmation
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

