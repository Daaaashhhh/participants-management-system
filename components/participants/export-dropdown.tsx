'use client';

import * as React from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportFinalTallyToExcel, exportParticipantsToCsv } from '@/lib/export/excel';
import { ParticipantWithRelations, PartnerAgency, CBOWithAgency } from '@/types/database';
import { useToast } from '@/components/ui/toast';

interface ExportDropdownProps {
  allParticipants: ParticipantWithRelations[];
  filteredParticipants: ParticipantWithRelations[];
  agencies: PartnerAgency[];
  cbos: CBOWithAgency[];
  hasActiveFilters: boolean;
}

export function ExportDropdown({
  allParticipants,
  filteredParticipants,
  agencies,
  cbos,
  hasActiveFilters,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { success, error } = useToast();

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = (useFiltered: boolean) => {
    try {
      const dataToExport = useFiltered ? filteredParticipants : allParticipants;
      if (dataToExport.length === 0) {
        error('No participants available to export.');
        return;
      }

      exportFinalTallyToExcel(dataToExport, agencies, cbos, {
        fileNamePrefix: useFiltered ? 'participants_filtered_tally' : 'participants_final_tally',
        isFiltered: useFiltered,
      });

      success(`Exported ${dataToExport.length} participant records to Excel.`);
      setIsOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to generate Excel file.');
    }
  };

  const handleExportCsv = (useFiltered: boolean) => {
    try {
      const dataToExport = useFiltered ? filteredParticipants : allParticipants;
      if (dataToExport.length === 0) {
        error('No participants available to export.');
        return;
      }

      exportParticipantsToCsv(
        dataToExport,
        useFiltered ? 'participants_filtered' : 'participants_full_directory'
      );

      success(`Exported ${dataToExport.length} participant records to CSV.`);
      setIsOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to generate CSV file.');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex-shrink-0 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs font-medium"
      >
        <Download className="h-4 w-4 mr-1.5 text-emerald-600" />
        <span>Export Tally</span>
        <ChevronDown className={`h-3.5 w-3.5 ml-1 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-2 focus:outline-none animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Download Reports
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-sheet Excel workbook with final tallies &amp; directory
            </p>
          </div>

          <div className="p-1 space-y-0.5">
            {/* Primary Action: Complete Excel Final Tally */}
            <button
              onClick={() => handleExportExcel(false)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-start gap-2.5 transition-colors group"
            >
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md group-hover:bg-emerald-200 transition-colors mt-0.5">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 group-hover:text-emerald-900 flex items-center justify-between">
                  <span>Excel Workbook (.xlsx)</span>
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-normal">
                    {allParticipants.length} total
                  </span>
                </div>
                <p className="text-xs text-slate-500 group-hover:text-emerald-700 mt-0.5">
                  Includes Summary Tally &amp; Full Directory
                </p>
              </div>
            </button>

            {/* Filtered Excel Option (if filters are active) */}
            {hasActiveFilters && (
              <button
                onClick={() => handleExportExcel(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-start gap-2.5 transition-colors group"
              >
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md group-hover:bg-indigo-100 transition-colors mt-0.5">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 flex items-center justify-between">
                    <span>Export Filtered (.xlsx)</span>
                    <span className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                      {filteredParticipants.length} filtered
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Exports only currently matching results
                  </p>
                </div>
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            {/* CSV Option */}
            <button
              onClick={() => handleExportCsv(false)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group"
            >
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md group-hover:bg-slate-200 transition-colors">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-700">Raw CSV File (.csv)</span>
                <p className="text-xs text-slate-400">Simple flat table for data analysis</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

