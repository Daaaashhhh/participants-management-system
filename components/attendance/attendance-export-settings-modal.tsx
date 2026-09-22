'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, RotateCcw } from 'lucide-react';
import { AttendanceExportSettings, DEFAULT_EXPORT_SETTINGS } from '@/lib/export/excel';

interface AttendanceExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: AttendanceExportSettings) => void;
  recordCount: number;
  eventDate: string;
}

const STORAGE_KEY = 'dswd_attendance_export_settings';

export function AttendanceExportSettingsModal({
  isOpen,
  onClose,
  onConfirm,
  recordCount,
  eventDate,
}: AttendanceExportSettingsModalProps) {
  const [settings, setSettings] = React.useState<AttendanceExportSettings>(DEFAULT_EXPORT_SETTINGS);

  // Load from localStorage or defaults when modal opens
  React.useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_EXPORT_SETTINGS, ...parsed });
        } else {
          const dateObj = new Date(eventDate);
          const dateFormatted = isNaN(dateObj.getTime())
            ? eventDate
            : dateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }).toUpperCase();

          setSettings({
            ...DEFAULT_EXPORT_SETTINGS,
            dateTime: `${dateFormatted} and 8:00 AM - 5:00 PM`,
          });
        }
      } catch {
        setSettings(DEFAULT_EXPORT_SETTINGS);
      }
    }
  }, [isOpen, eventDate]);

  const handleChange = (field: keyof AttendanceExportSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_EXPORT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save export settings', err);
    }
    onConfirm(settings);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DSWD Attendance Sheet Export"
      description={`Configure template metadata before generating the Excel file (${recordCount} participant${
        recordCount === 1 ? '' : 's'
      }, max 15 per sheet/page).`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Event Header Block */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
              Event Header Information
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs text-slate-500 hover:text-slate-800"
              title="Reset to default template text"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Defaults
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">
                Event Title (Line 1)
              </label>
              <input
                type="text"
                value={settings.eventTitleLine1 || ''}
                onChange={(e) => handleChange('eventTitleLine1', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="ADVANCING NEGOTIATED PROCUREMENT..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">
                Event Title (Line 2 / Subtitle)
              </label>
              <input
                type="text"
                value={settings.eventTitleLine2 || ''}
                onChange={(e) => handleChange('eventTitleLine2', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="CAPACITY BUILDING CONFERENCE..."
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Day Info / Conference Day
              </label>
              <input
                type="text"
                value={settings.dayInfo || ''}
                onChange={(e) => handleChange('dayInfo', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="DAY 1 OF 2"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Venue <span className="text-red-500 font-normal">(Highlighted red)</span>
              </label>
              <input
                type="text"
                value={settings.venue || ''}
                onChange={(e) => handleChange('venue', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-red-600 font-semibold"
                placeholder="FINAL VENUE"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">
                Date &amp; Time
              </label>
              <input
                type="text"
                value={settings.dateTime || ''}
                onChange={(e) => handleChange('dateTime', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="OCTOBER 13, 2026 and 8:00 AM - 5:00 PM"
              />
            </div>
          </div>
        </div>

        {/* Office & Signatory Block */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
          <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
            Division &amp; Signatory Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Division Name
              </label>
              <input
                type="text"
                value={settings.divisionName || ''}
                onChange={(e) => handleChange('divisionName', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Field Office
              </label>
              <input
                type="text"
                value={settings.fieldOffice || ''}
                onChange={(e) => handleChange('fieldOffice', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Signatory Name
              </label>
              <input
                type="text"
                value={settings.signatoryName || ''}
                onChange={(e) => handleChange('signatoryName', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Signatory Title
              </label>
              <input
                type="text"
                value={settings.signatoryTitle || ''}
                onChange={(e) => handleChange('signatoryTitle', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Page Numbering Block */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
          <div className="border-b border-slate-200 pb-1.5">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
              Page Numbering
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Controls the <span className="font-mono font-semibold">PAGE X of Y</span> label printed at the bottom of each sheet.
              Leave <em>Total Pages</em> blank to auto-compute from the number of participants.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Starting Page Number
              </label>
              <input
                type="number"
                min={1}
                value={settings.pageNumberStart ?? 1}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    pageNumberStart: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="1"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">e.g. set to 2 if this is the 2nd printout</p>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Total Pages (Y) <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min={1}
                value={settings.totalPagesOverride ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value) || 1);
                  setSettings((prev) => ({ ...prev, totalPagesOverride: val }));
                }}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="Auto"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">e.g. set to 3 for "PAGE 1 of 3"</p>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-white border border-dashed border-slate-300 rounded-md px-3 py-2 text-center">
            <span className="text-[10px] text-slate-500">Preview: </span>
            <span className="font-mono text-xs font-semibold text-slate-700">
              PAGE {settings.pageNumberStart ?? 1} of {settings.totalPagesOverride ?? '(auto)'}
            </span>
            {settings.totalPagesOverride == null && (
              <span className="text-[10px] text-slate-400 ml-1">
                — auto = {Math.max(1, Math.ceil(recordCount / 15))} page{Math.max(1, Math.ceil(recordCount / 15)) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Generate Excel (.xlsx)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
