'use client';

import * as React from 'react';
import { PartnerAgency } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AgencyModal } from './agency-modal';
import { deleteAgency } from '@/app/actions/agencies';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Building2, Pencil, Trash2, Calendar } from 'lucide-react';

interface AgencyTableProps {
  agencies: PartnerAgency[];
}

export function AgencyTable({ agencies }: AgencyTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedAgency, setSelectedAgency] = React.useState<PartnerAgency | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [agencyToDelete, setAgencyToDelete] = React.useState<PartnerAgency | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { success, error } = useToast();

  const filteredAgencies = React.useMemo(() => {
    if (!searchTerm.trim()) return agencies;
    const term = searchTerm.toLowerCase();
    return agencies.filter((a) => a.name.toLowerCase().includes(term));
  }, [agencies, searchTerm]);

  const handleOpenAdd = () => {
    setSelectedAgency(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agency: PartnerAgency) => {
    setSelectedAgency(agency);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!agencyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteAgency(agencyToDelete.id);
      if (!res.success) {
        error(res.error || 'Failed to delete agency.');
      } else {
        success(`Agency "${agencyToDelete.name}" deleted successfully.`);
        setAgencyToDelete(null);
      }
    } catch {
      error('An unexpected error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agencies by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-xs"
          />
        </div>

        <Button onClick={handleOpenAdd} className="sm:self-auto self-start">
          <Plus className="h-4 w-4" />
          <span>Add Agency</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Agency Name
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Created At
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgencies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No partner agencies found</p>
                      <p className="text-xs text-slate-400">
                        {searchTerm ? 'Try changing your search keywords' : 'Get started by creating your first agency'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAgencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {agency.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{agency.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(agency.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(agency.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(agency)}
                        title="Edit Agency"
                      >
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAgencyToDelete(agency)}
                        title="Delete Agency"
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
      <AgencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agency={selectedAgency}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!agencyToDelete}
        onClose={() => setAgencyToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Partner Agency"
        message={`Are you sure you want to delete "${agencyToDelete?.name}"? Warning: Deleting this agency will also delete all associated CBOs and enrolled participants under it.`}
      />
    </div>
  );
}

