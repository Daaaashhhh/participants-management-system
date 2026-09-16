'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createAttendanceRecord, updateAttendanceRecord } from '@/app/actions/attendance';
import { AttendanceRecord } from '@/types/database';
import { Clock } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: AttendanceRecord | null;
  eventDate: string;
}

export function AttendanceModal({
  isOpen,
  onClose,
  record,
  eventDate,
}: AttendanceModalProps) {
  const [name, setName] = React.useState('');
  const [officeAgency, setOfficeAgency] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [sex, setSex] = React.useState<'M' | 'F' | ''>('');
  const [email, setEmail] = React.useState('');
  const [contactNo, setContactNo] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [amIn, setAmIn] = React.useState('');
  const [amOut, setAmOut] = React.useState('');
  const [pmIn, setPmIn] = React.useState('');
  const [pmOut, setPmOut] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    if (record) {
      setName(record.name || '');
      setOfficeAgency(record.office_agency || '');
      setPosition(record.position || '');
      setSex(record.sex || '');
      setEmail(record.email || '');
      setContactNo(record.contact_no || '');
      setRemarks(record.remarks || '');
      setAmIn(record.am_in || '');
      setAmOut(record.am_out || '');
      setPmIn(record.pm_in || '');
      setPmOut(record.pm_out || '');
    } else {
      setName('');
      setOfficeAgency('');
      setPosition('');
      setSex('');
      setEmail('');
      setContactNo('');
      setRemarks('');
      setAmIn('');
      setAmOut('');
      setPmIn('');
      setPmOut('');
    }
    setError('');
  }, [record, isOpen]);

  const getCurrentTimeStr = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Attendee name is required.');
      return;
    }
    if (!officeAgency.trim()) {
      setError('Office/Service/Division/Unit is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('office_agency', officeAgency.trim());
    formData.append('position', position.trim());
    formData.append('sex', sex);
    formData.append('email', email.trim());
    formData.append('contact_no', contactNo.trim());
    formData.append('remarks', remarks.trim());
    formData.append('am_in', amIn.trim());
    formData.append('am_out', amOut.trim());
    formData.append('pm_in', pmIn.trim());
    formData.append('pm_out', pmOut.trim());
    formData.append('event_date', eventDate);

    try {
      if (record) {
        const res = await updateAttendanceRecord(record.id, formData);
        if (!res.success) {
          setError(res.error || 'Failed to update attendee record.');
        } else {
          success(`Attendee "${name.trim()}" updated successfully.`);
          onClose();
        }
      } else {
        const res = await createAttendanceRecord(formData);
        if (!res.success) {
          setError(res.error || 'Failed to create attendee record.');
        } else {
          success(`Attendee "${name.trim()}" added to Attendance Sheet.`);
          onClose();
        }
      }
    } catch {
      toastError('An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={record ? 'Edit Attendee Information' : 'Add Attendee (Walk-In)'}
      description="Record attendee identity, office assignment, contact details, and session timestamps."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Name & Office/Service/Division/Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Attendee Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Office / Division / Unit <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DSWD FO-III / CBO1"
              value={officeAgency}
              onChange={(e) => setOfficeAgency(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Position & Sex */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Position / Designation
            </label>
            <input
              type="text"
              placeholder="e.g. Community Organizer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sex (M/F)
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as 'M' | 'F' | '')}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">Not Specified</option>
              <option value="M">M (Male)</option>
              <option value="F">F (Female)</option>
            </select>
          </div>
        </div>

        {/* Email & Contact No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. maria.santos@agency.gov.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Number
            </label>
            <input
              type="text"
              placeholder="e.g. 0917-123-4567"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Time Tracking (AM IN, AM OUT, PM IN, PM OUT) */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Attendance Timestamps</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* AM IN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-600">AM IN</span>
                <button
                  type="button"
                  onClick={() => setAmIn(getCurrentTimeStr())}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  Now
                </button>
              </div>
              <input
                type="text"
                placeholder="--:-- --"
                value={amIn}
                onChange={(e) => setAmIn(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* AM OUT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-600">AM OUT</span>
                <button
                  type="button"
                  onClick={() => setAmOut(getCurrentTimeStr())}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  Now
                </button>
              </div>
              <input
                type="text"
                placeholder="--:-- --"
                value={amOut}
                onChange={(e) => setAmOut(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* PM IN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-600">PM IN</span>
                <button
                  type="button"
                  onClick={() => setPmIn(getCurrentTimeStr())}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  Now
                </button>
              </div>
              <input
                type="text"
                placeholder="--:-- --"
                value={pmIn}
                onChange={(e) => setPmIn(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* PM OUT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-600">PM OUT</span>
                <button
                  type="button"
                  onClick={() => setPmOut(getCurrentTimeStr())}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  Now
                </button>
              </div>
              <input
                type="text"
                placeholder="--:-- --"
                value={pmOut}
                onChange={(e) => setPmOut(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Remarks / Other Information
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Dietary requirement, late arrival, proxy attendee notes..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? 'Saving...' : record ? 'Save Changes' : 'Add Attendee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

