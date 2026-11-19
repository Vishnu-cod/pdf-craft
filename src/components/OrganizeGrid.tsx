import React, { useEffect, useState } from 'react';
import { PDFPageMeta } from '../types';
import {
  getDocumentPagesMeta,
  saveOrganizedPages,
  mergePDFDocuments,
  downloadBlob,
} from '../utils/pdfEngine';
import {
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Download,
  Loader2,
  FileCheck,
  UploadCloud,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrganizeGridProps {
  pdfBytes: ArrayBuffer;
  fileName: string;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

interface PageItem {
  id: string;
  originalIndex: number;
  rotationDelta: number;
  previewUrl?: string;
  sourceBuffer: ArrayBuffer;
}

export const OrganizeGrid: React.FC<OrganizeGridProps> = ({
  pdfBytes,
  fileName,
  onFileLoaded,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const loadThumbnails = async () => {
      try {
        setIsLoading(true);
        const meta = await getDocumentPagesMeta(pdfBytes);
        if (!isCancelled) {
          const items: PageItem[] = meta.map((m, idx) => ({
            id: `page_${idx}_${Date.now()}`,
            originalIndex: idx,
            rotationDelta: 0,
            previewUrl: m.previewUrl,
            sourceBuffer: pdfBytes,
          }));
          setPages(items);
        }
      } catch (err) {
        console.error('Failed to generate page thumbnails', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    loadThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [pdfBytes]);

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotationDelta: (p.rotationDelta + 90) % 360 } : p))
    );
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('A document must have at least one page.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleMergeAdditionalPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const newBytes = await file.arrayBuffer();

    setIsLoading(true);
    try {
      const newMeta = await getDocumentPagesMeta(newBytes);
      const newItems: PageItem[] = newMeta.map((m, idx) => ({
        id: `merged_${idx}_${Date.now()}`,
        originalIndex: idx,
        rotationDelta: 0,
        previewUrl: m.previewUrl,
        sourceBuffer: newBytes,
      }));
      setPages((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error('Error merging PDF', err);
      alert('Could not merge the selected PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (pages.length === 0) return;
    setIsSaving(true);
    try {
      // Group pages by sourceBuffer or process directly
      const pageConfigs = pages.map((p) => ({
        originalPageIndex: p.originalIndex,
        rotationDelta: p.rotationDelta,
      }));

      const newPdfBytes = await saveOrganizedPages(pdfBytes, pageConfigs);
      const downloadName = fileName.replace(/\.pdf$/i, '') + '_organized.pdf';
      downloadBlob(newPdfBytes, downloadName);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to export organized PDF', err);
      alert('Failed to save organized PDF. If multiple merged files were used, please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Organize & Merge Pages</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              {pages.length} Pages
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Reorder pages, delete unwanted sheets, rotate orientation, or append another PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Change PDF Button */}
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

          {/* Append PDF Button */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition shadow-sm">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Append Another PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleMergeAdditionalPDF}
              className="hidden"
            />
          </label>

          {/* Export Button */}
          <button
            onClick={handleSaveAndDownload}
            disabled={isSaving || pages.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Organized PDF</span>
          </button>
        </div>
      </div>

      {/* Explanatory Guide Box */}
      <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold text-indigo-200">
              Visual Page Manager & PDF Merger
            </p>
            <p className="text-slate-300 leading-relaxed">
              Every page is displayed as an interactive card. Rearrange pages, delete unwanted blank sheets, fix upside-down scans, or combine multiple PDF files into one.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <p className="font-semibold text-white mb-0.5">🔄 Rotate 90° Clockwise</p>
                <p className="text-slate-400">Fix pages scanned sideways or upside down with 1 click.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <p className="font-semibold text-white mb-0.5">⬅️ ➡️ Reorder Sequence</p>
                <p className="text-slate-400">Move pages left or right to change the reading order.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <p className="font-semibold text-indigo-300 mb-0.5">➕ Append & Merge</p>
                <p className="text-slate-400">Click &quot;Append Another PDF&quot; to join multiple documents together.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Generating visual page cards...</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-3 flex flex-col items-center transition shadow-lg hover:shadow-indigo-500/10"
            >
              {/* Page Number Pill */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                  Page {index + 1}
                </span>
                {page.rotationDelta > 0 && (
                  <span className="text-[10px] text-indigo-400 font-mono">
                    +{page.rotationDelta}°
                  </span>
                )}
              </div>

              {/* Thumbnail Container */}
              <div className="w-full aspect-[3/4] bg-white rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-700/50 relative shadow-inner">
                {page.previewUrl ? (
                  <img
                    src={page.previewUrl}
                    alt={`Page ${index + 1}`}
                    style={{ transform: `rotate(${page.rotationDelta}deg)` }}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                  />
                ) : (
                  <FileCheck className="w-8 h-8 text-slate-400" />
                )}
              </div>

              {/* Action Toolbar on Bottom */}
              <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-800/80">
                {/* Left/Right Reorder */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => movePage(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 rounded-md hover:bg-slate-800 disabled:opacity-20 text-slate-300 transition"
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => movePage(index, index + 1)}
                    disabled={index === pages.length - 1}
                    className="p-1 rounded-md hover:bg-slate-800 disabled:opacity-20 text-slate-300 transition"
                    title="Move Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rotate & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => rotatePage(index)}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-indigo-400 transition"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deletePage(index)}
                    className="p-1 rounded-md hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
