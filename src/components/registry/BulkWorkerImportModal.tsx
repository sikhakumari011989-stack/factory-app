import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

interface ParsedWorkerRow {
  name: string;
  phone: string;
  dailyWage: number;
}

interface BulkWorkerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
  bulkAddWorkers: (
    workers: { name: string; phone?: string; dailyWage?: number; baseHourlyRate?: number }[]
  ) => number;
}

export const BulkWorkerImportModal: React.FC<BulkWorkerImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  bulkAddWorkers,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedWorkerRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // 1. Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Name,Phone,Daily Wage\n' +
      'Ramesh Kumar,9820011223,550\n' +
      'Suresh Patil,9820022334,600\n' +
      'Mahesh Yadav,9820033445,500\n' +
      'Sunil Sharma,9820044556,650\n' +
      'Dinesh Rathod,9820055667,550\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'factory_workers_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Parse Excel or CSV file using SheetJS (XLSX)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) throw new Error('File read error');

        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawJson.length === 0) {
          setParseError('The uploaded file contains no worker rows. Please check your data.');
          setParsedRows([]);
          setIsProcessing(false);
          return;
        }

        // Normalize columns (Case-insensitive mapping)
        const parsed: ParsedWorkerRow[] = [];

        rawJson.forEach((row) => {
          let name = '';
          let phone = '';
          let dailyWage = 500;

          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const val = String(row[key]).trim();

            if (cleanKey.includes('name')) {
              name = val;
            } else if (cleanKey.includes('phone') || cleanKey.includes('mobile') || cleanKey.includes('contact')) {
              phone = val;
            } else if (cleanKey.includes('wage') || cleanKey.includes('rate') || cleanKey.includes('salary')) {
              const num = Number(val.replace(/[^0-9.]/g, ''));
              if (!isNaN(num) && num > 0) {
                dailyWage = Math.round(num);
              }
            }
          });

          if (name && name.length > 1) {
            parsed.push({
              name,
              phone: phone || 'N/A',
              dailyWage,
            });
          }
        });

        if (parsed.length === 0) {
          setParseError(
            'Could not find a valid "Name" column in your spreadsheet. Please make sure the header row has "Name", "Phone", and "Daily Wage".'
          );
        }

        setParsedRows(parsed);
      } catch (err: unknown) {
        setParseError(err instanceof Error ? err.message : 'Failed to parse spreadsheet file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParseError('Error reading file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  // 3. Confirm and save to state / Firestore
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const count = bulkAddWorkers(
      parsedRows.map((r) => ({
        name: r.name,
        phone: r.phone,
        dailyWage: r.dailyWage,
        baseHourlyRate: Math.round(r.dailyWage / 8),
      }))
    );

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onImportSuccess(count);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-6 text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Import Workers from Excel / CSV
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk add factory workers without typing names one by one
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Download Sample Template */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Need a formatted file? Download our sample:</span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>
        </div>

        {/* Step 2: Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/70 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 border border-slate-700 group-hover:border-emerald-500/30 flex items-center justify-center mx-auto mb-3 transition-colors">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">
            {file ? file.name : 'Click to choose or drop Excel / CSV file'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports .xlsx, .xls, and .csv files with Name, Phone, and Daily Wage
          </p>
        </div>

        {/* Parse Error */}
        {parseError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Step 3: Parsed Workers Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready to Import: {parsedRows.length} Workers</span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-slate-400 hover:text-rose-400 text-[11px] underline cursor-pointer"
              >
                Clear file
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 divide-y divide-slate-800/60 text-xs">
              {parsedRows.map((row, idx) => (
                <div key={idx} className="p-2.5 sm:px-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 w-5">#{idx + 1}</span>
                    <span className="font-bold text-white truncate">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                      {row.phone}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                      ₹{row.dailyWage}/day
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer"
          >
            <span>Add {parsedRows.length} Workers to Factory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

