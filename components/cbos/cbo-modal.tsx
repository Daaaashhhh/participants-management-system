'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createCbo, updateCbo } from '@/app/actions/cbos';
import { CBOWithAgency, PartnerAgency } from '@/types/database';

interface CboModalProps {
  isOpen: boolean;
  onClose: () => void;
  cbo?: CBOWithAgency | null;
  agencies: PartnerAgency[];
}

export function CboModal({ isOpen, onClose, cbo, agencies }: CboModalProps) {
  const [partnerAgencyId, setPartnerAgencyId] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    if (cbo) {
      setPartnerAgencyId(cbo.partner_agency_id);
      setName(cbo.name);
    } else {
      setPartnerAgencyId(agencies[0]?.id || '');
      setName('');
    }
    setError('');
  }, [cbo, agencies, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!partnerAgencyId) {
      setError('Please select a Partner Agency.');
      return;
    }

    if (name.trim().length < 2) {
      setError('CBO name must be at least 2 characters.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('partner_agency_id', partnerAgencyId);
    formData.append('name', name);

    try {
      if (cbo) {
        const res = await updateCbo(cbo.id, formData);
        if (!res.success) {
          setError(res.error || 'Failed to update CBO');
          toastError(res.error || 'Failed to update CBO');
        } else {
          success(`CBO "${name}" updated successfully.`);
          onClose();
        }
      } else {
        const res = await createCbo(formData);
        if (!res.success) {
          setError(res.error || 'Failed to create CBO');
          toastError(res.error || 'Failed to create CBO');
        } else {
          success(`CBO "${name}" added successfully.`);
          onClose();
        }
      }
    } catch {
      setError('An unexpected error occurred.');
      toastError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cbo ? 'Edit CBO' : 'Add New CBO'}
      description="Each CBO directly belongs to a single Partner Agency."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="agency-select"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Partner Agency <span className="text-rose-500">*</span>
          </label>
          <select
            id="agency-select"
            value={partnerAgencyId}
            onChange={(e) => setPartnerAgencyId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="" disabled>
              Select an agency
            </option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="cbo-name"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            CBO Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="cbo-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CBO 1 - Youth Outreach"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {cbo ? 'Save Changes' : 'Create CBO'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

