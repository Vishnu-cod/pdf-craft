import React, { useEffect, useRef, useState } from 'react';
import {
  getPageTextLines,
  computeLineDiff,
  PageDiffResult,
} from '../utils/contractDiff';
import {
  loadPDFDocument,
  renderPageToCanvas,
} from '../utils/pdfEngine';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  GitCompare,
  Sliders,
  FileText,
  Columns,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Loader2,
  UploadCloud,
  FileUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContractDiffViewProps {
  initialPdfBytes?: ArrayBuffer;
  initialFileName?: string;
  onFileV1Loaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const ContractDiffView: React.FC<ContractDiffViewProps> = ({
  initialPdfBytes,
  initialFileName = 'Original Document.pdf',
  onFileV1Loaded,
}) => {
  const [bytesV1, setBytesV1] = useState<ArrayBuffer | null>(initialPdfBytes || null);
  const [nameV1, setNameV1] = useState<string>(initialPdfBytes ? initialFileName : 'No original loaded');

  const [bytesV2, setBytesV2] = useState<ArrayBuffer | null>(null);
  const [nameV2, setNameV2] = useState<string>('No revision loaded');

  // Keep bytesV1 updated if initialPdfBytes prop updates
  useEffect(() => {
    if (initialPdfBytes) {
      setBytesV1(initialPdfBytes);
      setNameV1(initialFileName || 'Original Document.pdf');
    }
  }, [initialPdfBytes, initialFileName]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'visual-slider' | 'text-diff'>('side-by-side');
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100

  const [diffResult, setDiffResult] = useState<PageDiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Canvases for Slider & Side-by-side
  const canvasV1Ref = useRef<HTMLCanvasElement | null>(null);
  const canvasV2Ref = useRef<HTMLCanvasElement | null>(null);
  const canvasSide1Ref = useRef<HTMLCanvasElement | null>(null);
  const canvasSide2Ref = useRef<HTMLCanvasElement | null>(null);

  const isDraggingSlider = useRef(false);

  // Generate original v1 contract helper
  const generateSampleV1Bytes = async (): Promise<ArrayBuffer> => {
    const doc = await PDFDocument.create();
    const page1 = doc.addPage([600, 750]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    page1.drawText("CONSULTING SERVICES AGREEMENT (ORIGINAL)", {
      x: 50,
      y: 690,
      size: 18,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.4),
    });

    page1.drawText("Date: November 19, 2026   |   Document ID: AGR-88219-ORIGINAL", {
      x: 50,
      y: 665,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.5),
    });

    page1.drawLine({
      start: { x: 50, y: 650 },
      end: { x: 550, y: 650 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.85),
    });

    const originalBody = [
      "1. SCOPE OF SERVICES",
      "The Provider agrees to furnish client-side digital infrastructure consulting and web system",
      "design services with 100% privacy and zero external server reliance.",
      "",
      "2. COMPENSATION & FEE SCHEDULE",
      "Service Item                         Hours       Rate ($/hr)      Total ($)",
      "----------------------------------------------------------------------------",
      "Architecture & System Design          16           $120.00         $1,920.00",
      "Canvas & PDF Engine Integration       24           $120.00         $2,880.00",
      "Client-Side Cryptographic Audit       10           $130.00         $1,300.00",
      "----------------------------------------------------------------------------",
      "ESTIMATED TOTAL                                                   $6,100.00",
      "",
      "3. CONFIDENTIALITY & DATA PROTECTION",
      "Neither party shall disclose confidential records, bank credentials, or tax identifications.",
      "Confidential Tax ID: 88-3920194 (Protected by Non-Disclosure Agreement)",
      "",
      "4. ACCEPTANCE & SIGNATURES",
      "By signing below, the parties agree to all terms outlined in this document.",
      "",
      "Client Authorized Representative: _______________________",
      "Signature:                                        Date: ",
    ];

    let currentY = 620;
    for (const line of originalBody) {
      const isHeader = line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.");
      page1.drawText(line, {
        x: 50,
        y: currentY,
        size: isHeader ? 11 : 9.5,
        font: isHeader ? fontBold : font,
        color: isHeader ? rgb(0.1, 0.15, 0.3) : rgb(0.2, 0.25, 0.3),
      });
      currentY -= 17;
    }

    const v1Bytes = await doc.save();
    return v1Bytes.buffer as ArrayBuffer;
  };

  // Load sample revision (V2) with realistic contract modifications!
  const handleLoadSampleV2 = async () => {
    setIsLoading(true);
    try {
      const doc = await PDFDocument.create();
      const page1 = doc.addPage([600, 750]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      page1.drawText("CONSULTING SERVICES AGREEMENT (REVISED)", {
        x: 50,
        y: 690,
        size: 18,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.4),
      });

      page1.drawText("Date: November 20, 2026   |   Document ID: AGR-88219-REV2", {
        x: 50,
        y: 665,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.5),
      });

      page1.drawLine({
        start: { x: 50, y: 650 },
        end: { x: 550, y: 650 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.85),
      });

      const modifiedBody = [
        "1. SCOPE OF SERVICES (AMENDED)",
        "The Provider agrees to furnish client-side digital infrastructure consulting and web system",
        "design services with 100% privacy and continuous 24/7 dedicated support.",
        "",
        "2. COMPENSATION & FEE SCHEDULE (Altered Rates)",
        "Service Item                         Hours       Rate ($/hr)      Total ($)",
        "----------------------------------------------------------------------------",
        "Architecture & System Design          16           $160.00         $2,560.00",
        "Canvas & PDF Engine Integration       24           $160.00         $3,840.00",
        "Client-Side Cryptographic Audit       10           $150.00         $1,500.00",
        "NEW: Urgent Expedited Delivery Fee     1           $500.00           $500.00",
        "----------------------------------------------------------------------------",
        "REVISED TOTAL                                                     $8,400.00",
        "",
        "3. CONFIDENTIALITY & DATA PROTECTION",
        "Neither party shall disclose confidential records, bank credentials, or tax identifications.",
        "Confidential Tax ID: 88-3920194 (Test Redaction Area)",
        "",
        "4. PAYMENT PENALTIES & LATE CLAUSES (Sneaky Addition)",
        "A late interest penalty of 8.5% compounded weekly shall apply to invoices past 5 days.",
        "",
        "5. ACCEPTANCE & SIGNATURES",
        "By signing below, the parties agree to all terms outlined in this document.",
        "",
        "Client Authorized Representative: _______________________",
        "Signature:                                        Date: ",
      ];

      let currentY = 620;
      for (const line of modifiedBody) {
        const isHeader = line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || line.startsWith("5.");
        page1.drawText(line, {
          x: 50,
          y: currentY,
          size: isHeader ? 11 : 9.5,
          font: isHeader ? fontBold : font,
          color: isHeader ? rgb(0.1, 0.15, 0.3) : rgb(0.2, 0.25, 0.3),
        });
        currentY -= 17;
      }

      const v2Bytes = await doc.save();
      const arr2 = v2Bytes.buffer as ArrayBuffer;
      setBytesV2(arr2);
      setNameV2("revised_contract_v2.pdf");
      confetti({ particleCount: 30, spread: 50 });
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Load BOTH sample contracts (Original vs Revision)
  const handleLoadSampleContracts = async () => {
    setIsLoading(true);
    try {
      const v1Arr = await generateSampleV1Bytes();
      setBytesV1(v1Arr);
      setNameV1("sample_agreement_v1.pdf");
      if (onFileV1Loaded) {
        const blob1 = new Blob([v1Arr], { type: 'application/pdf' });
        onFileV1Loaded(new File([blob1], 'sample_agreement_v1.pdf', { type: 'application/pdf' }), v1Arr);
      }

      await handleLoadSampleV2();
      confetti({ particleCount: 45, spread: 60 });
    } finally {
      setIsLoading(false);
    }
  };

  // Run diff & canvas renders when documents or page change
  useEffect(() => {
    if (!bytesV1 || !bytesV2) return;

    let isCancelled = false;
    const runDiff = async () => {
      setIsLoading(true);
      try {
        const [doc1, doc2] = await Promise.all([
          loadPDFDocument(bytesV1),
          loadPDFDocument(bytesV2),
        ]);

        const maxPages = Math.max(doc1.numPages, doc2.numPages);
        if (!isCancelled) setTotalPages(maxPages);

        // 1. Text Diff Calculation
        const [lines1, lines2] = await Promise.all([
          getPageTextLines(bytesV1, currentPage),
          getPageTextLines(bytesV2, currentPage),
        ]);
        const result = computeLineDiff(lines1, lines2);
        if (!isCancelled) setDiffResult(result);

        // 2. Render Slider Canvases
        if (canvasV1Ref.current && currentPage <= doc1.numPages) {
          await renderPageToCanvas(doc1, currentPage, canvasV1Ref.current, 1.2);
        }
        if (canvasV2Ref.current && currentPage <= doc2.numPages) {
          await renderPageToCanvas(doc2, currentPage, canvasV2Ref.current, 1.2);
        }

        // 3. Render Side-by-Side Canvases
        if (canvasSide1Ref.current && currentPage <= doc1.numPages) {
          await renderPageToCanvas(doc1, currentPage, canvasSide1Ref.current, 1.2);
        }
        if (canvasSide2Ref.current && currentPage <= doc2.numPages) {
          await renderPageToCanvas(doc2, currentPage, canvasSide2Ref.current, 1.2);
        }
      } catch (err) {
        console.error('Diff render error', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    runDiff();
    return () => {
      isCancelled = true;
    };
  }, [bytesV1, bytesV2, currentPage, diffMode]);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              <span>Contract & Version Diff</span>
            </h3>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
              $0 Forever
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automatic &quot;Spot the Difference&quot; between two versions of the same document.
          </p>
        </div>

        {/* Action / Sample */}
        {(!bytesV1 || !bytesV2) && (
          <button
            onClick={handleLoadSampleContracts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Test Sample Contracts (1-Click)</span>
          </button>
        )}
      </div>

      {/* Explanatory Guide Box: Clear & Simple for Users */}
      <div className="mt-5 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold text-indigo-200">
              What is this feature and why use it?
            </p>
            <p className="text-slate-300 leading-relaxed">
              When a client, landlord, or employer sends you a <span className="text-white font-medium">&quot;revised contract&quot;</span> to sign, you normally have to read all 10 pages line-by-line to check if they changed your salary, added penalty fees, or removed terms.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <p className="font-semibold text-white mb-0.5">1. Catch Sneaky Edits</p>
                <p className="text-slate-400">Instantly spots if prices, dates, or legal clauses were altered behind your back.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <p className="font-semibold text-emerald-300 mb-0.5">2. Green = Added Lines</p>
                <p className="text-slate-400">Any new paragraph or fee inserted into the revised document is highlighted in green (+).</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <p className="font-semibold text-rose-300 mb-0.5">3. Red = Deleted Text</p>
                <p className="text-slate-400">Any sentence deleted or removed from the original is shown in red with a strikethrough (-).</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {/* V1 Slot */}
        <div className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
          bytesV1 ? 'bg-slate-950/60 border-slate-800' : 'bg-indigo-950/20 border-indigo-500/30'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
              bytesV1 ? 'bg-slate-800 text-slate-300' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              v1
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200">1. Original Contract</p>
              <p className="text-[11px] font-mono truncate text-slate-400">
                {bytesV1 ? nameV1 : 'No document uploaded yet'}
              </p>
            </div>
          </div>
          <label className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            bytesV1
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
          }`}>
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{bytesV1 ? 'Change' : 'Upload v1'}</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setNameV1(file.name);
                  const arr = await file.arrayBuffer();
                  setBytesV1(arr);
                  onFileV1Loaded?.(file, arr);
                }
              }}
            />
          </label>
        </div>

        {/* V2 Slot */}
        <div className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
          bytesV2 ? 'bg-slate-950/60 border-slate-800' : 'bg-indigo-950/20 border-indigo-500/30'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
              bytesV2 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              v2
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200">2. Revised Contract</p>
              <p className="text-[11px] font-mono truncate text-slate-400">
                {bytesV2 ? nameV2 : 'No revision uploaded yet'}
              </p>
            </div>
          </div>
          <label className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
            bytesV2
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
          }`}>
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{bytesV2 ? 'Change' : 'Upload v2'}</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setNameV2(file.name);
                  setBytesV2(await file.arrayBuffer());
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Main Diff Area */}
      {bytesV1 && bytesV2 ? (
        <div className="mt-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDiffMode('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  diffMode === 'side-by-side'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setDiffMode('visual-slider')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  diffMode === 'visual-slider'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Curtain Slider</span>
              </button>
              <button
                onClick={() => setDiffMode('text-diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  diffMode === 'text-diff'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text & Clause Diff</span>
              </button>
            </div>

            {/* Change Counts */}
            {diffResult && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  {diffResult.addedCount} additions
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-mono font-medium">
                  <Minus className="w-3.5 h-3.5" />
                  {diffResult.removedCount} deletions
                </span>
              </div>
            )}

            {/* Page Nav */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-indigo-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Comparing documents...</span>
            </div>
          )}

          {/* View Mode 1: Side-by-Side (Always reliable!) */}
          <div className={diffMode === 'side-by-side' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* V1 Side */}
              <div className="flex flex-col items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-slate-300">Original (v1)</span>
                  <span className="text-slate-500 font-mono text-[11px] truncate max-w-[150px]">{nameV1}</span>
                </div>
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-slate-700 max-w-full">
                  <canvas ref={canvasSide1Ref} className="block max-w-full h-auto" />
                </div>
              </div>

              {/* V2 Side */}
              <div className="flex flex-col items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-indigo-400">Revised (v2)</span>
                  <span className="text-indigo-400/70 font-mono text-[11px] truncate max-w-[150px]">{nameV2}</span>
                </div>
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-slate-700 max-w-full">
                  <canvas ref={canvasSide2Ref} className="block max-w-full h-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* View Mode 2: Visual Curtain Slider */}
          <div className={diffMode === 'visual-slider' ? 'flex flex-col items-center' : 'hidden'}>
            <p className="text-[11px] text-slate-400 mb-3">
              Drag the slider handle horizontally to reveal v1 (left) over v2 (right):
            </p>
            <div
              onMouseDown={() => (isDraggingSlider.current = true)}
              onMouseUp={() => (isDraggingSlider.current = false)}
              onMouseLeave={() => (isDraggingSlider.current = false)}
              onMouseMove={handleSliderMove}
              className="relative overflow-hidden rounded-xl border border-slate-700 bg-white shadow-2xl cursor-ew-resize select-none max-w-full"
              style={{ width: '600px', minHeight: '650px' }}
            >
              {/* Background Canvas: V2 */}
              <canvas ref={canvasV2Ref} className="block w-full h-auto" />

              {/* Clipped Canvas: V1 */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-indigo-500 shadow-2xl"
                style={{ width: `${sliderPos}%` }}
              >
                <canvas ref={canvasV1Ref} className="block w-[600px] max-w-none h-auto" />
              </div>

              {/* Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <Sliders className="w-4 h-4" />
              </div>

              {/* Corner Labels */}
              <span className="absolute top-3 left-3 bg-slate-900/80 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 pointer-events-none">
                Original (v1)
              </span>
              <span className="absolute top-3 right-3 bg-indigo-900/80 text-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-700 pointer-events-none">
                Revised (v2)
              </span>
            </div>
          </div>

          {/* View Mode 3: Text & Clause Diff */}
          <div className={diffMode === 'text-diff' ? 'block' : 'hidden'}>
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto max-h-[600px] divide-y divide-slate-800/40">
              {diffResult && diffResult.diffs.length > 0 ? (
                diffResult.diffs.map((d, idx) => (
                  <div
                    key={idx}
                    className={`py-2 px-3 rounded flex items-start gap-2.5 transition ${
                      d.type === 'added'
                        ? 'bg-emerald-950/40 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                        : d.type === 'removed'
                        ? 'bg-rose-950/40 text-rose-400 line-through border-l-2 border-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="font-bold select-none text-[11px] w-3">
                      {d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{d.text}</span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500">
                  No text differences found on this page.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-8 sm:p-12 text-center rounded-3xl bg-slate-950/60 border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/50 transition">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <GitCompare className="w-7 h-7" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">
            {!bytesV1 && !bytesV2
              ? 'Upload Two Versions of a Document to Compare'
              : !bytesV1
              ? 'Upload Original Document (v1)'
              : 'Upload Revised Document (v2)'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Compare word-by-word differences, rate changes, penalty clauses, and sneaky additions with an interactive curtain slider & side-by-side view.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!bytesV1 && (
              <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Original (v1)</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setNameV1(file.name);
                      const arr = await file.arrayBuffer();
                      setBytesV1(arr);
                      onFileV1Loaded?.(file, arr);
                    }
                  }}
                />
              </label>
            )}

            {!bytesV2 && (
              <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Revised (v2)</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setNameV2(file.name);
                      setBytesV2(await file.arrayBuffer());
                    }
                  }}
                />
              </label>
            )}

            <button
              onClick={handleLoadSampleContracts}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isLoading ? 'Generating Samples...' : '⚡ Test With Sample Contracts'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
