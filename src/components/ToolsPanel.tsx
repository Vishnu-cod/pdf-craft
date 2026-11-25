import React, { useEffect, useRef, useState } from 'react';
import { ExtractedTable } from '../types';
import {
  extractTableFromPage,
  exportTableToExcel,
  exportTableToCSV,
} from '../utils/tableExtractor';
import {
  enhanceCanvas,
  DoctorSettings,
} from '../utils/documentDoctor';
import {
  renderPageToCanvas,
  loadPDFDocument,
  downloadBlob,
} from '../utils/pdfEngine';
import { ContractDiffView } from './ContractDiffView';
import { ContractRiskRadar } from './ContractRiskRadar';
import { SizeSqueezer } from './SizeSqueezer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Table2,
  Wand2,
  GitCompare,
  Download,
  Copy,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Scale,
  Shrink,
  UploadCloud,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_INVOICE_TABLE: ExtractedTable = {
  headers: ['Date', 'Item Description', 'Category', 'Invoice #', 'Amount (USD)', 'Status'],
  rows: [
    ['2026-11-01', 'Cloud Infrastructure Compute', 'DevOps / Hosting', 'INV-84920', '$420.00', 'Paid'],
    ['2026-11-04', 'Corporate Domain SSL Renewal', 'IT Security', 'INV-84931', '$35.00', 'Paid'],
    ['2026-11-08', 'Vector Graphics License', 'Design Tool', 'INV-84955', '$199.00', 'Paid'],
    ['2026-11-12', 'Digital Marketing & SEO Campaign', 'Client Growth', 'INV-85012', '$1,250.00', 'Cleared'],
    ['2026-11-15', 'Client Retainer Retransmission', 'Professional Services', 'INV-85044', '$3,400.00', 'Settled'],
  ],
};

interface ToolsPanelProps {
  pdfBytes?: ArrayBuffer;
  fileName?: string;
  initialSubTool?: 'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor';
  initialTargetKB?: number;
  routeTitle?: string;
  routeSubtitle?: string;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  pdfBytes,
  fileName = 'document.pdf',
  initialSubTool = 'risk-radar',
  initialTargetKB,
  routeTitle,
  routeSubtitle,
  onFileLoaded,
}) => {
  const [subTool, setSubTool] = useState<
    'risk-radar' | 'size-squeezer' | 'diff' | 'table-extract' | 'doctor'
  >(initialSubTool);

  const [activePdfBytes, setActivePdfBytes] = useState<ArrayBuffer | undefined>(pdfBytes);
  const [activeFileName, setActiveFileName] = useState<string>(fileName);

  useEffect(() => {
    if (pdfBytes) {
      setActivePdfBytes(pdfBytes);
      setActiveFileName(fileName || 'document.pdf');
    }
  }, [pdfBytes, fileName]);

  const handleInternalFileLoad = (file: File, bytes: ArrayBuffer) => {
    setActivePdfBytes(bytes);
    setActiveFileName(file.name);
    if (onFileLoaded) {
      onFileLoaded(file, bytes);
    }
  };

  useEffect(() => {
    if (initialSubTool) {
      setSubTool(initialSubTool);
    }
  }, [initialSubTool]);

  // Table Extractor state
  const [tablePage, setTablePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [extractedData, setExtractedData] = useState<ExtractedTable | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Document Doctor state
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>({
    brightness: 15,
    contrast: 35,
    whitenBackground: true,
    grayscale: false,
    threshold: 128,
  });
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Initialize total pages
  useEffect(() => {
    if (!activePdfBytes) return;
    const initPages = async () => {
      try {
        const doc = await loadPDFDocument(activePdfBytes);
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error('Failed to read PDF pages', err);
      }
    };
    initPages();
  }, [activePdfBytes]);

  // Extract Table on page change
  const handleExtractTable = async (page: number) => {
    if (!activePdfBytes) return;
    setIsExtracting(true);
    try {
      const data = await extractTableFromPage(activePdfBytes, page);
      setExtractedData(data);
    } catch (err) {
      console.error('Table extraction failed', err);
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    if (subTool === 'table-extract' && activePdfBytes) {
      handleExtractTable(tablePage);
    }
  }, [subTool, tablePage, activePdfBytes]);

  // Copy CSV to Clipboard
  const handleCopyCSV = () => {
    if (!extractedData) return;
    const full = [extractedData.headers, ...extractedData.rows];
    const csvContent = full.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    navigator.clipboard.writeText(csvContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Render Document Doctor preview
  useEffect(() => {
    if (subTool !== 'doctor' || !activePdfBytes) return;
    let isCancelled = false;
    const runDoctor = async () => {
      setIsEnhancing(true);
      try {
        const doc = await loadPDFDocument(activePdfBytes);
        if (!sourceCanvasRef.current || !enhancedCanvasRef.current) return;

        // Render original to offscreen / source canvas
        await renderPageToCanvas(doc, doctorPage, sourceCanvasRef.current, 1.2);

        if (!isCancelled) {
          // Apply image processing filters
          enhanceCanvas(sourceCanvasRef.current, enhancedCanvasRef.current, doctorSettings);
        }
      } catch (err) {
        console.error('Doctor rendering failed', err);
      } finally {
        if (!isCancelled) setIsEnhancing(false);
      }
    };
    runDoctor();
    return () => {
      isCancelled = true;
    };
  }, [subTool, doctorPage, doctorSettings, activePdfBytes]);

  // Sample Scan generator for Document Doctor instant test
  const handleLoadSampleDoctor = async () => {
    setIsEnhancing(true);
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([550, 720]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      // Aged yellow/gray paper background tint (simulating dark scanner background)
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 550,
        height: 720,
        color: rgb(0.91, 0.89, 0.84),
      });

      page.drawText("HEALTH CLINIC & LAB - OFFICIAL RECEIPT", {
        x: 40,
        y: 650,
        size: 15,
        font: fontBold,
        color: rgb(0.2, 0.22, 0.25),
      });

      page.drawText("Patient: Jane Doe   |   Date: 19-Nov-2026   |   Rx ID: #98321", {
        x: 40,
        y: 625,
        size: 9.5,
        font: font,
        color: rgb(0.35, 0.35, 0.4),
      });

      page.drawLine({
        start: { x: 40, y: 610 },
        end: { x: 510, y: 610 },
        thickness: 1,
        color: rgb(0.65, 0.65, 0.65),
      });

      const items = [
        "1. Comprehensive Diagnostic Health Screening       $180.00",
        "2. Metabolic Profile Blood Laboratory Analysis       $95.00",
        "3. Prescription Formulation Medication (Generic)     $45.00",
        "",
        "SUBTOTAL                                            $320.00",
        "INSURANCE COVERAGE WAIVER APPLIED                   -$100.00",
        "TOTAL PATIENT OUT-OF-POCKET EXPENSE                 $220.00",
        "",
        "Doctor's Note: Faded carbon paper receipt with scan shadow.",
        "Use Document Doctor to whiten yellowed background & boost faded ink.",
      ];

      let y = 570;
      for (const item of items) {
        const isBold = item.startsWith("TOTAL") || item.startsWith("SUBTOTAL");
        page.drawText(item, {
          x: 40,
          y,
          size: isBold ? 11 : 9.5,
          font: isBold ? fontBold : font,
          color: isBold ? rgb(0.15, 0.15, 0.2) : rgb(0.28, 0.28, 0.32),
        });
        y -= 22;
      }

      const sampleBytes = await doc.save();
      const arr = sampleBytes.buffer as ArrayBuffer;
      const blob = new Blob([arr], { type: 'application/pdf' });
      const sampleFile = new File([blob], 'sample_scanned_receipt.pdf', { type: 'application/pdf' });
      handleInternalFileLoad(sampleFile, arr);
      confetti({ particleCount: 35, spread: 50 });
    } catch (e) {
      console.error('Failed to generate sample scan', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownloadEnhancedImage = () => {
    if (!enhancedCanvasRef.current) return;
    enhancedCanvasRef.current.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `enhanced_page_${doctorPage}.png`);
        confetti({ particleCount: 60, spread: 50 });
      }
    }, 'image/png');
  };

  return (
    <div className="max-w-6xl w-full min-w-0 mx-auto px-3 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
      {/* Sub Tool Switcher — Responsive ArtCraft Hairline Grid (Zero Mobile Overflow) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-line border border-line w-full mb-8">
        <button
          onClick={() => setSubTool('risk-radar')}
          className={`flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] hud-label transition-colors cursor-pointer text-center ${
            subTool === 'risk-radar'
              ? 'bg-invert-bg text-invert-fg font-bold'
              : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
          }`}
        >
          <Scale className="w-4 h-4 shrink-0 text-app-ink" />
          <span className="truncate">Contract Risks</span>
        </button>

        <button
          onClick={() => setSubTool('size-squeezer')}
          className={`flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] hud-label transition-colors cursor-pointer text-center ${
            subTool === 'size-squeezer'
              ? 'bg-invert-bg text-invert-fg font-bold'
              : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
          }`}
        >
          <Shrink className="w-4 h-4 shrink-0 text-app-ink" />
          <span className="truncate">Size Squeezer</span>
        </button>

        <button
          onClick={() => setSubTool('diff')}
          className={`flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] hud-label transition-colors cursor-pointer text-center ${
            subTool === 'diff'
              ? 'bg-invert-bg text-invert-fg font-bold'
              : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
          }`}
        >
          <GitCompare className="w-4 h-4 shrink-0 text-app-ink" />
          <span className="truncate">Compare PDFs</span>
        </button>

        <button
          onClick={() => setSubTool('table-extract')}
          className={`flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] hud-label transition-colors cursor-pointer text-center ${
            subTool === 'table-extract'
              ? 'bg-invert-bg text-invert-fg font-bold'
              : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
          }`}
        >
          <Table2 className="w-4 h-4 shrink-0 text-app-ink" />
          <span className="truncate">PDF Tables</span>
        </button>

        <button
          onClick={() => setSubTool('doctor')}
          className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] hud-label transition-colors cursor-pointer text-center ${
            subTool === 'doctor'
              ? 'bg-invert-bg text-invert-fg font-bold'
              : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
          }`}
        >
          <Wand2 className="w-4 h-4 shrink-0 text-app-ink" />
          <span className="truncate">Scan Doctor</span>
        </button>
      </div>

      {/* Tool 1: AI Contract Risk & Red-Flag Radar */}
      {subTool === 'risk-radar' && (
        <ContractRiskRadar
          initialPdfBytes={activePdfBytes}
          initialFileName={activeFileName}
          onFileLoaded={handleInternalFileLoad}
        />
      )}

      {/* Tool 2: Target Size Squeezer */}
      {subTool === 'size-squeezer' && (
        <SizeSqueezer
          initialPdfBytes={activePdfBytes}
          initialFileName={activeFileName}
          initialTargetKB={initialTargetKB}
          routeTitle={routeTitle}
          routeSubtitle={routeSubtitle}
          onFileLoaded={handleInternalFileLoad}
        />
      )}

      {/* Tool 3: Contract Diff */}
      {subTool === 'diff' && (
        <ContractDiffView
          initialPdfBytes={activePdfBytes}
          initialFileName={activeFileName}
          onFileV1Loaded={handleInternalFileLoad}
        />
      )}

      {/* Tool 4: Table to Excel */}
      {subTool === 'table-extract' && (
        !activePdfBytes && (!extractedData || extractedData.headers.length === 0) ? (
          <div className="max-w-2xl mx-auto py-12 px-6 bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/50 rounded-3xl text-center space-y-4 transition">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Table2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Upload a Document with Tables</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Extract tabular financial data from invoices, bank statements, and tax receipts into clean Excel (.xlsx) files.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>Choose PDF Document</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const bytes = await file.arrayBuffer();
                      handleInternalFileLoad(file, bytes);
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setExtractedData(SAMPLE_INVOICE_TABLE);
                  confetti({ particleCount: 35, spread: 50 });
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>⚡ Test Sample Table (No PDF Needed)</span>
              </button>
            </div>
          </div>
        ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-emerald-400" />
                  <span>Smart Table Extractor</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Zero Paywall
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activePdfBytes ? `Scanning page ${tablePage} of ${activeFileName}` : 'Previewing sample financial invoice data'}
              </p>
            </div>

            {/* Page selection, Upload change & Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activePdfBytes ? 'Change PDF' : 'Upload PDF'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const bytes = await file.arrayBuffer();
                      handleInternalFileLoad(file, bytes);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setExtractedData(SAMPLE_INVOICE_TABLE);
                  confetti({ particleCount: 30, spread: 45 });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Test with realistic invoice and bank statement table data"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Sample Table</span>
              </button>

              {activePdfBytes && totalPages > 1 && (
                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage <= 1}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300 font-mono px-2">
                    Page {tablePage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    disabled={tablePage >= totalPages}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {extractedData && extractedData.headers.length > 0 && extractedData.rows.length > 0 && (
                <>
                  <button
                    onClick={handleCopyCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{isCopied ? 'Copied!' : 'Copy CSV'}</span>
                  </button>

                  <button
                    onClick={() =>
                      exportTableToCSV(
                        extractedData,
                        `${activeFileName.replace(/\.pdf$/i, '')}_page${tablePage}_table.csv`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={() =>
                      exportTableToExcel(
                        extractedData,
                        `${activeFileName.replace(/\.pdf$/i, '')}_page${tablePage}_table.xlsx`
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Explanatory Guide Box */}
          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-emerald-200">
                  What is this feature and why use it?
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Invoices, bank statements, and tax receipts trap tabular financial data inside locked PDF files. Normally, other websites charge $15/month subscriptions to extract tables into Excel.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                    <p className="font-semibold text-white mb-0.5">Auto Row & Column Clustering</p>
                    <p className="text-slate-400">Our engine scans text coordinates on the page and automatically sorts words into clean grid rows and columns.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                    <p className="font-semibold text-emerald-300 mb-0.5">1-Click Excel (.xlsx) & CSV</p>
                    <p className="text-slate-400">Download formatted spreadsheets ready for Excel, Google Sheets, or accounting software without retyping.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Preview Grid */}
          <div className="mt-6 overflow-x-auto">
            {isExtracting ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                <p className="text-xs text-slate-400">Scanning coordinates and grouping rows...</p>
              </div>
            ) : extractedData && extractedData.headers.length > 0 && extractedData.rows.length > 0 ? (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700">
                      {extractedData.headers.map((head, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 font-semibold text-slate-200 uppercase tracking-wider text-[11px]"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {extractedData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/60 transition">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Table2 className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-white">No Table Grid Detected on Page {tablePage}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This document page contains paragraphs, scanned images, or resumes rather than coordinate-based financial grid cells.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setExtractedData(SAMPLE_INVOICE_TABLE);
                      confetti({ particleCount: 30, spread: 45 });
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Load Sample Invoice Table (Test Live Excel Export)</span>
                  </button>
                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition">
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Different PDF</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const bytes = await file.arrayBuffer();
                          handleInternalFileLoad(file, bytes);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* Tool 5: Document Doctor */}
      {subTool === 'doctor' && (
        !activePdfBytes ? (
          <div className="max-w-2xl mx-auto py-12 px-6 bg-slate-900 border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 rounded-3xl text-center space-y-4 transition">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
              <Wand2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Upload a Document for Scan Clean-Up</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Document Doctor whitens dark yellowed paper, removes finger shadows, and boosts faded ink contrast.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>Choose Scanned PDF</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const bytes = await file.arrayBuffer();
                      handleInternalFileLoad(file, bytes);
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={handleLoadSampleDoctor}
                disabled={isEnhancing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{isEnhancing ? 'Generating...' : '⚡ Test With Sample Scan'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <span>Document Doctor</span>
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Scanner Clean-Up
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Removes dirty gray shadows, boosts contrast, and whitens background paper.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                <span>Change Document</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const bytes = await file.arrayBuffer();
                      handleInternalFileLoad(file, bytes);
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setDoctorPage((p) => Math.max(1, p - 1))}
                  disabled={doctorPage <= 1}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-slate-300 font-mono px-2">
                  Page {doctorPage} of {totalPages}
                </span>
                <button
                  onClick={() => setDoctorPage((p) => Math.min(totalPages, p + 1))}
                  disabled={doctorPage >= totalPages}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleDownloadEnhancedImage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Enhanced Page</span>
              </button>
            </div>
          </div>

          {/* Explanatory Guide Box */}
          <div className="mt-5 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-purple-200">
                  What is Document Doctor and why use it?
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Documents photographed on phone cameras or old office scanners often look dark, yellowed, crumpled, or covered in finger shadows.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                    <p className="font-semibold text-white mb-0.5">Paper Whitener & Shadow Eraser</p>
                    <p className="text-slate-400">Pushes off-white and murky gray backgrounds to pure crisp printer paper white (#FFFFFF).</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                    <p className="font-semibold text-purple-300 mb-0.5">Ink Contrast Booster</p>
                    <p className="text-slate-400">Darkens faded ink and text stamps to look like an official crisp 1200 DPI flatbed office scan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filter Sliders & Presets */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-5">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enhancement Controls</span>
              </h4>

              {/* Whiten Background toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-200">Whiten Paper</p>
                  <p className="text-[10px] text-slate-500">Eliminates grayish scan shadows</p>
                </div>
                <input
                  type="checkbox"
                  checked={doctorSettings.whitenBackground}
                  onChange={(e) =>
                    setDoctorSettings((s) => ({ ...s, whitenBackground: e.target.checked }))
                  }
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Grayscale toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-200">Photocopy Grayscale</p>
                  <p className="text-[10px] text-slate-500">Cleans discoloration & ink bleed</p>
                </div>
                <input
                  type="checkbox"
                  checked={doctorSettings.grayscale}
                  onChange={(e) =>
                    setDoctorSettings((s) => ({ ...s, grayscale: e.target.checked }))
                  }
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Contrast slider */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Contrast Boost</span>
                  <span className="font-mono">{doctorSettings.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={doctorSettings.contrast}
                  onChange={(e) =>
                    setDoctorSettings((s) => ({ ...s, contrast: parseInt(e.target.value) }))
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Brightness slider */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono">{doctorSettings.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="80"
                  value={doctorSettings.brightness}
                  onChange={(e) =>
                    setDoctorSettings((s) => ({ ...s, brightness: parseInt(e.target.value) }))
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Reset button */}
              <button
                onClick={() =>
                  setDoctorSettings({
                    brightness: 15,
                    contrast: 35,
                    whitenBackground: true,
                    grayscale: false,
                    threshold: 128,
                  })
                }
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition"
              >
                Reset to Default Preset
              </button>
            </div>

            {/* Live Canvas Preview */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-auto min-h-[400px]">
              <canvas ref={sourceCanvasRef} className="hidden" />
              <canvas
                ref={enhancedCanvasRef}
                className="max-w-full max-h-[500px] object-contain shadow-2xl rounded-sm border border-slate-700"
              />
            </div>
          </div>
        </div>
        )
      )}
    </div>
  );
};
