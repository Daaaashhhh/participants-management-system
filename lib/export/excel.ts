import * as XLSX from 'xlsx';
import { ParticipantWithRelations, PartnerAgency, CBOWithAgency } from '@/types/database';
import { formatDate } from '@/lib/utils';

export interface ExportOptions {
  fileNamePrefix?: string;
  isFiltered?: boolean;
}

/**
 * Generates and downloads a multi-sheet Excel (.xlsx) file containing:
 * - Sheet 1: Final Tally (aggregated counts by Agency and CBO, with grand totals)
 * - Sheet 2: Participant Directory (complete itemized list with details)
 */
export function exportFinalTallyToExcel(
  participants: ParticipantWithRelations[],
  agencies: PartnerAgency[],
  cbos: CBOWithAgency[],
  options: ExportOptions = {}
) {
  const { fileNamePrefix = 'participants_final_tally', isFiltered = false } = options;

  // -------------------------------------------------------------
  // Sheet 1: Final Tally Aggregation
  // -------------------------------------------------------------
  interface TallyRow {
    'Partner Agency': string;
    'CBO Name': string;
    'Confirmed': number;
    'Pending': number;
    'Cancelled': number;
    'Total Participants': number;
  }

  const tallyRows: TallyRow[] = [];

  // Group participants by agency_id + cbo_id
  let grandConfirmed = 0;
  let grandPending = 0;
  let grandCancelled = 0;
  let grandTotal = 0;

  // Sort agencies by name
  const sortedAgencies = [...agencies].sort((a, b) => a.name.localeCompare(b.name));

  for (const agency of sortedAgencies) {
    // CBOs under this agency
    const agencyCbos = cbos
      .filter((c) => c.partner_agency_id === agency.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const cbo of agencyCbos) {
      const matchingParticipants = participants.filter(
        (p) => p.partner_agency_id === agency.id && p.cbo_id === cbo.id
      );

      // If filtered export, only include rows with at least 1 participant
      if (isFiltered && matchingParticipants.length === 0) {
        continue;
      }

      const confirmed = matchingParticipants.filter((p) => p.status === 'Confirmed').length;
      const pending = matchingParticipants.filter((p) => p.status === 'Pending').length;
      const cancelled = matchingParticipants.filter((p) => p.status === 'Cancelled').length;
      const total = matchingParticipants.length;

      grandConfirmed += confirmed;
      grandPending += pending;
      grandCancelled += cancelled;
      grandTotal += total;

      tallyRows.push({
        'Partner Agency': agency.name,
        'CBO Name': cbo.name,
        'Confirmed': confirmed,
        'Pending': pending,
        'Cancelled': cancelled,
        'Total Participants': total,
      });
    }
  }

  // Add Grand Total row at the bottom
  tallyRows.push({
    'Partner Agency': 'GRAND TOTAL',
    'CBO Name': '',
    'Confirmed': grandConfirmed,
    'Pending': grandPending,
    'Cancelled': grandCancelled,
    'Total Participants': grandTotal,
  });

  const tallyWorksheet = XLSX.utils.json_to_sheet(tallyRows);

  // Set column widths for Sheet 1
  tallyWorksheet['!cols'] = [
    { wch: 25 }, // Partner Agency
    { wch: 25 }, // CBO Name
    { wch: 14 }, // Confirmed
    { wch: 14 }, // Pending
    { wch: 14 }, // Cancelled
    { wch: 20 }, // Total Participants
  ];

  // -------------------------------------------------------------
  // Sheet 2: Participant Directory (Detailed List)
  // -------------------------------------------------------------
  const detailRows = participants.map((p, index) => ({
    '#': index + 1,
    'Participant Name': p.name,
    'Partner Agency': p.partner_agency?.name || 'Unassigned',
    'CBO': p.cbo?.name || 'Unassigned',
    'Status': p.status,
    'Date Confirmed': p.date_confirmed ? formatDate(p.date_confirmed) : '—',
    'Date Registered': formatDate(p.created_at),
  }));

  const directoryWorksheet = XLSX.utils.json_to_sheet(detailRows);

  // Set column widths for Sheet 2
  directoryWorksheet['!cols'] = [
    { wch: 6 },  // #
    { wch: 28 }, // Participant Name
    { wch: 24 }, // Partner Agency
    { wch: 24 }, // CBO
    { wch: 14 }, // Status
    { wch: 22 }, // Date Confirmed
    { wch: 22 }, // Date Registered
  ];

  // -------------------------------------------------------------
  // Assemble Workbook and Trigger Browser Download
  // -------------------------------------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, tallyWorksheet, 'Final Tally');
  XLSX.utils.book_append_sheet(workbook, directoryWorksheet, 'Participant Directory');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

/**
 * Generates and downloads a CSV file of the participant list.
 */
export function exportParticipantsToCsv(
  participants: ParticipantWithRelations[],
  fileNamePrefix: string = 'participants_list'
) {
  const headers = [
    '#',
    'Participant Name',
    'Partner Agency',
    'CBO',
    'Status',
    'Date Confirmed',
    'Date Registered',
  ];

  const rows = participants.map((p, index) => [
    index + 1,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${(p.partner_agency?.name || 'Unassigned').replace(/"/g, '""')}"`,
    `"${(p.cbo?.name || 'Unassigned').replace(/"/g, '""')}"`,
    p.status,
    p.date_confirmed ? `"${formatDate(p.date_confirmed)}"` : '""',
    `"${formatDate(p.created_at)}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);

  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

