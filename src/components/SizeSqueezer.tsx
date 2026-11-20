import React, { useState, useRef } from 'react';
import {
  squeezePDFToTargetKB,
  compressPDFVectorPreserve,
  SqueezeResult,
  CompressionStrategy,
} from '../utils/sizeSqueezer';
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
  AlertTriangle,
  FileText,
  XCircle,
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
  const [strategy, setStrategy] = useState<CompressionStrategy>('target-squeeze');
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const presets = [
    { label: '50 KB', value: 48, desc: 'Photo, Signature & Exam Portal Cap' },
    { label: '100 KB', value: 95, desc: 'UPSC, SSC, State Govt Job Portals' },
    { label: '200 KB', value: 195, desc: 'TCS, Infosys, College Admissions' },
    { label: '300 KB', value: 295, desc: 'Visa & Scholarship Application Limit' },
    { label: '500 KB', value: 490, desc: 'US Visa DS-160, Schengen Limit' },
    { label: '1 MB', value: 980, desc: 'Corporate Email & Upload Limits' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    setPdfBytes(arrayBuffer);
    setFileName(file.name);
    setResult(null);
    setErrorMessage(null);
    onFileLoaded?.(file, arrayBuffer);
  };

  const handleRunSqueeze = async () => {
    if (!pdfBytes) {
      alert('Please upload a PDF document first.');
      return;
    }

    setIsProcessing(true);
    isCancelledRef.current = false;
    setErrorMessage(null);
    setResult(null);
    setProgressText('Analyzing pages and calculating optimal compression curve...');

    try {
      let res: SqueezeResult;
      if (strategy === 'vector-preserve') {
        res = await compressPDFVectorPreserve(pdfBytes, (_c, _t, msg) => {
          setProgressText(msg);
        });
      } else {
        res = await squeezePDFToTargetKB(
          pdfBytes,
          targetKB,
          (_curr, _total, msg) => {
            setProgressText(msg);
          },
          () => isCancelledRef.current
        );
      }

      setResult(res);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      if (err?.message?.includes('cancelled')) {
        setErrorMessage('Compression was cancelled by user.');
      } else {
        setErrorMessage('Compression error: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setProgressText('Cancelling...');
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}_compressed_${result.compressedSizeKB}kb.pdf`;
    downloadBlob(result.compressedBytes, outName);
  };

  const originalKB = pdfBytes ? Math.round(pdfBytes.byteLength / 1024) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shrink className="w-5 h-5 text-emerald-400" />
            <span>Target Size Squeezer &amp; Compressor</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              Verified Limits
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compress PDFs to meet strict government portal, visa, and exam upload caps. 100% in-browser memory.
          </p>
        </div>

        {pdfBytes && (
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition shadow-sm">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Change PDF</span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        )}
      </div>

      {/* Upload Zone when no document is active */}
      {!pdfBytes ? (
        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-3xl p-12 text-center bg-slate-900/60 transition group cursor-pointer relative shadow-xl">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 group-hover:scale-110 transition">
            <Shrink className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Drop your PDF here to compress</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Dial in a strict target ceiling (50KB, 100KB, 200KB) or use lossless vector compression.
          </p>
          <button className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Card & Strategy Selector */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-semibold text-white truncate max-w-xs">{fileName}</span>
              </div>
              <span className="font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                Original Size: {originalKB} KB
              </span>
            </div>

            {/* Strategy Modes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Compression Strategy:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStrategy('target-squeeze')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    strategy === 'target-squeeze'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Strict Target Size Squeezer</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Adaptive scaling strictly tailored to government, college, or job portal limits (50KB, 100KB, 200KB).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy('vector-preserve')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    strategy === 'vector-preserve'
                      ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>High Quality (Vector Preserved)</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Optimizes internal streams and object tables without rasterizing. Keeps 100% vector fonts, selectable text &amp; links.
                  </p>
                </button>
              </div>
            </div>

            {/* Target KB Presets & Slider (Active in Target Squeezer Mode) */}
            {strategy === 'target-squeeze' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Select Target Size Limit:</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    Target: {targetKB} KB
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {presets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setTargetKB(p.value)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        targetKB === p.value
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-white font-mono">{p.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Range Slider */}
                <div className="pt-2">
                  <input
                    type="range"
                    min="40"
                    max={Math.max(1000, originalKB)}
                    step="10"
                    value={targetKB}
                    onChange={(e) => setTargetKB(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>40 KB (Extreme)</span>
                    <span>200 KB (Govt Cap)</span>
                    <span>500 KB</span>
                    <span>{Math.max(1000, originalKB)} KB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRunSqueeze}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing...</span>
                  </>
                ) : (
                  <>
                    <Shrink className="w-4 h-4" />
                    <span>Compress PDF to Target</span>
                  </>
                )}
              </button>

              {isProcessing && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/30 transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            {progressText && (
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>{progressText}</span>
              </p>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Compression Complete</span>
                      {result.targetAchieved ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                          Verified Under Target
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                          Best Effort
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Original: {result.originalSizeKB} KB ➔ Compressed: <strong className="text-emerald-400">{result.compressedSizeKB} KB</strong> ({result.reductionPercentage}% reduction)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed PDF</span>
                </button>
              </div>

              {/* Warning if target exceeded */}
              {result.warning && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{result.warning}</span>
                </div>
              )}

              {/* Verified Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Initial Size</p>
                  <p className="text-sm font-bold text-slate-300 mt-0.5 font-mono">{result.originalSizeKB} KB</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Export Size</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">{result.compressedSizeKB} KB</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Reduction</p>
                  <p className="text-sm font-bold text-white mt-0.5 font-mono">-{result.reductionPercentage}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Total Pages</p>
                  <p className="text-sm font-bold text-indigo-400 mt-0.5 font-mono">{result.numPages} Pages</p>
                </div>
              </div>

              {/* First Page Visual Preview */}
              {result.firstPagePreviewUrl && (
                <div className="pt-2">
                  <p className="text-xs text-slate-400 font-medium mb-2">Compressed Page Preview:</p>
                  <div className="max-w-[200px] aspect-[3/4] bg-white rounded-xl overflow-hidden border border-slate-700 p-2 shadow-inner">
                    <img
                      src={result.firstPagePreviewUrl}
                      alt="Compressed Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
