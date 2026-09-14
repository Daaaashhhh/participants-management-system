'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createParticipant, updateParticipant } from '@/app/actions/participants';
import {
  CBOWithAgency,
  PartnerAgency,
  ParticipantStatus,
  ParticipantWithRelations,
} from '@/types/database';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant?: ParticipantWithRelations | null;
  agencies: PartnerAgency[];
  cbos: CBOWithAgency[];
}

export function ParticipantModal({
  isOpen,
  onClose,
  participant,
  agencies,
  cbos,
}: ParticipantModalProps) {
  const [partnerAgencyId, setPartnerAgencyId] = React.useState('');
  const [cboId, setCboId] = React.useState('');
  const [name, setName] = React.useState('');
  const [status, setStatus] = React.useState<ParticipantStatus>('Pending');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { success, error: toastError } = useToast();

  // Filter CBOs dynamically based on selected Partner Agency (Dependent Dropdown)
  const availableCbos = React.useMemo(() => {
    if (!partnerAgencyId) return [];
    return cbos.filter((c) => c.partner_agency_id === partnerAgencyId);
  }, [cbos, partnerAgencyId]);

  React.useEffect(() => {
    if (participant) {
      setPartnerAgencyId(participant.partner_agency_id);
      setCboId(participant.cbo_id);
      setName(participant.name);
      setStatus(participant.status);
    } else {
      const defaultAgencyId = agencies[0]?.id || '';
      setPartnerAgencyId(defaultAgencyId);

      // Default to first available CBO for this agency
      const firstCbo = cbos.find((c) => c.partner_agency_id === defaultAgencyId);
      setCboId(firstCbo?.id || '');
      setName('');
      setStatus('Pending');
    }
    setError('');
  }, [participant, agencies, cbos, isOpen]);

  // When Partner Agency changes, automatically reset or re-select valid CBO
  const handleAgencyChange = (newAgencyId: string) => {
    setPartnerAgencyId(newAgencyId);
    const validCbos = cbos.filter((c) => c.partner_agency_id === newAgencyId);
    if (validCbos.length > 0) {
      setCboId(validCbos[0].id);
    } else {
      setCboId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!partnerAgencyId) {
      setError('Please select a Partner Agency.');
      return;
    }

    if (!cboId) {
      setError('Please select a CBO. If none are listed, create one under this agency first.');
      return;
    }

    if (name.trim().length < 2) {
      setError('Participant name must be at least 2 characters.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('partner_agency_id', partnerAgencyId);
    formData.append('cbo_id', cboId);
    formData.append('name', name);
    formData.append('status', status);

    try {
      if (participant) {
        const res = await updateParticipant(participant.id, formData);
        if (!res.success) {
          setError(res.error || 'Failed to update participant');
          toastError(res.error || 'Failed to update participant');
        } else {
          success(`Participant "${name}" updated successfully.`);
          onClose();
        }
      } else {
        const res = await createParticipant(formData);
        if (!res.success) {
          setError(res.error || 'Failed to create participant');
          toastError(res.error || 'Failed to create participant');
        } else {
          success(`Participant "${name}" enrolled successfully.`);
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
      title={participant ? 'Edit Participant' : 'Enroll New Participant'}
      description="Follow the relational hierarchy: select Partner Agency, then select CBO."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Partner Agency Dropdown */}
        <div>
          <label
            htmlFor="participant-agency"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            1. Partner Agency <span className="text-rose-500">*</span>
          </label>
          <select
            id="participant-agency"
            value={partnerAgencyId}
            onChange={(e) => handleAgencyChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="" disabled>
              Select Partner Agency
            </option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Dependent CBO Dropdown */}
        <div>
          <label
            htmlFor="participant-cbo"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            2. CBO (Filtered by Agency) <span className="text-rose-500">*</span>
          </label>
          <select
            id="participant-cbo"
            value={cboId}
            onChange={(e) => setCboId(e.target.value)}
            disabled={!partnerAgencyId || availableCbos.length === 0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
          >
            {availableCbos.length === 0 ? (
              <option value="">No CBOs available under selected agency</option>
            ) : (
              availableCbos.map((cbo) => (
                <option key={cbo.id} value={cbo.id}>
                  {cbo.name}
                </option>
              ))
            )}
          </select>
          {partnerAgencyId && availableCbos.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No CBOs found for this agency. Please create a CBO under this agency first.
            </p>
          )}
        </div>

        {/* Step 3: Participant Name */}
        <div>
          <label
            htmlFor="participant-name"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            3. Participant Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="participant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Step 4: Status */}
        <div>
          <label
            htmlFor="participant-status"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            4. Status
          </label>
          <select
            id="participant-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ParticipantStatus)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Selecting <strong className="text-emerald-700">Confirmed</strong> records the current date as confirmation date. Changing away from Confirmed clears it.
          </p>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={!partnerAgencyId || !cboId}
          >
            {participant ? 'Save Changes' : 'Enroll Participant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

