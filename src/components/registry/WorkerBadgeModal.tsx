import React, { useRef } from 'react';
import { X, Printer, QrCode, Building2, ShieldCheck, Download } from 'lucide-react';
import { Worker, Contractor, Shift } from '../../types';
import { getQrSvg } from '../../utils/qrGenerator';
import { formatCurrency } from '../../utils/wageEngine';

interface WorkerBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  contractor: Contractor | null;
  shift: Shift | null;
  factoryName?: string;
}

export const WorkerBadgeModal: React.FC<WorkerBadgeModalProps> = ({
  isOpen,
  onClose,
  worker,
  contractor,
  shift,
  factoryName = 'Apex Heavy Engineering & Castings Plant',
}) => {
  if (!isOpen || !worker) return null;

  const qrSvgString = getQrSvg(worker.workerCode);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Worker Security Badge Preview</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Physical ID Card Container */}
        <div className="p-6 flex justify-center bg-slate-950/40">
          <div
            id="printable-badge"
            className="w-72 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-2xl p-5 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Top Security Stripe */}
            <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600" />

            {/* Plant Header */}
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
              FACTORY WORKFORCE PASS
            </div>
            <div className="text-xs font-extrabold text-slate-800 leading-tight truncate max-w-full">
              {factoryName}
            </div>

            {/* QR Code Container */}
            <div className="my-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs w-36 h-36 flex items-center justify-center">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: qrSvgString }}
              />
            </div>

            {/* Worker Name & Code */}
            <div className="text-base font-black text-slate-900 leading-snug">
              {worker.name}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-300 mt-0.5">
              {worker.workerCode}
            </div>

            {/* Details */}
            <div className="w-full mt-3 pt-3 border-t border-slate-200 text-left space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-800">{worker.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contractor:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                  {contractor ? contractor.name : 'Direct'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Shift:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                  {shift ? shift.name : 'Standard Shift'}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-mono text-indigo-700 font-bold">
                <span>Kiosk PIN:</span>
                <span>{worker.pin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">Hold badge to Guard Kiosk camera</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

