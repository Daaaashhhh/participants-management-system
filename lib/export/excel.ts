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

export interface AttendanceExportSettings {
  eventTitleLine1?: string;
  eventTitleLine2?: string;
  dayInfo?: string;
  dateTime?: string;
  venue?: string;
  divisionName?: string;
  fieldOffice?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  officeAddress?: string;
  websiteAndTel?: string;
  /** Override the starting page number (default: 1). Useful when printing a subset of pages. */
  pageNumberStart?: number;
  /** Override the total pages shown in "PAGE X of Y" (default: auto-computed from record count). */
  totalPagesOverride?: number;
}

export const DEFAULT_EXPORT_SETTINGS: AttendanceExportSettings = {
  eventTitleLine1:
    'ADVANCING NEGOTIATED PROCUREMENT COMMUNITY PARTICIPATION (NP-CP) IMPLEMENTATION:',
  eventTitleLine2:
    'CAPACITY BUILDING CONFERENCE FOR COMMUNITY-BASED ORGANIZATIONS (CBOS)',
  dayInfo: 'DAY 1 OF 2',
  dateTime: 'OCTOBER 13, 2026 and 8:00 AM - 5:00 PM',
  venue: 'FINAL VENUE',
  divisionName: 'INNOVATIONS DIVISION',
  fieldOffice: 'FIELD OFFICE III',
  signatoryName: 'MARITES D. LIWANAG',
  signatoryTitle: 'SWO IV/OIC - DIVISION CHIEF - INNOVATIONS DIVISION',
  officeAddress:
    'DSWD Field Office III , Government Center, Maimpis, City of San Fernando, Pampanga, Philippines 2000',
  websiteAndTel: 'Website: www.fo3.dswd.gov.ph Tel Nos.: (045) 961-2143',
  pageNumberStart: 1,
  totalPagesOverride: undefined, // auto-computed when not set
};

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

async function fetchLogoBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (err) {
    console.error('Failed to load logo from', url, err);
    return null;
  }
}

const blackBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

/**
 * Helper to set borders across a range of cells (useful for merged cells)
 */
function applyBorderToRange(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  border: Partial<ExcelJS.Borders> = blackBorder
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = worksheet.getCell(r, c);
      cell.border = border;
    }
  }
}

/**
 * Generates and downloads an official DSWD Event Attendance Sheet in Excel (.xlsx) format,
 * exactly matching the DSWD template layout (Logos, Division header, Title block,
 * 2-tier AM/PM headers, 15 records per page with continuous numbering, Signatory footer).
 */
export async function exportAttendanceToExcel(
  records: AttendanceRecord[],
  eventDate: string = new Date().toISOString().slice(0, 10),
  customSettings?: AttendanceExportSettings
) {
  const settings: AttendanceExportSettings = {
    ...DEFAULT_EXPORT_SETTINGS,
    ...customSettings,
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Participant Management System';
  workbook.created = new Date();

  const ROWS_PER_PAGE = 15;
  const totalCount = records.length;
  const autoTotalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));
  const totalPages = settings.totalPagesOverride ?? autoTotalPages;
  const pageNumberStart = settings.pageNumberStart ?? 1;

  const worksheet = workbook.addWorksheet('Attendance Sheet', {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: totalPages, // Fit exactly totalPages so each 15-participant page chunk fills A4 vertically
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  // 1. Set Exact Column Widths matching original reference template (Total ~158 units)
  worksheet.columns = [
    { key: 'no', width: 5 },
    { key: 'name', width: 22 },
    { key: 'office', width: 28 }, // Standard 28 width with centered text wrapping
    { key: 'position', width: 16 },
    { key: 'sex', width: 6.5 },
    { key: 'email', width: 19 },
    { key: 'contact_no', width: 13.5 },
    { key: 'am_in', width: 5.5 },
    { key: 'am_out', width: 5.5 },
    { key: 'pm_in', width: 5.5 },
    { key: 'pm_out', width: 5.5 },
    { key: 'signature', width: 14 },
    { key: 'remarks', width: 16 },
  ];

  // Fetch logos
  const dswdBuffer = await fetchLogoBuffer('/logos/dswd-logo.png');
  const bpBuffer = await fetchLogoBuffer('/logos/bagong-pilipinas-logo.png');

  let dswdImageId: number | null = null;
  let bpImageId: number | null = null;

  if (dswdBuffer) {
    dswdImageId = workbook.addImage({
      buffer: dswdBuffer,
      extension: 'png',
    });
  }
  if (bpBuffer) {
    bpImageId = workbook.addImage({
      buffer: bpBuffer,
      extension: 'png',
    });
  }

  let currentRow = 1;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageStartRow = currentRow;
    const pageRecords = records.slice(
      pageIndex * ROWS_PER_PAGE,
      (pageIndex + 1) * ROWS_PER_PAGE
    );

    // --- PAGE HEADER BLOCK ---

    // Set Header Row heights matching reference layout so table fills page
    worksheet.getRow(pageStartRow).height = 28;
    worksheet.getRow(pageStartRow + 1).height = 26;
    worksheet.getRow(pageStartRow + 2).height = 20; // ATTENDANCE SHEET
    worksheet.getRow(pageStartRow + 3).height = 16; // Event Title 1
    worksheet.getRow(pageStartRow + 4).height = 16; // Event Title 2
    worksheet.getRow(pageStartRow + 5).height = 15; // Day Info
    worksheet.getRow(pageStartRow + 6).height = 15; // Date & Time
    worksheet.getRow(pageStartRow + 7).height = 15; // Venue

    // Add Logos top-left side-by-side in Column A & B (0% overlap)
    if (dswdImageId !== null) {
      worksheet.addImage(dswdImageId, {
        tl: { col: 0.05, row: pageStartRow - 1 + 0.05 },
        ext: { width: 145, height: 56 },
      });
    }

    if (bpImageId !== null) {
      worksheet.addImage(bpImageId, {
        tl: { col: 1.62, row: pageStartRow - 1 + 0.08 },
        ext: { width: 48, height: 50 },
      });
    }

    // Row 1: Top-Right Division Header
    worksheet.mergeCells(pageStartRow, 8, pageStartRow, 13);
    const divCell = worksheet.getCell(pageStartRow, 8);
    divCell.value = settings.divisionName || 'INNOVATIONS DIVISION';
    divCell.font = { name: 'Arial', size: 10, bold: true };
    divCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Row 2: Field Office Header
    worksheet.mergeCells(pageStartRow + 1, 8, pageStartRow + 1, 13);
    const foCell = worksheet.getCell(pageStartRow + 1, 8);
    foCell.value = settings.fieldOffice || 'FIELD OFFICE III';
    foCell.font = { name: 'Arial', size: 10, bold: true };
    foCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Row 3: "ATTENDANCE SHEET"
    worksheet.mergeCells(pageStartRow + 2, 1, pageStartRow + 2, 13);
    const attCell = worksheet.getCell(pageStartRow + 2, 1);
    attCell.value = 'ATTENDANCE SHEET';
    attCell.font = { name: 'Arial', size: 12, bold: true };
    attCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 4: Event Title Line 1
    worksheet.mergeCells(pageStartRow + 3, 1, pageStartRow + 3, 13);
    const title1Cell = worksheet.getCell(pageStartRow + 3, 1);
    title1Cell.value = settings.eventTitleLine1 || '';
    title1Cell.font = { name: 'Arial', size: 10, bold: true };
    title1Cell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 5: Event Title Line 2
    worksheet.mergeCells(pageStartRow + 4, 1, pageStartRow + 4, 13);
    const title2Cell = worksheet.getCell(pageStartRow + 4, 1);
    title2Cell.value = settings.eventTitleLine2 || '';
    title2Cell.font = { name: 'Arial', size: 10, bold: true };
    title2Cell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 6: Day Info
    worksheet.mergeCells(pageStartRow + 5, 1, pageStartRow + 5, 13);
    const dayCell = worksheet.getCell(pageStartRow + 5, 1);
    dayCell.value = settings.dayInfo || 'DAY 1 OF 2';
    dayCell.font = { name: 'Arial', size: 9.5, bold: true };
    dayCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 7: Date & Time
    worksheet.mergeCells(pageStartRow + 6, 1, pageStartRow + 6, 13);
    const dtCell = worksheet.getCell(pageStartRow + 6, 1);
    dtCell.value = settings.dateTime || `OCTOBER 13, 2026 and 8:00 AM - 5:00 PM`;
    dtCell.font = { name: 'Arial', size: 9.5, bold: true };
    dtCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 8: Venue (in bold RED)
    worksheet.mergeCells(pageStartRow + 7, 1, pageStartRow + 7, 13);
    const venueCell = worksheet.getCell(pageStartRow + 7, 1);
    venueCell.value = settings.venue || 'FINAL VENUE';
    venueCell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFF0000' } };
    venueCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- TABLE HEADERS (Rows 9 & 10 of page) ---
    const hRow1 = pageStartRow + 8;
    const hRow2 = pageStartRow + 9;

    worksheet.getRow(hRow1).height = 16;
    worksheet.getRow(hRow2).height = 16;

    // Single-level merged columns (span hRow1 to hRow2)
    const singleCols = [
      { col: 1, text: 'NO.' },
      { col: 2, text: 'NAME' },
      { col: 3, text: 'OFFICE/SERVICE/\nDIVISION/UNIT' },
      { col: 4, text: 'POSITION' },
      { col: 5, text: 'SEX\nM/F' },
      { col: 6, text: 'EMAIL' },
      { col: 7, text: 'CONTACT NO.' },
      { col: 12, text: 'SIGNATURE' },
      { col: 13, text: 'REMARKS/\nOTHER' },
    ];

    singleCols.forEach(({ col, text }) => {
      worksheet.mergeCells(hRow1, col, hRow2, col);
      const cell = worksheet.getCell(hRow1, col);
      cell.value = text;
      cell.font = { name: 'Arial', size: 8.5, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      applyBorderToRange(worksheet, hRow1, col, hRow2, col, blackBorder);
    });

    // AM Column (H9:I9 merged "AM", H10 "IN", I10 "OUT")
    worksheet.mergeCells(hRow1, 8, hRow1, 9);
    const amHeader = worksheet.getCell(hRow1, 8);
    amHeader.value = 'AM';
    amHeader.font = { name: 'Arial', size: 8.5, bold: true };
    amHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    applyBorderToRange(worksheet, hRow1, 8, hRow1, 9, blackBorder);

    const amInCell = worksheet.getCell(hRow2, 8);
    amInCell.value = 'IN';
    amInCell.font = { name: 'Arial', size: 8, bold: true };
    amInCell.alignment = { horizontal: 'center', vertical: 'middle' };
    amInCell.border = blackBorder;

    const amOutCell = worksheet.getCell(hRow2, 9);
    amOutCell.value = 'OUT';
    amOutCell.font = { name: 'Arial', size: 8, bold: true };
    amOutCell.alignment = { horizontal: 'center', vertical: 'middle' };
    amOutCell.border = blackBorder;

    // PM Column (J9:K9 merged "PM", J10 "IN", K10 "OU")
    worksheet.mergeCells(hRow1, 10, hRow1, 11);
    const pmHeader = worksheet.getCell(hRow1, 10);
    pmHeader.value = 'PM';
    pmHeader.font = { name: 'Arial', size: 8.5, bold: true };
    pmHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    applyBorderToRange(worksheet, hRow1, 10, hRow1, 11, blackBorder);

    const pmInCell = worksheet.getCell(hRow2, 10);
    pmInCell.value = 'IN';
    pmInCell.font = { name: 'Arial', size: 8, bold: true };
    pmInCell.alignment = { horizontal: 'center', vertical: 'middle' };
    pmInCell.border = blackBorder;

    const pmOutCell = worksheet.getCell(hRow2, 11);
    pmOutCell.value = 'OU';
    pmOutCell.font = { name: 'Arial', size: 8, bold: true };
    pmOutCell.alignment = { horizontal: 'center', vertical: 'middle' };
    pmOutCell.border = blackBorder;

    // --- TABLE DATA ROWS (15 Rows per page) ---
    const dataStartRow = pageStartRow + 10;

    for (let i = 0; i < ROWS_PER_PAGE; i++) {
      const dataRowIndex = dataStartRow + i;
      const row = worksheet.getRow(dataRowIndex);

      const recordIndex = pageIndex * ROWS_PER_PAGE + i;
      const r = pageRecords[i];

      // Dynamic row height calculation tuned for reference template
      const officeText = r ? r.office_agency || '' : '';
      const remarksText = r ? r.remarks || '' : '';
      const nameText = r ? r.name || '' : '';
      const maxTextLen = Math.max(officeText.length, remarksText.length, nameText.length);

      let calcHeight = 22;
      if (maxTextLen > 50) {
        calcHeight = 26;
      }
      row.height = calcHeight;

      const noVal = recordIndex + 1;

      const rowValues = [
        noVal,
        r ? r.name : '',
        r ? r.office_agency : '',
        r ? r.position || '' : '',
        r ? r.sex || '' : '',
        r ? r.email || '' : '',
        r ? r.contact_no || '' : '',
        '', // AM IN
        '', // AM OUT
        '', // PM IN
        '', // PM OUT
        '', // SIGNATURE
        r ? r.remarks || '' : '',
      ];

      row.values = rowValues;

      for (let c = 1; c <= 13; c++) {
        const cell = row.getCell(c);
        
        const fontSize = c === 3 ? 8.5 : 9;
        cell.font = {
          name: 'Arial',
          size: fontSize,
          bold: c === 2 && Boolean(r), // Bold name
          color: { argb: 'FF000000' },
        };

        cell.alignment = {
          horizontal: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(c)
            ? 'center'
            : 'left',
          vertical: 'middle',
          wrapText: true,
        };

        cell.border = blackBorder;
      }
    }

    // --- FOOTER BLOCK ---
    const footerStartRow = dataStartRow + ROWS_PER_PAGE; // Row 26 of page

    // Dashed border line above footer
    const sepRow = worksheet.getRow(footerStartRow);
    sepRow.height = 5;

    // Signatory Name (Row 27 of page)
    const sigNameRow = footerStartRow + 1;
    worksheet.getRow(sigNameRow).height = 16;
    worksheet.mergeCells(sigNameRow, 1, sigNameRow, 13);
    const sigNameCell = worksheet.getCell(sigNameRow, 1);
    sigNameCell.value = settings.signatoryName || 'MARITES D. LIWANAG';
    sigNameCell.font = { name: 'Arial', size: 10, bold: true };
    sigNameCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Signatory Title (Row 28 of page)
    const sigTitleRow = footerStartRow + 2;
    worksheet.getRow(sigTitleRow).height = 14;
    worksheet.mergeCells(sigTitleRow, 1, sigTitleRow, 13);
    const sigTitleCell = worksheet.getCell(sigTitleRow, 1);
    sigTitleCell.value =
      settings.signatoryTitle ||
      'SWO IV/OIC - DIVISION CHIEF - INNOVATIONS DIVISION';
    sigTitleCell.font = { name: 'Arial', size: 8.5 };
    sigTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // PAGE X of Y (Row 29 of page)
    const pageNumRow = footerStartRow + 3;
    worksheet.getRow(pageNumRow).height = 12;
    worksheet.mergeCells(pageNumRow, 1, pageNumRow, 13);
    const pageNumCell = worksheet.getCell(pageNumRow, 1);
    pageNumCell.value = `PAGE ${pageNumberStart + pageIndex} of ${totalPages}`;
    pageNumCell.font = { name: 'Arial', size: 8 };
    pageNumCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Office Address (Row 30 of page)
    const addrRow = footerStartRow + 4;
    worksheet.getRow(addrRow).height = 11;
    worksheet.mergeCells(addrRow, 1, addrRow, 13);
    const addrCell = worksheet.getCell(addrRow, 1);
    addrCell.value =
      settings.officeAddress ||
      'DSWD Field Office III , Government Center, Maimpis, City of San Fernando, Pampanga, Philippines 2000';
    addrCell.font = { name: 'Arial', size: 7.5 };
    addrCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Website & Tel (Row 31 of page)
    const webRow = footerStartRow + 5;
    worksheet.getRow(webRow).height = 11;
    worksheet.mergeCells(webRow, 1, webRow, 13);
    const webCell = worksheet.getCell(webRow, 1);
    webCell.value =
      settings.websiteAndTel ||
      'Website: www.fo3.dswd.gov.ph Tel Nos.: (045) 961-2143';
    webCell.font = { name: 'Arial', size: 7.5 };
    webCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Advance currentRow for next page
    currentRow = webRow + 1;

    // Add page break after each page except the last
    if (pageIndex < totalPages - 1) {
      const pageBreakRow = worksheet.getRow(webRow);
      pageBreakRow.addPageBreak();
    }
  }

  const fileName = `DSWD_Attendance_Sheet_${eventDate}.xlsx`;
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

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // Sheet 1: Final Tally Aggregation
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    cell.alignment = { horizontal: c <= 2 ? 'left' : 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // Sheet 2: Participant Directory
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
