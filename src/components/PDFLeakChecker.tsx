import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  FileSearch,
  UploadCloud,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ExternalLink,
  Code,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { inspectPdfPrivacy, sanitizePdfMetadata, PdfPrivacyReport } from '../utils/pdfLeakChecker';

interface PDFLeakCheckerProps {
  initialFile?: File | null;
  initialPdfBytes?: ArrayBuffer | null;
  onOpenTool?: (toolId: string) => void;
}

export const PDFLeakChecker: React.FC<PDFLeakCheckerProps> = ({
  initialFile,
  initialPdfBytes,
  onOpenTool,
}) => {
  const [currentFile, setCurrentFile] = useState<File | null>(initialFile || null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(initialPdfBytes || null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [report, setReport] = useState<PdfPrivacyReport | null>(null);

  useEffect(() => {
    if (initialFile) {
      setCurrentFile(initialFile);
      initialFile.arrayBuffer().then((buf) => {
        setFileBuffer(buf);
        runAudit(buf, initialFile.name);
      });
    } else if (initialPdfBytes) {
      setFileBuffer(initialPdfBytes);
      runAudit(initialPdfBytes, 'sample.pdf');
    }
  }, [initialFile, initialPdfBytes]);

  const runAudit = async (buffer: ArrayBuffer, name: string) => {
    setIsScanning(true);
    try {
      const res = await inspectPdfPrivacy(buffer, name);
      setReport(res);
    } catch (e) {
      console.error('Audit failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentFile(file);
    const buf = await file.arrayBuffer();
    setFileBuffer(buf);
    runAudit(buf, file.name);
  };

  const handleSanitizeAndDownload = async () => {
    if (!fileBuffer || !currentFile) return;
    setIsSanitizing(true);
    try {
      const sanitizedBytes = await sanitizePdfMetadata(fileBuffer);
      const blob = new Blob([sanitizedBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentFile.name.replace(/\.pdf$/i, '')}-sanitized.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error('Failed to sanitize metadata:', err);
    } finally {
      setIsSanitizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-white">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>100% Client-Side Privacy Inspector</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          PDF Privacy & Metadata Leak Checker
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Audit your documents for hidden author details, creation software, raw XMP telemetry GUIDs, embedded tracking links, and unpurged byte leaks before emailing.
        </p>
      </div>

      {/* Upload Zone */}
      {!report && !isScanning && (
        <div className="bg-slate-900/60 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-all rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <FileSearch className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-1">Select a PDF to Audit</h3>
          <p className="text-slate-400 text-xs mb-6 max-w-sm mx-auto">
            Your file processes 100% in local browser memory. Zero packets leave your machine.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm cursor-pointer shadow-lg shadow-indigo-600/30 transition">
            <UploadCloud className="w-4 h-4" />
            <span>Choose PDF File</span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* Scanning Indicator */}
      {isScanning && (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-200">Inspecting Document Byte Streams...</h3>
          <p className="text-slate-400 text-xs mt-1">Scanning XRef tables, XMP dictionaries, and embedded objects</p>
        </div>
      )}

      {/* Audit Report Results */}
      {report && !isScanning && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-5">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-2xl border ${
                  report.privacyScore >= 85
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : report.privacyScore >= 60
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span>{report.privacyScore}</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">
                    {report.privacyScore >= 85
                      ? 'Clean Document Privacy'
                      : report.privacyScore >= 60
                      ? 'Moderate Metadata Exposure'
                      : 'Critical Privacy / Data Leaks'}
                  </h3>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                      report.privacyScore >= 85
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : report.privacyScore >= 60
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {report.riskLevel.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Audited <span className="text-slate-200 font-semibold">{report.fileName}</span> ({report.pageCount} pages, {(report.fileSizeBytes / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 transition">
                <FileSearch className="w-3.5 h-3.5" />
                <span>Audit Another</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </label>

              <button
                onClick={handleSanitizeAndDownload}
                disabled={isSanitizing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {isSanitizing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>1-Click Sanitize & Strip Metadata</span>
              </button>
            </div>
          </div>

          {/* Grid of Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metadata Fields Disclosed */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Document Dictionary Metadata</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  {report.leakedFields.length} field(s) detected
                </span>
              </div>

              {report.leakedFields.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No author names, software tags, or creation timestamps embedded.
                </div>
              ) : (
                <div className="space-y-3">
                  {report.leakedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                          {field.label}
                        </span>
                        <p className="text-xs font-semibold text-white break-all">{field.value}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          field.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : field.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {field.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security & Executable Risks */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Security & Tracking Inspection</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  {report.risks.length} issue(s) flagged
                </span>
              </div>

              {report.risks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  Zero JavaScript triggers, zero tracking URLs, and no XMP GUID telemetry found.
                </div>
              ) : (
                <div className="space-y-3">
                  {report.risks.map((risk) => (
                    <div
                      key={risk.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                        risk.severity === 'danger'
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : risk.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-800/40 border-slate-800'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          risk.severity === 'danger'
                            ? 'text-rose-400'
                            : risk.severity === 'warning'
                            ? 'text-amber-400'
                            : 'text-indigo-400'
                        }`}
                      />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">{risk.title}</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{risk.description}</p>
                        {risk.evidence && (
                          <div className="mt-1 font-mono text-[10px] text-slate-400 bg-black/30 px-2 py-1 rounded">
                            {risk.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
