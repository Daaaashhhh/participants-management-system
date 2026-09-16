import { getAttendanceRecords } from '@/app/actions/attendance';
import { getParticipants } from '@/app/actions/participants';
import { AttendanceTable } from '@/components/attendance/attendance-table';

export const dynamic = 'force-dynamic';

interface AttendancePageProps {
  searchParams?: {
    date?: string;
  };
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const selectedDate = searchParams?.date || todayStr;

  const [records, participants] = await Promise.all([
    getAttendanceRecords(selectedDate),
    getParticipants(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Event Attendance Sheet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor attendee check-ins, record session timestamps (AM/PM IN and OUT), and export official attendance reports.
        </p>
      </div>

      <AttendanceTable
        initialRecords={records}
        participants={participants}
        currentDate={selectedDate}
      />
    </div>
  );
}

