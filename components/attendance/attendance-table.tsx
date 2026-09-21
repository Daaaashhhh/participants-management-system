'use client';

import * as React from 'react';
import { AttendanceRecord, ParticipantWithRelations } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AttendanceModal } from './attendance-modal';
import { AttendanceCheckinModal } from './attendance-checkin-modal';
import { AttendanceExportButton } from './attendance-export-button';
import { deleteAttendanceRecord, updateAttendanceField } from '@/app/actions/attendance';
import { useToast } from '@/components/ui/toast';
import {
  Search,
  Plus,
  UserCheck,
  Calendar,
  Pencil,
  Trash2,
  Users,
  Check,
  UserPlus,
} from 'lucide-react';

interface AttendanceTableProps {
  initialRecords: AttendanceRecord[];
  participants: ParticipantWithRelations[];
  currentDate: string;
}

export function AttendanceTable({
  initialRecords,
  participants,
  currentDate,
}: AttendanceTableProps) {
  const [records, setRecords] = React.useState<AttendanceRecord[]>(initialRecords);
  const [selectedDate, setSelectedDate] = React.useState<string>(currentDate);
  const [search, setSearch] = React.useState('');

  const [selectedRecord, setSelectedRecord] = React.useState<AttendanceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = React.useState(false);
  const [recordToDelete, setRecordToDelete] = React.useState<AttendanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [savingCell, setSavingCell] = React.useState<string | null>(null);
  const [savedCell, setSavedCell] = React.useState<string | null>(null);

  const { success, error } = useToast();

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  // Filter records by search query
  const filteredRecords = React.useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.office_agency.toLowerCase().includes(q) ||
        (r.position && r.position.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q))
    );
  }, [records, search]);

  // Metrics summary
  const totalAttendees = records.length;
  const preRegCount = records.filter((r) => Boolean(r.participant_id)).length;
  const walkInCount = records.filter((r) => !r.participant_id).length;

  const presentParticipantIds = React.useMemo(() => {
    return records
      .map((r) => r.participant_id)
      .filter((id): id is string => Boolean(id));
  }, [records]);

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteAttendanceRecord(recordToDelete.id);
      if (!res.success) {
        error(res.error || 'Failed to delete record.');
      } else {
        setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
        success(`Removed "${recordToDelete.name}" from attendance.`);
        setRecordToDelete(null);
      }
    } catch {
      error('An error occurred deleting record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Inline edit blur handler for text columns
  const handleFieldBlur = async (
    id: string,
    field: 'position' | 'email' | 'contact_no' | 'remarks',
    currentValue: string | null,
    newValue: string
  ) => {
    const trimmed = newValue.trim();
    const prevTrimmed = (currentValue || '').trim();
    if (trimmed === prevTrimmed) return;

    const cellKey = `${id}-${field}`;
    setSavingCell(cellKey);

    // Optimistic update
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: trimmed || null } : r))
    );

    try {
      const res = await updateAttendanceField(id, field, trimmed || null);
      if (!res.success) {
        error(res.error || `Failed to update ${field}`);
        // Revert on failure
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, [field]: currentValue } : r))
        );
      } else {
        setSavedCell(cellKey);
        setTimeout(() => {
          setSavedCell((current) => (current === cellKey ? null : current));
        }, 1500);
      }
    } catch {
      error(`Error saving ${field}`);
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: currentValue } : r))
      );
    } finally {
      setSavingCell(null);
    }
  };

  // Inline edit change handler for Sex dropdown
  const handleSexChange = async (
    id: string,
    currentSex: 'M' | 'F' | null,
    newSex: string
  ) => {
    const validSex = newSex === 'M' || newSex === 'F' ? newSex : null;
    if (validSex === currentSex) return;

    const cellKey = `${id}-sex`;
    setSavingCell(cellKey);

    // Optimistic update
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sex: validSex } : r))
    );

    try {
      const res = await updateAttendanceField(id, 'sex', validSex);
      if (!res.success) {
        error(res.error || 'Failed to update sex');
        // Revert
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, sex: currentSex } : r))
        );
      } else {
        setSavedCell(cellKey);
        setTimeout(() => {
          setSavedCell((current) => (current === cellKey ? null : current));
        }, 1500);
      }
    } catch {
      error('Error saving sex');
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, sex: currentSex } : r))
      );
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Attendees
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalAttendees}</p>
          <span className="text-[11px] text-slate-400">Recorded for this event</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/30 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Pre-Registered
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{preRegCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">From participant registry</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/30 to-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Walk-Ins
            </span>
            <UserPlus className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{walkInCount}</p>
          <span className="text-[11px] text-indigo-700 font-medium">On-site registrants</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Event Date
            </span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-2 font-mono">{selectedDate}</p>
          <span className="text-[11px] text-slate-400">Attendance session</span>
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Date Selector & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold flex-shrink-0">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  window.location.href = `/attendance?date=${e.target.value}`;
                }}
                className="bg-transparent border-0 font-bold text-slate-900 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search attendees by name, office, or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <AttendanceExportButton records={filteredRecords} eventDate={selectedDate} />

            <Button
              variant="outline"
              onClick={() => setIsCheckinModalOpen(true)}
              className="text-xs h-9 bg-emerald-50/70 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            >
              <UserCheck className="h-4 w-4 mr-1.5 text-emerald-600" />
              <span>Check In Participant</span>
            </Button>

            <Button
              onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
              }}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Walk-In</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Editable Hint */}
      <div className="flex items-center justify-between px-4 py-2 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">✏️</span>
          <span>
            <strong>Inline Editing:</strong> Click or type directly into any attendee&apos;s <strong>Position</strong>, <strong>Sex (M/F)</strong>, <strong>Email</strong>, <strong>Contact No.</strong>, or <strong>Remarks</strong>. AM/PM times and signatures are left blank for handwriting.
          </span>
        </div>
      </div>

      {/* Main Attendance Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <tr>
                <th scope="col" className="px-3 py-3 w-12 text-center border-r border-slate-200">
                  NO.
                </th>
                <th scope="col" className="px-4 py-3 min-w-[160px] border-r border-slate-200">
                  NAME
                </th>
                <th scope="col" className="px-4 py-3 min-w-[170px] border-r border-slate-200">
                  OFFICE / DIVISION / UNIT
                </th>
                <th scope="col" className="px-3 py-3 min-w-[130px] border-r border-slate-200">
                  <div className="flex items-center gap-1">
                    <span>POSITION</span>
                    <span className="text-[9px] text-emerald-600 font-normal lowercase tracking-normal">✏️</span>
                  </div>
                </th>
                <th scope="col" className="px-2 py-3 w-20 text-center border-r border-slate-200">
                  SEX
                </th>
                <th scope="col" className="px-3 py-3 min-w-[160px] border-r border-slate-200">
                  <div className="flex items-center gap-1">
                    <span>EMAIL</span>
                    <span className="text-[9px] text-emerald-600 font-normal lowercase tracking-normal">✏️</span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-3 min-w-[130px] border-r border-slate-200">
                  <div className="flex items-center gap-1">
                    <span>CONTACT NO.</span>
                    <span className="text-[9px] text-emerald-600 font-normal lowercase tracking-normal">✏️</span>
                  </div>
                </th>

                {/* AM Session Group */}
                <th
                  scope="col"
                  className="px-2 py-3 min-w-[90px] text-center bg-emerald-50/50 border-r border-slate-200 text-emerald-800"
                >
                  AM IN
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 min-w-[90px] text-center bg-emerald-50/50 border-r border-slate-200 text-emerald-800"
                >
                  AM OUT
                </th>

                {/* PM Session Group */}
                <th
                  scope="col"
                  className="px-2 py-3 min-w-[90px] text-center bg-indigo-50/50 border-r border-slate-200 text-indigo-800"
                >
                  PM IN
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 min-w-[90px] text-center bg-indigo-50/50 border-r border-slate-200 text-indigo-800"
                >
                  PM OUT
                </th>

                {/* SIGNATURE */}
                <th
                  scope="col"
                  className="px-3 py-3 min-w-[120px] text-center border-r border-slate-200 text-slate-700 bg-slate-50/70"
                >
                  SIGNATURE
                </th>

                <th scope="col" className="px-4 py-3 min-w-[160px] border-r border-slate-200">
                  REMARKS / INFO
                </th>
                <th scope="col" className="px-3 py-3 w-20 text-center">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-9 w-9 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">
                        No attendance records for {selectedDate}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Click &ldquo;Check In Participant&rdquo; to pull from your registered list, or &ldquo;Add Walk-In&rdquo; to register new attendees.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* NO. */}
                    <td className="px-3 py-3.5 text-center text-xs text-slate-400 font-mono border-r border-slate-100">
                      {index + 1}
                    </td>

                    {/* NAME */}
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-900 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{r.name}</span>
                        {r.participant_id && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal"
                            title="Linked to registered participant"
                          >
                            Pre-reg
                          </span>
                        )}
                      </div>
                    </td>

                    {/* OFFICE/SERVICE/DIVISION/UNIT */}
                    <td className="px-4 py-3.5 text-xs text-slate-700 border-r border-slate-100">
                      {r.office_agency}
                    </td>

                    {/* POSITION (Inline Editable) */}
                    <td className="px-2 py-2 border-r border-slate-100 relative group/pos">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          defaultValue={r.position || ''}
                          key={`${r.id}-pos-${r.position || ''}`}
                          placeholder="Add position..."
                          onBlur={(e) =>
                            handleFieldBlur(r.id, 'position', r.position, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          className="w-full px-2 py-1 text-xs text-slate-800 bg-transparent rounded hover:bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                          title="Click to edit position (auto-saves on blur/Enter)"
                        />
                        {savingCell === `${r.id}-position` && (
                          <span className="absolute right-1 text-[10px] text-emerald-600 font-semibold animate-pulse bg-white/90 px-1 rounded shadow-2xs">
                            Saving...
                          </span>
                        )}
                        {savedCell === `${r.id}-position` && (
                          <span className="absolute right-1 text-emerald-600 bg-white/90 px-1 rounded">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SEX (Inline Editable Dropdown) */}
                    <td className="px-1.5 py-2 text-center border-r border-slate-100 relative">
                      <div className="relative inline-flex items-center justify-center">
                        <select
                          value={r.sex || ''}
                          onChange={(e) => handleSexChange(r.id, r.sex, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                            r.sex === 'M'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : r.sex === 'F'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Click to change sex (M/F)"
                        >
                          <option value="">—</option>
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                        {savingCell === `${r.id}-sex` && (
                          <span className="absolute -bottom-3 text-[9px] text-emerald-600 font-bold animate-pulse">
                            ...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* EMAIL (Inline Editable) */}
                    <td className="px-2 py-2 border-r border-slate-100 relative group/email">
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          defaultValue={r.email || ''}
                          key={`${r.id}-email-${r.email || ''}`}
                          placeholder="email@example.com"
                          onBlur={(e) =>
                            handleFieldBlur(r.id, 'email', r.email, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          className="w-full px-2 py-1 text-xs text-slate-800 bg-transparent rounded hover:bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                          title="Click to edit email (auto-saves on blur/Enter)"
                        />
                        {savingCell === `${r.id}-email` && (
                          <span className="absolute right-1 text-[10px] text-emerald-600 font-semibold animate-pulse bg-white/90 px-1 rounded shadow-2xs">
                            Saving...
                          </span>
                        )}
                        {savedCell === `${r.id}-email` && (
                          <span className="absolute right-1 text-emerald-600 bg-white/90 px-1 rounded">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CONTACT NO. (Inline Editable) */}
                    <td className="px-2 py-2 border-r border-slate-100 relative group/contact">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          defaultValue={r.contact_no || ''}
                          key={`${r.id}-contact_no-${r.contact_no || ''}`}
                          placeholder="09xxxxxxxxx"
                          onBlur={(e) =>
                            handleFieldBlur(r.id, 'contact_no', r.contact_no, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          className="w-full px-2 py-1 text-xs font-mono text-slate-800 bg-transparent rounded hover:bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                          title="Click to edit contact number (auto-saves on blur/Enter)"
                        />
                        {savingCell === `${r.id}-contact_no` && (
                          <span className="absolute right-1 text-[10px] text-emerald-600 font-semibold animate-pulse bg-white/90 px-1 rounded shadow-2xs">
                            Saving...
                          </span>
                        )}
                        {savedCell === `${r.id}-contact_no` && (
                          <span className="absolute right-1 text-emerald-600 bg-white/90 px-1 rounded">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* AM IN — blank for handwriting */}
                    <td className="px-1.5 py-3 text-center border-r border-slate-100 bg-emerald-50/20 min-w-[90px]" />

                    {/* AM OUT — blank for handwriting */}
                    <td className="px-1.5 py-3 text-center border-r border-slate-100 bg-emerald-50/20 min-w-[90px]" />

                    {/* PM IN — blank for handwriting */}
                    <td className="px-1.5 py-3 text-center border-r border-slate-100 bg-indigo-50/20 min-w-[90px]" />

                    {/* PM OUT — blank for handwriting */}
                    <td className="px-1.5 py-3 text-center border-r border-slate-100 bg-indigo-50/20 min-w-[90px]" />

                    {/* SIGNATURE — blank for handwriting */}
                    <td className="px-1.5 py-3 text-center border-r border-slate-100 min-w-[120px]" />

                    {/* REMARKS/ OTHER INFORMATION (Inline Editable) */}
                    <td className="px-2 py-2 border-r border-slate-100 relative group/remarks min-w-[150px]">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          defaultValue={r.remarks || ''}
                          key={`${r.id}-rem-${r.remarks || ''}`}
                          placeholder="Add remarks..."
                          onBlur={(e) =>
                            handleFieldBlur(r.id, 'remarks', r.remarks, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          className="w-full px-2 py-1 text-xs text-slate-700 bg-transparent rounded hover:bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                          title="Click to edit remarks (auto-saves on blur/Enter)"
                        />
                        {savingCell === `${r.id}-remarks` && (
                          <span className="absolute right-1 text-[10px] text-emerald-600 font-semibold animate-pulse bg-white/90 px-1 rounded shadow-2xs">
                            Saving...
                          </span>
                        )}
                        {savedCell === `${r.id}-remarks` && (
                          <span className="absolute right-1 text-emerald-600 bg-white/90 px-1 rounded">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3.5 text-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRecord(r);
                          setIsModalOpen(true);
                        }}
                        title="Edit Details"
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRecordToDelete(r)}
                        title="Delete from Attendance"
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        eventDate={selectedDate}
      />

      {/* Check In Registered Participants Modal */}
      <AttendanceCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        participants={participants}
        presentParticipantIds={presentParticipantIds}
        eventDate={selectedDate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Attendee"
        message={`Are you sure you want to remove "${recordToDelete?.name}" from the attendance sheet for ${selectedDate}?`}
        confirmText="Remove Attendee"
        isLoading={isDeleting}
      />
    </div>
  );
}

