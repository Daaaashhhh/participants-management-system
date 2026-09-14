'use client';

import * as React from 'react';
import { CBOWithAgency, PartnerAgency } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CboModal } from './cbo-modal';
import { deleteCbo } from '@/app/actions/cbos';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { Plus, Building2, Users2, Pencil, Trash2, Calendar, Filter } from 'lucide-react';

interface CboTableProps {
  cbos: CBOWithAgency[];
  agencies: PartnerAgency[];
}

export function CboTable({ cbos, agencies }: CboTableProps) {
  const [selectedAgencyFilter, setSelectedAgencyFilter] = React.useState<string>('all');
  const [selectedCbo, setSelectedCbo] = React.useState<CBOWithAgency | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [cboToDelete, setCboToDelete] = React.useState<CBOWithAgency | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { success, error } = useToast();

  const filteredCbos = React.useMemo(() => {
    if (selectedAgencyFilter === 'all') return cbos;
    return cbos.filter((c) => c.partner_agency_id === selectedAgencyFilter);
  }, [cbos, selectedAgencyFilter]);

  const handleOpenAdd = () => {
    setSelectedCbo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cbo: CBOWithAgency) => {
    setSelectedCbo(cbo);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!cboToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteCbo(cboToDelete.id);
      if (!res.success) {
        error(res.error || 'Failed to delete CBO.');
      } else {
        success(`CBO "${cboToDelete.name}" deleted successfully.`);
        setCboToDelete(null);
      }
    } catch {
      error('An unexpected error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls: Agency Filter & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedAgencyFilter}
            onChange={(e) => setSelectedAgencyFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-xs text-slate-700"
          >
            <option value="all">All Partner Agencies ({agencies.length})</option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleOpenAdd} className="sm:self-auto self-start">
          <Plus className="h-4 w-4" />
          <span>Add CBO</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  CBO Name
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Partner Agency
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Enrolled Participants
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Created At
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCbos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users2 className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No CBOs found</p>
                      <p className="text-xs text-slate-400">
                        {selectedAgencyFilter !== 'all'
                          ? 'No CBOs enrolled under the selected Partner Agency'
                          : 'Get started by creating your first CBO'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCbos.map((cbo) => (
                  <tr key={cbo.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {cbo.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{cbo.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{cbo.partner_agency?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {cbo._count?.participants ?? 0} participants
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(cbo.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(cbo)}
                        title="Edit CBO"
                      >
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCboToDelete(cbo)}
                        title="Delete CBO"
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

      {/* Add/Edit Modal */}
      <CboModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cbo={selectedCbo}
        agencies={agencies}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!cboToDelete}
        onClose={() => setCboToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete CBO"
        message={`Are you sure you want to delete "${cboToDelete?.name}"? All participants belonging to this CBO will also be removed.`}
      />
    </div>
  );
}

