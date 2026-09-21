import ExcelJS from 'exceljs';
import {
  ParticipantWithRelations,
  PartnerAgency,
  CBOWithAgency,
  AttendanceRecord,
} from '@/types/database';
import { formatDate } from '@/lib/utils';

export interface ExportOptions {
  fileNamePrefix?: string;
  isFiltered?: boolean;
}

/**
 * Helper to trigger browser download of an ExcelJS workbook
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

/**
 * Generates and downloads an official Event Attendance Sheet in Excel (.xlsx) format
 * with executive-grade typography, distinct session headers, borders, zebra striping,
 * and a dedicated SIGNATURE column.
 */
export async function exportAttendanceToExcel(
  records: AttendanceRecord[],
  eventDate: string = new Date().toISOString().slice(0, 10)
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Participant Management System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Attendance Sheet', {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // 1. Column Definitions & Widths
  worksheet.columns = [
    { key: 'no', width: 7 },
    { key: 'name', width: 28 },
    { key: 'office', width: 34 },
    { key: 'position', width: 22 },
    { key: 'sex', width: 12 },
    { key: 'email', width: 28 },
    { key: 'contact_no', width: 18 },
    { key: 'am_in', width: 14 },
    { key: 'am_out', width: 14 },
    { key: 'pm_in', width: 14 },
    { key: 'pm_out', width: 14 },
    { key: 'signature', width: 22 },
    { key: 'remarks', width: 32 },
  ];

  // 2. Title Banner (Row 1)
  worksheet.mergeCells('A1:M1');
  const titleRow = worksheet.getRow(1);
  titleRow.height = 36;
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'EVENT ATTENDANCE SHEET';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 3. Subheader / Metadata (Row 2)
  worksheet.mergeCells('A2:G2');
  worksheet.mergeCells('H2:M2');
  const metaRow = worksheet.getRow(2);
  metaRow.height = 24;

  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Event Date: ${eventDate}`;
  dateCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } };
  dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  dateCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  const countCell = worksheet.getCell('H2');
  countCell.value = `Total Attendees: ${records.length}`;
  countCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F766E' } };
  countCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  countCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const subBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
  };
  dateCell.border = subBorder;
  countCell.border = subBorder;

  // 4. Spacing Row (Row 3)
  worksheet.getRow(3).height = 10;

  // 5. Column Headers (Row 4)
  const headerTitles = [
    'NO.',
    'NAME',
    'OFFICE/SERVICE/DIVISION/UNIT',
    'POSITION',
    'SEX (M/F)',
    'EMAIL',
    'CONTACT NO.',
    'AM IN',
    'AM OUT',
    'PM IN',
    'PM OUT',
    'SIGNATURE',
    'REMARKS/ OTHER INFORMATION',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.height = 28;
  headerRow.values = headerTitles;

  // Color theme per column category
  // Cols 1-7: Navy #1E3A8A
  // Cols 8-9: Forest Green / Emerald #047857 (AM Session)
  // Cols 10-11: Indigo #4338CA (PM Session)
  // Col 12: Slate #475569 (Signature)
  // Col 13: Dark Slate #334155 (Remarks)
  const getHeaderColor = (colIdx: number) => {
    if (colIdx >= 1 && colIdx <= 7) return 'FF1E3A8A';
    if (colIdx === 8 || colIdx === 9) return 'FF047857';
    if (colIdx === 10 || colIdx === 11) return 'FF4338CA';
    if (colIdx === 12) return 'FF475569';
    return 'FF334155';
  };

  headerTitles.forEach((_, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: getHeaderColor(colNumber) },
    };
    cell.alignment = {
      horizontal: [1, 5, 8, 9, 10, 11, 12].includes(colNumber) ? 'center' : 'left',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  });

  // 6. Data Rows
  records.forEach((r, idx) => {
    const rowNumber = 5 + idx;
    const row = worksheet.getRow(rowNumber);
    row.height = 26; // Generous height for signing

    const isEven = idx % 2 === 0;
    const defaultBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Subtle zebra striping

    const rowValues = [
      idx + 1,
      r.name,
      r.office_agency,
      r.position || '',
      r.sex || '',
      r.email || '',
      r.contact_no || '',
      '', // AM IN left blank for handwriting
      '', // AM OUT left blank for handwriting
      '', // PM IN left blank for handwriting
      '', // PM OUT left blank for handwriting
      '', // SIGNATURE left blank for signing
      r.remarks || '',
    ];

    row.values = rowValues;

    rowValues.forEach((_, cellIdx) => {
      const colNumber = cellIdx + 1;
      const cell = row.getCell(colNumber);

      // Subtle pastel tint for AM and PM time columns
      let cellBg = defaultBg;
      if (colNumber === 8 || colNumber === 9) {
        cellBg = isEven ? 'FFF0FDF4' : 'FFE7FDF0'; // Soft emerald tint
      } else if (colNumber === 10 || colNumber === 11) {
        cellBg = isEven ? 'FFEEF2FF' : 'FFE0E7FF'; // Soft indigo tint
      } else if (colNumber === 12) {
        cellBg = 'FFFFFFFF'; // Clean white for signature
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: cellBg },
      };

      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: colNumber === 2, // Bold participant name
        color: { argb: 'FF1E293B' },
      };

      cell.alignment = {
        horizontal: [1, 5, 8, 9, 10, 11, 12].includes(colNumber) ? 'center' : 'left',
        vertical: 'middle',
        indent: [2, 3, 4, 6, 13].includes(colNumber) ? 1 : 0,
      };

      cell.border = thinBorder;
    });
  });

  // 7. Footer Row
  const footerRowIdx = 5 + records.length;
  worksheet.mergeCells(`A${footerRowIdx}:M${footerRowIdx}`);
  const footerRow = worksheet.getRow(footerRowIdx);
  footerRow.height = 22;
  const footerCell = worksheet.getCell(`A${footerRowIdx}`);
  footerCell.value = `*** END OF ATTENDANCE RECORD — TOTAL PARTICIPANTS: ${records.length} ***`;
  footerCell.font = { name: 'Calibri', size: 9, italic: true, bold: true, color: { argb: 'FF64748B' } };
  footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  footerCell.border = {
    top: { style: 'medium', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  const fileName = `attendance_sheet_${eventDate}.xlsx`;
  await downloadWorkbook(workbook, fileName);
}

/**
 * Generates and downloads a CSV of the Event Attendance Sheet
 */
export function exportAttendanceToCsv(
  records: AttendanceRecord[],
  eventDate: string = new Date().toISOString().slice(0, 10)
) {
  const headers = [
    'NO.',
    'NAME',
    'OFFICE/SERVICE/DIVISION/UNIT',
    'POSITION',
    'SEX (M/F)',
    'EMAIL',
    'CONTACT NO.',
    'AM IN',
    'AM OUT',
    'PM IN',
    'PM OUT',
    'SIGNATURE',
    'REMARKS/ OTHER INFORMATION',
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.office_agency.replace(/"/g, '""')}"`,
    `"${(r.position || '').replace(/"/g, '""')}"`,
    r.sex || '',
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.contact_no || '').replace(/"/g, '""')}"`,
    '""', // AM IN left blank for handwriting
    '""', // AM OUT left blank for handwriting
    '""', // PM IN left blank for handwriting
    '""', // PM OUT left blank for handwriting
    '""', // SIGNATURE column
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_sheet_${eventDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a multi-sheet Excel (.xlsx) file for participants:
 * - Sheet 1: Final Tally (aggregated counts by Agency and CBO, with grand totals)
 * - Sheet 2: Participant Directory (complete itemized list with details)
 */
export async function exportFinalTallyToExcel(
  participants: ParticipantWithRelations[],
  agencies: PartnerAgency[],
  cbos: CBOWithAgency[],
  options: ExportOptions = {}
) {
  const { fileNamePrefix = 'participants_final_tally', isFiltered = false } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Participant Management System';
  workbook.created = new Date();

  // -------------------------------------------------------------
  // Sheet 1: Final Tally Aggregation
  // -------------------------------------------------------------
  const tallySheet = workbook.addWorksheet('Final Tally', {
    views: [{ showGridLines: true }],
  });

  tallySheet.columns = [
    { key: 'agency', width: 28 },
    { key: 'cbo', width: 28 },
    { key: 'confirmed', width: 14 },
    { key: 'pending', width: 14 },
    { key: 'cancelled', width: 14 },
    { key: 'total', width: 18 },
  ];

  // Title Banner
  tallySheet.mergeCells('A1:F1');
  const tallyTitle = tallySheet.getCell('A1');
  tallyTitle.value = 'PARTICIPANT SUMMARY TALLY';
  tallyTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  tallyTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  tallyTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  tallySheet.getRow(1).height = 32;

  // Header Row
  const tallyHeaders = [
    'Partner Agency',
    'CBO Name',
    'Confirmed',
    'Pending',
    'Cancelled',
    'Total Participants',
  ];
  const tallyHeaderRow = tallySheet.getRow(2);
  tallyHeaderRow.values = tallyHeaders;
  tallyHeaderRow.height = 26;

  tallyHeaders.forEach((_, idx) => {
    const colNum = idx + 1;
    const cell = tallyHeaderRow.getCell(colNum);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = {
      horizontal: colNum <= 2 ? 'left' : 'center',
      vertical: 'middle',
    };
    cell.border = thinBorder;
  });

  let grandConfirmed = 0;
  let grandPending = 0;
  let grandCancelled = 0;
  let grandTotal = 0;
  let currentRowIdx = 3;

  const sortedAgencies = [...agencies].sort((a, b) => a.name.localeCompare(b.name));

  for (const agency of sortedAgencies) {
    const agencyCbos = cbos
      .filter((c) => c.partner_agency_id === agency.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const cbo of agencyCbos) {
      const matching = participants.filter(
        (p) => p.partner_agency_id === agency.id && p.cbo_id === cbo.id
      );

      if (isFiltered && matching.length === 0) continue;

      const confirmed = matching.filter((p) => p.status === 'Confirmed').length;
      const pending = matching.filter((p) => p.status === 'Pending').length;
      const cancelled = matching.filter((p) => p.status === 'Cancelled').length;
      const total = matching.length;

      grandConfirmed += confirmed;
      grandPending += pending;
      grandCancelled += cancelled;
      grandTotal += total;

      const row = tallySheet.getRow(currentRowIdx);
      row.height = 22;
      row.values = [agency.name, cbo.name, confirmed, pending, cancelled, total];

      const isEven = currentRowIdx % 2 === 0;
      const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { horizontal: c <= 2 ? 'left' : 'center', vertical: 'middle' };
        cell.border = thinBorder;
      }
      currentRowIdx++;
    }
  }

  // Grand Total Row
  const grandRow = tallySheet.getRow(currentRowIdx);
  grandRow.height = 26;
  grandRow.values = ['GRAND TOTAL', '', grandConfirmed, grandPending, grandCancelled, grandTotal];

  for (let c = 1; c <= 6; c++) {
    const cell = grandRow.getCell(c);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Soft gold
    cell.alignment = { horizontal: c <= 2 ? 'left' : 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // -------------------------------------------------------------
  // Sheet 2: Participant Directory (Detailed List)
  // -------------------------------------------------------------
  const dirSheet = workbook.addWorksheet('Participant Directory', {
    views: [{ showGridLines: true }],
  });

  dirSheet.columns = [
    { key: 'no', width: 7 },
    { key: 'name', width: 28 },
    { key: 'position', width: 22 },
    { key: 'sex', width: 10 },
    { key: 'email', width: 26 },
    { key: 'contact_no', width: 18 },
    { key: 'agency', width: 24 },
    { key: 'cbo', width: 24 },
    { key: 'status', width: 14 },
    { key: 'date_confirmed', width: 18 },
    { key: 'date_registered', width: 18 },
  ];

  // Header Row
  const dirHeaders = [
    '#',
    'Participant Name',
    'Position',
    'Sex',
    'Email',
    'Contact No.',
    'Partner Agency',
    'CBO',
    'Status',
    'Date Confirmed',
    'Date Registered',
  ];

  const dirHeaderRow = dirSheet.getRow(1);
  dirHeaderRow.values = dirHeaders;
  dirHeaderRow.height = 26;

  dirHeaders.forEach((_, idx) => {
    const colNum = idx + 1;
    const cell = dirHeaderRow.getCell(colNum);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = {
      horizontal: [1, 4, 9, 10, 11].includes(colNum) ? 'center' : 'left',
      vertical: 'middle',
    };
    cell.border = thinBorder;
  });

  participants.forEach((p, idx) => {
    const rowNum = 2 + idx;
    const row = dirSheet.getRow(rowNum);
    row.height = 22;

    const rowValues = [
      idx + 1,
      p.name,
      p.position || '—',
      p.sex || '—',
      p.email || '—',
      p.contact_no || '—',
      p.partner_agency?.name || 'Unassigned',
      p.cbo?.name || 'Unassigned',
      p.status,
      p.date_confirmed ? formatDate(p.date_confirmed) : '—',
      formatDate(p.created_at),
    ];

    row.values = rowValues;

    const isEven = idx % 2 === 0;
    const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    rowValues.forEach((_, cIdx) => {
      const colNum = cIdx + 1;
      const cell = row.getCell(colNum);
      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: colNum === 2,
        color: { argb: 'FF1E293B' },
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.alignment = {
        horizontal: [1, 4, 9, 10, 11].includes(colNum) ? 'center' : 'left',
        vertical: 'middle',
      };
      cell.border = thinBorder;
    });
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${fileNamePrefix}_${dateStr}.xlsx`;
  await downloadWorkbook(workbook, fileName);
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
    'Position',
    'Sex',
    'Email',
    'Contact No.',
    'Partner Agency',
    'CBO',
    'Status',
    'Date Confirmed',
    'Date Registered',
  ];

  const rows = participants.map((p, index) => [
    index + 1,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${(p.position || '').replace(/"/g, '""')}"`,
    p.sex || '',
    `"${(p.email || '').replace(/"/g, '""')}"`,
    `"${(p.contact_no || '').replace(/"/g, '""')}"`,
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
