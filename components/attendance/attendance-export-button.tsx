'use client';

import * as React from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAttendanceToExcel, exportAttendanceToCsv } from '@/lib/export/excel';
import { AttendanceRecord } from '@/types/database';
import { useToast } from '@/components/ui/toast';

interface AttendanceExportButtonProps {
  records: AttendanceRecord[];
  eventDate: string;
}

export function AttendanceExportButton({ records, eventDate }: AttendanceExportButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { success, error } = useToast();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = async () => {
    try {
      if (records.length === 0) {
        error('No attendance records to export for this date.');
        return;
      }
      await exportAttendanceToExcel(records, eventDate);
      success(`Exported ${records.length} attendee records to Excel (.xlsx).`);
      setIsOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to generate Excel attendance sheet.');
    }
  };

  const handleExportCsv = () => {
    try {
      if (records.length === 0) {
        error('No attendance records to export for this date.');
        return;
      }
      exportAttendanceToCsv(records, eventDate);
      success(`Exported ${records.length} attendee records to CSV.`);
      setIsOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to generate CSV attendance sheet.');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex-shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs font-medium text-xs h-9"
      >
        <Download className="h-4 w-4 mr-1.5 text-emerald-600" />
        <span>Export Sheet</span>
        <ChevronDown className={`h-3.5 w-3.5 ml-1 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-2 focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Download Attendance
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Official 12-column event attendance report
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            <button
              onClick={handleExportExcel}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-start gap-2.5 transition-colors group"
            >
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md group-hover:bg-emerald-200 transition-colors mt-0.5">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 group-hover:text-emerald-900 flex items-center justify-between">
                  <span>Excel Sheet (.xlsx)</span>
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-normal">
                    {records.length} records
                  </span>
                </div>
                <p className="text-xs text-slate-500 group-hover:text-emerald-700 mt-0.5">
                  Formatted for printing &amp; official submission
                </p>
              </div>
            </button>

            <button
              onClick={handleExportCsv}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group"
            >
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md group-hover:bg-slate-200 transition-colors">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-700">CSV Spreadsheet (.csv)</span>
                <p className="text-xs text-slate-400">Raw tabular format</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

