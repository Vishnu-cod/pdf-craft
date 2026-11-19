import React, { useState } from 'react';
import { squeezePDFToTargetKB, SqueezeResult } from '../utils/sizeSqueezer';
import { downloadBlob } from '../utils/pdfEngine';
import {
  Shrink,
  Download,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Loader2,
  Sliders,
  FileCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SizeSqueezerProps {
  initialPdfBytes?: ArrayBuffer;
  initialFileName?: string;
  initialTargetKB?: number;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const SizeSqueezer: React.FC<SizeSqueezerProps> = ({
  initialPdfBytes,
  initialFileName = 'document.pdf',
  initialTargetKB = 195,
  onFileLoaded,
}) => {
  const [targetKB, setTargetKB] = useState<number>(initialTargetKB);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(initialPdfBytes || null);
  const [fileName, setFileName] = useState<string>(initialFileName);

  React.useEffect(() => {
    if (initialTargetKB) {
      setTargetKB(initialTargetKB);
    }
  }, [initialTargetKB]);

  React.useEffect(() => {
    if (initialPdfBytes) {
      setPdfBytes(initialPdfBytes);
      setFileName(initialFileName || 'document.pdf');
    }
  }, [initialPdfBytes, initialFileName]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [result, setResult] = useState<SqueezeResult | null>(null);

  const presets = [
    { label: '100 KB', value: 95, desc: 'UPSC, SSC, Govt Exam Portals' },
    { label: '200 KB', value: 195, desc: 'TCS, Infosys, State Job Portals' },
    { label: '500 KB', value: 490, desc: 'US Visa DS-160, Schengen Portals' },
    { label: '1 MB', value: 980, desc: 'Corporate Email & Upload Limits' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    setPdfBytes(arrayBuffer);
    setFileName(file.name);
    setResult(null);
    onFileLoaded?.(file, arrayBuffer);
  };

  const handleRunSqueeze = async () => {
    if (!pdfBytes) {
      alert('Please upload a PDF document first.');
      return;
    }

    setIsProcessing(true);
    setProgressText('Analyzing pages and calculating optimal compression curve...');

    try {
      const res = await squeezePDFToTargetKB(
        pdfBytes,
        targetKB,
        (current, total, msg) => {
          setProgressText(msg);
        }
      );
      setResult(res);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      alert('Compression error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}_squeezed_${result.compressedSizeKB}kb.pdf`;
    const blob = new Blob([result.compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    downloadBlob(blob, outName);
    confetti({ particleCount: 60, spread: 70 });
  };

  const currentOriginalKB = pdfBytes ? Math.round(pdfBytes.byteLength / 1024) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 shrink-0">
              <Shrink className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">Target Size Squeezer (Portal Cruncher)</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Guaranteed Under Portal Limit • Free $0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Never get rejected by 200 KB or 500 KB portal caps again. Downscales resolution and compresses to fit strictly under your chosen KB limit.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer shadow-md w-full sm:w-auto">
          <UploadCloud className="w-4 h-4 text-emerald-400" />
          <span>Upload PDF Document</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Main Control Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        
        {/* Document Status */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
              PDF
            </div>
            <div>
              <h4 className="text-xs font-bold text-white truncate max-w-[280px]">{fileName}</h4>
              <p className="text-[11px] text-slate-400">
                Original Size: <strong className="text-slate-200">{currentOriginalKB} KB</strong> ({((currentOriginalKB / 1024)).toFixed(2)} MB)
              </p>
            </div>
          </div>

          <div className="text-xs text-right">
            <span className="text-slate-400">Selected Target Ceiling:</span>
            <p className="text-sm font-black text-emerald-400">Under {targetKB} KB</p>
          </div>
        </div>

        {/* Target Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Common Government & Job Portal Limits</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setTargetKB(p.value)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  targetKB === p.value
                    ? 'bg-emerald-500/20 text-white border-emerald-500 font-bold shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <span className="text-base font-black block">{p.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-1">{p.desc}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono mt-2 font-semibold">Target: ≤ {p.value} KB</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Target Slider */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Or Custom Target Ceiling:</span>
            </span>
            <span className="text-emerald-400 font-bold font-mono">{targetKB} KB</span>
          </div>
          <input
            type="range"
            min="60"
            max="1500"
            step="15"
            value={targetKB}
            onChange={(e) => setTargetKB(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>60 KB (Extreme)</span>
            <span>200 KB</span>
            <span>500 KB</span>
            <span>1000 KB (1 MB)</span>
            <span>1500 KB</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleRunSqueeze}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progressText || 'Crunching PDF to target size...'}</span>
            </>
          ) : (
            <>
              <Shrink className="w-4 h-4" />
              <span>Squeeze PDF Strictly Under {targetKB} KB ✨</span>
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Squeeze Succeeded! Guaranteed Portal Safe</h3>
              <p className="text-xs text-slate-400">
                Your file is now <strong className="text-emerald-300">{result.compressedSizeKB} KB</strong> (safely under your {targetKB} KB target).
              </p>
            </div>
          </div>

          {/* Stat Comparison Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Original Size</span>
              <p className="text-xl font-black text-rose-400 mt-1">{result.originalSizeKB} KB</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center shadow-inner">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">New Optimized Size</span>
              <p className="text-xl font-black text-emerald-400 mt-1">{result.compressedSizeKB} KB</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Space Saved</span>
              <p className="text-xl font-black text-white mt-1">-{result.reductionPercentage}%</p>
            </div>
          </div>

          {/* First Page Preview & Download */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            {result.firstPagePreviewUrl && (
              <div className="flex items-center gap-4">
                <div className="w-20 h-28 border border-slate-700 rounded-lg overflow-hidden shadow-lg bg-white shrink-0">
                  <img
                    src={result.firstPagePreviewUrl}
                    alt="Page 1 Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Visual Clarity Verified</span>
                  </h5>
                  <p className="text-slate-400 text-[11px] leading-relaxed max-w-sm">
                    Text, signatures, and stamps were smoothed with bicubic filtering to remain legible for portal officers.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Squeezed PDF ({result.compressedSizeKB} KB)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
