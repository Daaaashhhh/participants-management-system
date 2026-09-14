'use client';

import * as React from 'react';
import {
  CBOWithAgency,
  PartnerAgency,
  ParticipantStatus,
  ParticipantWithRelations,
} from '@/types/database';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ParticipantModal } from './participant-modal';
import { StatusBadge } from './status-badge';
import { ExportDropdown } from './export-dropdown';
import { deleteParticipant, updateParticipantStatus } from '@/app/actions/participants';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Search,
  Building2,
  Users2,
  UserCheck,
  Pencil,
  Trash2,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';

interface ParticipantTableProps {
  participants: ParticipantWithRelations[];
  agencies: PartnerAgency[];
  cbos: CBOWithAgency[];
}

export function ParticipantTable({
  participants,
  agencies,
  cbos,
}: ParticipantTableProps) {
  const [search, setSearch] = React.useState('');
  const [agencyFilter, setAgencyFilter] = React.useState('all');
  const [cboFilter, setCboFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<ParticipantStatus | 'all'>('all');

  const [selectedParticipant, setSelectedParticipant] =
    React.useState<ParticipantWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [participantToDelete, setParticipantToDelete] =
    React.useState<ParticipantWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);
  const { success, error } = useToast();

  // Cascaded CBOs for filter bar: only show CBOs for selected agency if agency is chosen
  const filterCboOptions = React.useMemo(() => {
    if (agencyFilter === 'all') return cbos;
    return cbos.filter((c) => c.partner_agency_id === agencyFilter);
  }, [cbos, agencyFilter]);

  // Handle agency filter change
  const handleAgencyFilterChange = (agencyId: string) => {
    setAgencyFilter(agencyId);
    setCboFilter('all'); // Reset CBO filter
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setAgencyFilter('all');
    setCboFilter('all');
    setStatusFilter('all');
  };

  // Client-side filtering
  const filteredParticipants = React.useMemo(() => {
    return participants.filter((p) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      // Agency
      if (agencyFilter !== 'all' && p.partner_agency_id !== agencyFilter) {
        return false;
      }
      // CBO
      if (cboFilter !== 'all' && p.cbo_id !== cboFilter) {
        return false;
      }
      // Status
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [participants, search, agencyFilter, cboFilter, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedParticipant(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ParticipantWithRelations) => {
    setSelectedParticipant(p);
    setIsModalOpen(true);
  };

  const handleQuickStatus = async (id: string, newStatus: ParticipantStatus) => {
    setStatusUpdatingId(id);
    try {
      const res = await updateParticipantStatus(id, newStatus);
      if (!res.success) {
        error(res.error || 'Failed to update status');
      } else {
        success(`Status updated to ${newStatus}`);
      }
    } catch {
      error('An error occurred updating status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!participantToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteParticipant(participantToDelete.id);
      if (!res.success) {
        error(res.error || 'Failed to delete participant');
      } else {
        success(`Participant "${participantToDelete.name}" deleted.`);
        setParticipantToDelete(null);
      }
    } catch {
      error('An error occurred deleting participant.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters =
    search !== '' || agencyFilter !== 'all' || cboFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search participants by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Actions: Export Tally & Add Participant */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ExportDropdown
              allParticipants={participants}
              filteredParticipants={filteredParticipants}
              agencies={agencies}
              cbos={cbos}
              hasActiveFilters={hasActiveFilters}
            />
            <Button onClick={handleOpenAdd} className="flex-shrink-0">
              <Plus className="h-4 w-4" />
              <span>Add Participant</span>
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 items-center">
          {/* Agency Filter */}
          <div className="relative">
            <select
              value={agencyFilter}
              onChange={(e) => handleAgencyFilterChange(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">All Agencies ({agencies.length})</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* CBO Filter (Cascaded) */}
          <div className="relative">
            <select
              value={cboFilter}
              onChange={(e) => setCboFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">
                {agencyFilter !== 'all' ? 'All CBOs for this Agency' : `All CBOs (${cbos.length})`}
              </option>
              {filterCboOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ParticipantStatus | 'all')}
              className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1.5 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Participant Name
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Partner Agency
                </th>
                <th scope="col" className="px-6 py-3.5">
                  CBO
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Date Confirmed
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No participants found</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'No participants match your active search and filter criteria'
                          : 'Enroll your first participant to populate this list'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {participant.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span>{participant.name}</span>
                      </div>
                    </td>

                    {/* Agency */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{participant.partner_agency?.name || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* CBO */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Users2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{participant.cbo?.name || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Status with inline changer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={participant.status} />
                        <select
                          value={participant.status}
                          disabled={statusUpdatingId === participant.id}
                          onChange={(e) =>
                            handleQuickStatus(participant.id, e.target.value as ParticipantStatus)
                          }
                          className="text-[11px] font-medium text-slate-500 bg-transparent hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                          title="Change status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* Date Confirmed */}
                    <td className="px-6 py-4 text-xs">
                      {participant.date_confirmed ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{formatDate(participant.date_confirmed)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not confirmed</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(participant)}
                        title="Edit Participant"
                      >
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setParticipantToDelete(participant)}
                        title="Delete Participant"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <ParticipantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        participant={selectedParticipant}
        agencies={agencies}
        cbos={cbos}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Participant"
        message={`Are you sure you want to remove "${participantToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}

