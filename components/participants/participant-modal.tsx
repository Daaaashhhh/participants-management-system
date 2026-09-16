'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createParticipant, updateParticipant, createBatchParticipants } from '@/app/actions/participants';
import {
  CBOWithAgency,
  PartnerAgency,
  ParticipantStatus,
  ParticipantWithRelations,
} from '@/types/database';
import { Plus, Trash2, Users, FileText, CheckCircle2 } from 'lucide-react';

interface ParticipantRow {
  id: string;
  name: string;
  status: ParticipantStatus;
}

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant?: ParticipantWithRelations | null;
  agencies: PartnerAgency[];
  cbos: CBOWithAgency[];
  initialAgencyId?: string;
  initialCboId?: string;
}

export function ParticipantModal({
  isOpen,
  onClose,
  participant,
  agencies,
  cbos,
  initialAgencyId,
  initialCboId,
}: ParticipantModalProps) {
  const [partnerAgencyId, setPartnerAgencyId] = React.useState('');
  const [cboId, setCboId] = React.useState('');

  // Single edit mode state
  const [singleName, setSingleName] = React.useState('');
  const [singleStatus, setSingleStatus] = React.useState<ParticipantStatus>('Pending');

  // Multi-participant mode state
  const [entryMode, setEntryMode] = React.useState<'rows' | 'bulk'>('rows');
  const [rows, setRows] = React.useState<ParticipantRow[]>([
    { id: '1', name: '', status: 'Pending' },
  ]);
  const [bulkText, setBulkText] = React.useState('');
  const [bulkStatus, setBulkStatus] = React.useState<ParticipantStatus>('Pending');

  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { success, error: toastError } = useToast();

  const nameInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Filter CBOs dynamically based on selected Partner Agency (Dependent Dropdown)
  const availableCbos = React.useMemo(() => {
    if (!partnerAgencyId) return [];
    return cbos.filter((c) => c.partner_agency_id === partnerAgencyId);
  }, [cbos, partnerAgencyId]);

  React.useEffect(() => {
    if (participant) {
      setPartnerAgencyId(participant.partner_agency_id);
      setCboId(participant.cbo_id);
      setSingleName(participant.name);
      setSingleStatus(participant.status);
    } else {
      const selectedAgency = initialAgencyId || agencies[0]?.id || '';
      setPartnerAgencyId(selectedAgency);

      if (initialCboId) {
        setCboId(initialCboId);
      } else {
        const firstCbo = cbos.find((c) => c.partner_agency_id === selectedAgency);
        setCboId(firstCbo?.id || '');
      }

      setSingleName('');
      setSingleStatus('Pending');
      setRows([
        { id: '1', name: '', status: 'Pending' },
      ]);
      setBulkText('');
      setBulkStatus('Pending');
      setEntryMode('rows');
    }
    setError('');
  }, [participant, agencies, cbos, isOpen, initialAgencyId, initialCboId]);

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

  // Add new participant row in list mode
  const handleAddRow = () => {
    const newId = String(Date.now());
    setRows((prev) => [...prev, { id: newId, name: '', status: 'Pending' }]);
    setTimeout(() => {
      const nextIndex = rows.length;
      nameInputRefs.current[nextIndex]?.focus();
    }, 50);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowNameChange = (id: string, newName: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
    );
  };

  const handleRowStatusChange = (id: string, newStatus: ParticipantStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  // Calculate parsed participants from bulk text
  const parsedBulkNames = React.useMemo(() => {
    return bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 2);
  }, [bulkText]);

  // Calculate total valid participants to add
  const validParticipantCount = React.useMemo(() => {
    if (participant) return 1;
    if (entryMode === 'rows') {
      return rows.filter((r) => r.name.trim().length >= 2).length;
    }
    return parsedBulkNames.length;
  }, [participant, entryMode, rows, parsedBulkNames]);

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

    // Selected CBO name for success notification
    const cboName = cbos.find((c) => c.id === cboId)?.name || 'CBO';

    setIsLoading(true);

    try {
      if (participant) {
        // Single Edit Mode
        if (singleName.trim().length < 2) {
          setError('Participant name must be at least 2 characters.');
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('partner_agency_id', partnerAgencyId);
        formData.append('cbo_id', cboId);
        formData.append('name', singleName.trim());
        formData.append('status', singleStatus);

        const res = await updateParticipant(participant.id, formData);
        if (!res.success) {
          setError(res.error || 'Failed to update participant');
          toastError(res.error || 'Failed to update participant');
        } else {
          success(`Participant "${singleName}" updated successfully.`);
          onClose();
        }
      } else {
        // Multi-Participant Batch Enrollment
        let participantsToCreate: { name: string; status: ParticipantStatus }[] = [];

        if (entryMode === 'rows') {
          participantsToCreate = rows
            .map((r) => ({ name: r.name.trim(), status: r.status }))
            .filter((r) => r.name.length >= 2);

          if (participantsToCreate.length === 0) {
            setError('Please enter at least one participant name (minimum 2 characters).');
            setIsLoading(false);
            return;
          }
        } else {
          // Bulk text mode
          if (parsedBulkNames.length === 0) {
            setError('Please paste or type at least one valid name (minimum 2 characters).');
            setIsLoading(false);
            return;
          }

          participantsToCreate = parsedBulkNames.map((name) => ({
            name,
            status: bulkStatus,
          }));
        }

        const res = await createBatchParticipants({
          partner_agency_id: partnerAgencyId,
          cbo_id: cboId,
          participants: participantsToCreate,
        });

        if (!res.success) {
          setError(res.error || 'Failed to enroll participants');
          toastError(res.error || 'Failed to enroll participants');
        } else {
          const count = res.count ?? participantsToCreate.length;
          success(
            `Successfully enrolled ${count} participant${count > 1 ? 's' : ''} under "${cboName}".`
          );
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
      title={participant ? 'Edit Participant' : 'Enroll Participants'}
      description={
        participant
          ? 'Update participant details under the selected Agency and CBO.'
          : 'Select the Partner Agency and CBO, then add one or multiple participants in a single action.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1 & 2: Agency & CBO Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          {/* Step 1: Partner Agency Dropdown */}
          <div>
            <label
              htmlFor="participant-agency"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              1. Partner Agency <span className="text-rose-500">*</span>
            </label>
            <select
              id="participant-agency"
              value={partnerAgencyId}
              onChange={(e) => handleAgencyChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-2xs"
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
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              2. CBO (Target Group) <span className="text-rose-500">*</span>
            </label>
            <select
              id="participant-cbo"
              value={cboId}
              onChange={(e) => setCboId(e.target.value)}
              disabled={!partnerAgencyId || availableCbos.length === 0}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
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
          </div>

          {partnerAgencyId && availableCbos.length === 0 && (
            <div className="col-span-1 sm:col-span-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              No CBOs found for this agency. Please create a CBO under this agency first before adding participants.
            </div>
          )}
        </div>

        {/* SINGLE EDIT MODE */}
        {participant ? (
          <div className="space-y-3.5 pt-1">
            <div>
              <label
                htmlFor="participant-name"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Participant Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="participant-name"
                type="text"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="participant-status"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="participant-status"
                value={singleStatus}
                onChange={(e) => setSingleStatus(e.target.value as ParticipantStatus)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ) : (
          /* MULTI-PARTICIPANT ENROLLMENT MODE */
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>3. Participants to Enroll</span>
                {validParticipantCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {validParticipantCount} ready
                  </span>
                )}
              </label>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEntryMode('rows')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    entryMode === 'rows'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Row by Row
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('bulk')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    entryMode === 'bulk'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Multiple Names
                </button>
              </div>
            </div>

            {/* TAB 1: ROW-BY-ROW PARTICIPANTS LIST */}
            {entryMode === 'rows' ? (
              <div className="space-y-2">
                <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                  {rows.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/90 focus-within:border-indigo-400 focus-within:bg-indigo-50/20 transition-all"
                    >
                      <span className="w-6 text-center text-xs font-mono font-bold text-slate-400 select-none">
                        #{index + 1}
                      </span>

                      {/* Participant Full Name */}
                      <input
                        ref={(el) => {
                          nameInputRefs.current[index] = el;
                        }}
                        type="text"
                        value={row.name}
                        onChange={(e) => handleRowNameChange(row.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (index === rows.length - 1 && row.name.trim().length >= 2) {
                              handleAddRow();
                            }
                          }
                        }}
                        placeholder={`Participant ${index + 1} Full Name (e.g. Juan Dela Cruz)`}
                        className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />

                      {/* Status Selector for this Participant */}
                      <select
                        value={row.status}
                        onChange={(e) =>
                          handleRowStatusChange(row.id, e.target.value as ParticipantStatus)
                        }
                        className={`text-xs font-semibold px-2 py-1.5 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          row.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : row.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {/* Delete Row Button */}
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove participant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Add Another Participant</span>
                  </Button>
                  <span className="text-[11px] text-slate-400 italic">
                    Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Enter</kbd> to quickly add next row
                  </span>
                </div>
              </div>
            ) : (
              /* TAB 2: BULK TEXT AREA PASTE MODE */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Paste or type multiple names (one name per line):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 font-medium">Status for all:</span>
                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value as ParticipantStatus)}
                      className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Juan Dela Cruz\nMaria Clara\nJose Rizal\nAndres Bonifacio`}
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Detected: <strong className="text-slate-800 font-bold">{parsedBulkNames.length}</strong> valid name{parsedBulkNames.length === 1 ? '' : 's'}
                  </span>
                  {parsedBulkNames.length > 0 && (
                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready to enroll
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {!participant && validParticipantCount > 0 && (
              <span>
                Adding <strong className="text-indigo-700 font-bold">{validParticipantCount}</strong> participant{validParticipantCount > 1 ? 's' : ''} to selected CBO
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={!partnerAgencyId || !cboId || (!participant && validParticipantCount === 0)}
            >
              {participant
                ? 'Save Changes'
                : validParticipantCount > 1
                ? `Enroll ${validParticipantCount} Participants`
                : 'Enroll Participant'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
