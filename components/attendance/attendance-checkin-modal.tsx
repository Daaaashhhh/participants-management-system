'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { markParticipantPresent } from '@/app/actions/attendance';
import { ParticipantWithRelations } from '@/types/database';
import { Search, UserCheck, CheckCircle2, Building2 } from 'lucide-react';

interface AttendanceCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: ParticipantWithRelations[];
  presentParticipantIds: string[];
  eventDate: string;
}

export function AttendanceCheckinModal({
  isOpen,
  onClose,
  participants,
  presentParticipantIds,
  eventDate,
}: AttendanceCheckinModalProps) {
  const [search, setSearch] = React.useState('');
  const [checkingInId, setCheckingInId] = React.useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const presentSet = React.useMemo(
    () => new Set(presentParticipantIds),
    [presentParticipantIds]
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.partner_agency?.name.toLowerCase().includes(q) ||
        p.cbo?.name.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const handleCheckin = async (p: ParticipantWithRelations) => {
    setCheckingInId(p.id);
    try {
      const res = await markParticipantPresent(p.id, eventDate);
      if (!res.success) {
        toastError(res.error || 'Failed to check in participant.');
      } else {
        success(`"${p.name}" has been marked present on the Attendance Sheet!`);
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Check In Registered Participant"
      description="Select any registered participant to automatically add them to today's Attendance Sheet with AM IN time."
    >
      <div className="space-y-4 pt-1">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by participant name, agency, or CBO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Participant List */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/30">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching registered participants found.
            </div>
          ) : (
            filtered.map((p) => {
              const isPresent = presentSet.has(p.id);
              return (
                <div
                  key={p.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {p.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          p.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      <span>
                        {p.partner_agency?.name} &bull; {p.cbo?.name}
                      </span>
                    </div>
                  </div>

                  {isPresent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Present</span>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCheckin(p)}
                      disabled={checkingInId === p.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 flex-shrink-0"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      {checkingInId === p.id ? 'Logging...' : 'Mark Present'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

