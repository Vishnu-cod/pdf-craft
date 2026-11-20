import React, { useState, useEffect, useMemo } from 'react';
import {
  getDocumentPagesMeta,
  splitPDFToIndividualPages,
  extractPDFPageRanges,
  splitPDFEveryNPages,
  createSplitZip,
  downloadBlob,
  SplitResultFile,
} from '../utils/pdfEngine';
import { PDFPageMeta } from '../types';
import {
  Scissors,
  Download,
  Loader2,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SplitPanelProps {
  pdfBytes?: ArrayBuffer;
  fileName?: string;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

type SplitMode = 'individual' | 'range' | 'every_n' | 'select';

export const SplitPanel: React.FC<SplitPanelProps> = ({
  pdfBytes,
  fileName = 'document.pdf',
  onFileLoaded,
}) => {
  const [mode, setMode] = useState<SplitMode>('individual');
  const [rangeInput, setRangeInput] = useState('1-2, 3-4');
  const [everyN, setEveryN] = useState<number>(2);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const [pagesMeta, setPagesMeta] = useState<PDFPageMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<SplitResultFile[] | null>(null);

  // Load document pages and metadata
  useEffect(() => {
    if (!pdfBytes) return;
    let isCancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        setGeneratedFiles(null);
        const meta = await getDocumentPagesMeta(pdfBytes);
        if (!isCancelled) {
          setPagesMeta(meta);
          // Default range example based on document length
          if (meta.length > 2) {
            const mid = Math.ceil(meta.length / 2);
            setRangeInput(`1-${mid}, ${mid + 1}-${meta.length}`);
          } else {
            setRangeInput('1, 2');
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to parse PDF pages for splitting', err);
          setErrorMsg('Could not read PDF pages. Please verify that the file is not corrupted or password-protected.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [pdfBytes]);

  const totalPages = pagesMeta.length;

  // Parse and validate custom ranges (e.g. "1-3, 4-6, 7-10" or "1, 3, 5-8")
  const parsedRanges = useMemo(() => {
    if (mode !== 'range' || totalPages === 0) return { valid: false, ranges: [], error: null };
    const parts = rangeInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) {
      return { valid: false, ranges: [], error: 'Please enter at least one page number or range.' };
    }

    const ranges: { name: string; pageIndices: number[] }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          return { valid: false, ranges: [], error: `Invalid range: "${part}". Format should be e.g. "1-3".` };
        }
        if (start < 1) {
          return { valid: false, ranges: [], error: `Page number ${start} is invalid. PDF pages start at 1.` };
        }
        if (end > totalPages) {
          return { valid: false, ranges: [], error: `Page ${end} exceeds total document length (${totalPages} pages).` };
        }
        if (start > end) {
          return { valid: false, ranges: [], error: `Invalid range "${part}": Start page (${start}) cannot be greater than end page (${end}).` };
        }

        const indices: number[] = [];
        for (let p = start; p <= end; p++) {
          indices.push(p - 1); // 0-based
        }
        ranges.push({ name: `pages_${start}-${end}`, pageIndices: indices });
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum)) {
          return { valid: false, ranges: [], error: `Invalid page number: "${part}".` };
        }
        if (pageNum < 1 || pageNum > totalPages) {
          return { valid: false, ranges: [], error: `Page ${pageNum} is out of range. Document has ${totalPages} pages.` };
        }
        ranges.push({ name: `page_${pageNum}`, pageIndices: [pageNum - 1] });
      }
    }

    return { valid: true, ranges, error: null };
  }, [mode, rangeInput, totalPages]);

  // Handle page toggle in visual select mode
  const togglePageSelect = (pageIdx: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIdx)) {
        next.delete(pageIdx);
      } else {
        next.add(pageIdx);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    const all = new Set<number>();
    for (let i = 0; i < totalPages; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearSelectedPages = () => {
    setSelectedPages(new Set());
  };

  // Execute Split Operation
  const handleExecuteSplit = async () => {
    if (!pdfBytes || totalPages === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setGeneratedFiles(null);

    try {
      let results: SplitResultFile[] = [];

      if (mode === 'individual') {
        results = await splitPDFToIndividualPages(pdfBytes, fileName, (curr, total) => {
          setProgressMsg(`Extracting page ${curr} of ${total}...`);
        });
      } else if (mode === 'range') {
        if (!parsedRanges.valid) {
          setErrorMsg(parsedRanges.error || 'Please enter valid page ranges.');
          setIsProcessing(false);
          return;
        }
        results = await extractPDFPageRanges(pdfBytes, parsedRanges.ranges, fileName, (curr, total) => {
          setProgressMsg(`Generating file ${curr} of ${total}...`);
        });
      } else if (mode === 'every_n') {
        if (everyN < 1) {
          setErrorMsg('Please specify at least 1 page per split.');
          setIsProcessing(false);
          return;
        }
        results = await splitPDFEveryNPages(pdfBytes, everyN, fileName, (curr, total) => {
          setProgressMsg(`Processing chunk ${curr} of ${total}...`);
        });
      } else if (mode === 'select') {
        if (selectedPages.size === 0) {
          setErrorMsg('Please click on at least one page thumbnail to extract.');
          setIsProcessing(false);
          return;
        }
        const sortedIndices = Array.from(selectedPages).sort((a, b) => a - b);
        results = await extractPDFPageRanges(
          pdfBytes,
          [{ name: `selected_${sortedIndices.length}_pages`, pageIndices: sortedIndices }],
          fileName
        );
      }

      setGeneratedFiles(results);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error('Split failed:', err);
      setErrorMsg(err?.message || 'Failed to split document. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Download all files as a ZIP archive
  const handleDownloadZip = async () => {
    if (!generatedFiles || generatedFiles.length === 0) return;
    const zipBlob = await createSplitZip(generatedFiles);
    const zipName = fileName.replace(/\.pdf$/i, '') + '_split_archive.zip';
    downloadBlob(zipBlob, zipName);
  };

  // Download a single file
  const handleDownloadSingle = (file: SplitResultFile) => {
    downloadBlob(file.bytes, file.fileName);
  };

  if (!pdfBytes) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Split PDF & Extract Pages</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Extract individual pages, split by custom ranges (e.g. 1-3, 4-6), or break into parts every N pages. 100% private in-browser.
        </p>
        <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 cursor-pointer transition">
          <UploadCloud className="w-4 h-4" />
          <span>Select PDF to Split</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const bytes = await file.arrayBuffer();
                onFileLoaded?.(file, bytes);
              }
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-400" />
            <span>Split PDF Document</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
              {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a splitting strategy below. Files are processed locally with zero server uploads.
          </p>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition shadow-sm">
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          <span>Change PDF</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const bytes = await file.arrayBuffer();
                onFileLoaded?.(file, bytes);
              }
            }}
          />
        </label>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'individual', title: 'Every Page', desc: '1 PDF per page' },
          { id: 'range', title: 'Custom Ranges', desc: 'e.g. 1-3, 4-6' },
          { id: 'every_n', title: 'Every N Pages', desc: 'Fixed intervals' },
          { id: 'select', title: 'Visual Picker', desc: 'Click to select' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id as SplitMode);
              setGeneratedFiles(null);
              setErrorMsg(null);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              mode === m.id
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <p className="text-xs font-bold text-white">{m.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Mode Configuration Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {mode === 'individual' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Split Into Individual Single-Page PDFs</h3>
            <p className="text-xs text-slate-400">
              This document ({totalPages} pages) will be extracted into {totalPages} individual PDF files ({fileName.replace(/\.pdf$/i, '')}_page_1.pdf ...).
            </p>
          </div>
        )}

        {mode === 'range' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Specify Page Ranges</h3>
            <p className="text-xs text-slate-400">
              Enter comma-separated page ranges or numbers. Each range generates a separate PDF document.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-3, 4-6, 7-10"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 outline-none"
              />
              <span className="text-[11px] text-slate-400 font-mono">
                Total available: {totalPages} pages
              </span>
            </div>

            {parsedRanges.error && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parsedRanges.error}</span>
              </div>
            )}

            {parsedRanges.valid && (
              <div className="text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Will generate {parsedRanges.ranges.length} separate PDF documents.</span>
              </div>
            )}
          </div>
        )}

        {mode === 'every_n' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Split Document Every N Pages</h3>
            <p className="text-xs text-slate-400">
              Automatically breaks the PDF into chunks of N pages.
            </p>
            <div className="flex items-center gap-3">
              <label htmlFor="every-n-input" className="text-xs text-slate-300 font-medium">Pages per document:</label>
              <input
                id="every-n-input"
                type="number"
                min="1"
                max={Math.max(1, totalPages)}
                value={everyN}
                onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono text-center outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">
                ➔ Will generate {Math.ceil(totalPages / Math.max(1, everyN))} PDF files
              </span>
            </div>
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Visual Page Selector</h3>
                <p className="text-xs text-slate-400">
                  Click pages to extract. Selected pages ({selectedPages.size} of {totalPages}) will be extracted into a new PDF.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelectedPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Thumbnail Grid for Visual Selection */}
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                <p className="text-xs">Loading page previews...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-1">
                {pagesMeta.map((p, idx) => {
                  const isSelected = selectedPages.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePageSelect(idx)}
                      className={`relative cursor-pointer rounded-xl border-2 p-1.5 transition flex flex-col items-center ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-full aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center relative">
                        {p.previewUrl ? (
                          <img src={p.previewUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Page {idx + 1}</span>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono mt-1 text-slate-300">
                        Page {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleExecuteSplit}
            disabled={isProcessing || (mode === 'range' && !parsedRanges.valid)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progressMsg || 'Processing split...'}</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>Execute Split &amp; Generate Files</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Resulting Files & Download Box */}
      {generatedFiles && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Split Completed Successfully!
                </h3>
                <p className="text-xs text-slate-400">
                  {generatedFiles.length} {generatedFiles.length === 1 ? 'file' : 'files'} generated ready for download.
                </p>
              </div>
            </div>

            {generatedFiles.length > 1 && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Download All as ZIP Archive</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
            {generatedFiles.map((file, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-slate-500 text-[11px]">#{idx + 1}</span>
                  <span className="font-semibold text-slate-200 truncate">{file.fileName}</span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({Math.round(file.bytes.length / 1024)} KB)
                  </span>
                </div>

                <button
                  onClick={() => handleDownloadSingle(file)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
