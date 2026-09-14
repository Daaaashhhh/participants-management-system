'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createAgency, updateAgency } from '@/app/actions/agencies';
import { PartnerAgency } from '@/types/database';

interface AgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency?: PartnerAgency | null;
}

export function AgencyModal({ isOpen, onClose, agency }: AgencyModalProps) {
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    if (agency) {
      setName(agency.name);
    } else {
      setName('');
    }
    setError('');
  }, [agency, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Agency name must be at least 2 characters.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('name', name);

    try {
      if (agency) {
        const res = await updateAgency(agency.id, formData);
        if (!res.success) {
          setError(res.error || 'Failed to update agency');
          toastError(res.error || 'Failed to update agency');
        } else {
          success(`Agency "${name}" updated successfully.`);
          onClose();
        }
      } else {
        const res = await createAgency(formData);
        if (!res.success) {
          setError(res.error || 'Failed to create agency');
          toastError(res.error || 'Failed to create agency');
        } else {
          success(`Agency "${name}" added successfully.`);
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
      title={agency ? 'Edit Partner Agency' : 'Add Partner Agency'}
      description="Partner agencies sit at the top of the organization hierarchy."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="agency-name"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Agency Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="agency-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Department of Social Welfare"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            autoFocus
          />
          {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {agency ? 'Save Changes' : 'Create Agency'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

