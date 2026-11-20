import React, { useEffect, useRef, useState } from 'react';
import {
  loadPDFDocument,
  renderPageToCanvas,
  applyAnnotationsAndSave,
  downloadBlob,
} from '../utils/pdfEngine';
import { Annotation } from '../types';
import { SignatureModal } from './SignatureModal';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  PenTool,
  Type,
  Square,
  BookmarkCheck,
  Calendar,
  Download,
  Trash2,
  Move,
  Loader2,
  Sparkles,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Check,
  Plus,
  X,
  Sliders,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditSignViewerProps {
  pdfBytes: ArrayBuffer;
  fileName: string;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
  onResetFile?: () => void;
}

export const EditSignViewer: React.FC<EditSignViewerProps> = ({
  pdfBytes,
  fileName,
  onFileLoaded,
  onResetFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Auto-fit zoom on mobile viewport
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return Math.max(0.5, Math.min(0.9, (window.innerWidth - 32) / 600));
    }
    return 1.2;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  // Canva Mobile UX States
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);
  const [nudgeStep, setNudgeStep] = useState<number>(2); // 1% for fine, 3% for normal

  // Dragging annotations state (Pointer-events based for flawless touch + mouse support)
  const [draggingAnnId, setDraggingAnnId] = useState<string | null>(null);
  const dragStart = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({
    clientX: 0,
    clientY: 0,
    initialX: 0,
    initialY: 0,
  });

  // 1. Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    const initPDF = async () => {
      try {
        setIsLoading(true);
        const doc = await loadPDFDocument(pdfBytes);
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('Failed to parse PDF document', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    initPDF();
    return () => {
      isCancelled = true;
    };
  }, [pdfBytes]);

  // 2. Render Page to Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let isCancelled = false;
    const render = async () => {
      try {
        await renderPageToCanvas(pdfDoc, currentPage, canvasRef.current!, zoom);
      } catch (err) {
        console.error('Page render error', err);
      }
    };
    render();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, zoom]);

  // Add Annotation Helpers
  const addAnnotation = (partial: Partial<Annotation>) => {
    let initialXPct = 30; // percentage 0-100
    let initialYPct = 30;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container && canvas && canvas.height > 0) {
      // Find where user is currently scrolled in view
      const viewCenterY = container.scrollTop + (container.clientHeight / 2);
      const canvasTop = canvas.offsetTop;
      const relativeY = viewCenterY - canvasTop;
      initialYPct = Math.max(5, Math.min(88, (relativeY / canvas.height) * 100));
      initialXPct = 35;
    }

    const newAnn: Annotation = {
      id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      pageIndex: currentPage - 1,
      x: initialXPct,
      y: initialYPct,
      width: partial.width || 150,
      height: partial.height || 50,
      content: partial.content || '',
      type: partial.type || 'text',
      fontSize: partial.fontSize || 16,
      color: partial.color || '#000000',
      ...partial,
    };
    setAnnotations((prev) => [...prev, newAnn]);
    setSelectedAnnId(newAnn.id);
  };

  const handleAddSignature = (signatureDataUrl: string) => {
    addAnnotation({
      type: 'signature',
      content: signatureDataUrl,
      width: 170,
      height: 65,
    });
  };

  const handleAddText = () => {
    addAnnotation({
      type: 'text',
      content: 'Click to edit text',
      width: 150,
      height: 30,
      fontSize: 14,
    });
  };

  const handleAddRedaction = () => {
    addAnnotation({
      type: 'redaction',
      content: 'REDACTED',
      width: 180,
      height: 25,
    });
  };

  const handleAddStamp = (label: string) => {
    addAnnotation({
      type: 'stamp',
      content: label,
      width: 130,
      height: 35,
    });
  };

  const handleAddDate = () => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    addAnnotation({
      type: 'date',
      content: today,
      width: 120,
      height: 25,
      fontSize: 13,
    });
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnId === id) setSelectedAnnId(null);
  };

  // Quick alignment & nudge helpers for selected annotation (1-touch mobile perfection!)
  const jumpToBottom = (id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, x: 60, y: 86 } : a))
    );
  };

  const jumpToTop = (id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, x: 25, y: 10 } : a))
    );
  };

  const jumpToCenter = (id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, x: 35, y: 48 } : a))
    );
  };

  const alignAnnotation = (id: string, xPct: number, yPct: number) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, x: xPct, y: yPct } : a))
    );
  };

  const nudgeAnnotation = (id: string, deltaXPct: number, deltaYPct: number) => {
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newX = Math.max(0, Math.min(92, a.x + deltaXPct));
        const newY = Math.max(0, Math.min(96, a.y + deltaYPct));
        return { ...a, x: newX, y: newY };
      })
    );
  };

  const changeSize = (id: string, delta: number) => {
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newW = Math.max(60, (a.width || 140) + delta);
        const newH = Math.max(25, (a.height || 45) + delta * 0.4);
        return { ...a, width: newW, height: newH };
      })
    );
  };

  const handleFitToScreen = () => {
    if (containerRef.current) {
      const avail = containerRef.current.clientWidth - 32;
      const calc = Math.max(0.45, Math.min(1.6, avail / 612));
      setZoom(calc);
    }
  };

  // 1-Tap Placement on Canvas / Paper (Bulletproof on Mobile Chrome!)
  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.annotation-item') || target.closest('button') || target.closest('input')) {
      return;
    }

    if (selectedAnnId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      const newX = Math.max(0, Math.min(90, clickX - 8));
      const newY = Math.max(0, Math.min(93, clickY - 4));

      setAnnotations((prev) =>
        prev.map((a) => (a.id === selectedAnnId ? { ...a, x: newX, y: newY } : a))
      );
      confetti({ particleCount: 15, spread: 35 });
    }
  };

  const handlePaperTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!selectedAnnId || !canvasRef.current) return;
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    if (target && (target.closest('.annotation-item') || target.closest('button') || target.closest('input'))) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const touchX = ((touch.clientX - rect.left) / rect.width) * 100;
    const touchY = ((touch.clientY - rect.top) / rect.height) * 100;

    if (touchX >= 0 && touchX <= 100 && touchY >= 0 && touchY <= 100) {
      const newX = Math.max(0, Math.min(90, touchX - 8));
      const newY = Math.max(0, Math.min(93, touchY - 4));
      setAnnotations((prev) =>
        prev.map((a) => (a.id === selectedAnnId ? { ...a, x: newX, y: newY } : a))
      );
      confetti({ particleCount: 15, spread: 35 });
    }
  };

  // High-performance unified Drag Engine for Touch, Stylus, and Mouse
  // Explicitly binds passive: false on window touchmove to completely block
  // mobile Chrome's compositor from canceling pointer events into page panning!
  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    ann: Annotation
  ) => {
    // If user clicked inside an input or button, allow native typing / click
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' || target.closest('button')) {
      setSelectedAnnId(ann.id);
      return;
    }

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    setSelectedAnnId(ann.id);
    setDraggingAnnId(ann.id);

    let startClientX = 0;
    let startClientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      startClientX = e.touches[0].clientX;
      startClientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      startClientX = (e as React.MouseEvent).clientX;
      startClientY = (e as React.MouseEvent).clientY;
    }

    const initialAnnX = ann.x;
    const initialAnnY = ann.y;

    const onMove = (moveEvt: MouseEvent | TouchEvent) => {
      // Actively prevent mobile Chrome scroll hijacking
      if (moveEvt.cancelable) {
        moveEvt.preventDefault();
      }

      let curX = 0;
      let curY = 0;
      if ('touches' in moveEvt && moveEvt.touches.length > 0) {
        curX = moveEvt.touches[0].clientX;
        curY = moveEvt.touches[0].clientY;
      } else if ('clientX' in moveEvt) {
        curX = (moveEvt as MouseEvent).clientX;
        curY = (moveEvt as MouseEvent).clientY;
      }

      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      if (canvasRect.width <= 0 || canvasRect.height <= 0) return;

      // Auto-scroll container if finger is dragged near viewport edges
      if (containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const edgeMargin = 60;
        const scrollStep = 16;
        if (curY > cRect.bottom - edgeMargin) {
          containerRef.current.scrollTop += scrollStep;
        } else if (curY < cRect.top + edgeMargin) {
          containerRef.current.scrollTop -= scrollStep;
        }
      }

      const deltaX = ((curX - startClientX) / canvasRect.width) * 100;
      const deltaY = ((curY - startClientY) / canvasRect.height) * 100;

      const newXPct = Math.max(0, Math.min(94, initialAnnX + deltaX));
      const newYPct = Math.max(0, Math.min(96, initialAnnY + deltaY));

      setAnnotations((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, x: newXPct, y: newYPct } : a))
      );
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      setDraggingAnnId(null);
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  // State for Redaction Confirmation Modal
  const [isRedactionModalOpen, setIsRedactionModalOpen] = useState(false);
  const [redactionStats, setRedactionStats] = useState<{ total: number; pages: number[] }>({ total: 0, pages: [] });

  // Download Baked PDF with security check for redactions
  const triggerSaveExecution = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    setIsRedactionModalOpen(false);
    try {
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;

      const newPdfBytes = await applyAnnotationsAndSave(
        pdfBytes,
        annotations,
        canvasWidth,
        canvasHeight
      );

      const hasRedaction = annotations.some((a) => a.type === 'redaction');
      const suffix = hasRedaction ? '_redacted.pdf' : '_signed.pdf';
      const downloadName = fileName.replace(/\.pdf$/i, '') + suffix;
      downloadBlob(newPdfBytes, downloadName);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Failed to bake PDF', err);
      alert('Could not save PDF: ' + (err?.message || 'Unknown error. Please check browser console.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndDownload = () => {
    const redactionAnns = annotations.filter((a) => a.type === 'redaction');
    if (redactionAnns.length > 0) {
      const pages = Array.from(new Set(redactionAnns.map((a) => a.pageIndex + 1))).sort((a, b) => a - b);
      setRedactionStats({ total: redactionAnns.length, pages });
      setIsRedactionModalOpen(true);
    } else {
      triggerSaveExecution();
    }
  };

  const currentPageAnnotations = annotations.filter((a) => a.pageIndex === currentPage - 1);
  const selectedAnn = annotations.find((a) => a.id === selectedAnnId);

  return (
    <div
      className="flex flex-col h-[calc(100dvh-4rem-3.5rem)] md:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden select-none relative"
      onClick={() => setSelectedAnnId(null)}
    >
      {/* Minimal Canva-Style Top Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
        {/* Left: Document Info & Change */}
        <div className="flex items-center gap-1.5 min-w-0">
          {onResetFile && (
            <button
              onClick={onResetFile}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Document"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="font-mono text-slate-200 text-xs truncate max-w-[110px] sm:max-w-xs font-semibold">
            {fileName}
          </span>
          <label className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer hidden sm:inline ml-1">
            [Change]
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

        {/* Center: Desktop Quick Tools (Hidden on Mobile, accessed via Canva (+) button) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setIsSignatureModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Sign</span>
          </button>
          <button
            onClick={handleAddText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>
          <button
            onClick={handleAddRedaction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-rose-400" />
            <span>Redact</span>
          </button>
          <button
            onClick={() => handleAddStamp('APPROVED')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-emerald-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Approved</span>
          </button>
          <button
            onClick={() => handleAddStamp('CONFIDENTIAL')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <span>Confidential</span>
          </button>
          <button
            onClick={handleAddDate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Date</span>
          </button>
        </div>

        {/* Right: Page Nav, Zoom, & Export Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Page Counter */}
          <div className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300 font-medium px-1 text-[11px]">
              {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Fit */}
          <button
            onClick={handleFitToScreen}
            className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-[11px] font-bold cursor-pointer"
            title="Fit to Screen"
          >
            Fit
          </button>

          {/* Export & Download Button */}
          <button
            onClick={handleSaveAndDownload}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950 p-1 sm:p-6 flex justify-center items-start relative overscroll-contain"
        onClick={(e) => {
          if (e.target === containerRef.current) {
            setSelectedAnnId(null);
          }
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 z-30">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Rendering document pages...</p>
          </div>
        )}

        {/* Mobile 1-Tap Placement Guide Pill */}
        {selectedAnn && (
          <div className="fixed top-14 inset-x-3 sm:hidden z-40 bg-indigo-950/95 backdrop-blur-md border border-indigo-500/50 rounded-xl px-3 py-1.5 text-center shadow-lg pointer-events-none animate-in fade-in">
            <span className="text-[11px] font-bold text-indigo-200">
              👆 Tap anywhere on the PDF to place signature, or tap ⬇️ Sign Line below
            </span>
          </div>
        )}

        {/* Paper Container */}
        <div
          onClick={handlePaperClick}
          onTouchEnd={handlePaperTouchEnd}
          className="relative shadow-2xl rounded-sm overflow-hidden border border-slate-800 bg-white cursor-crosshair"
        >
          <canvas ref={canvasRef} className="block pointer-events-auto" />

          {/* Overlay Interactive Annotations Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {currentPageAnnotations.map((ann) => {
              const isSelected = selectedAnnId === ann.id;
              return (
                <div
                  key={ann.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnId(ann.id);
                  }}
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    width: ann.width ? `${ann.width}px` : 'auto',
                    height: ann.height ? `${ann.height}px` : 'auto',
                    touchAction: 'none',
                  }}
                  className={`annotation-item absolute pointer-events-auto select-none transition-shadow ${
                    isSelected ? 'ring-2 ring-indigo-500 shadow-2xl z-40' : 'hover:ring-1 hover:ring-indigo-400 z-30'
                  }`}
                >
                  {/* Desktop Floating Action Pill on Selected */}
                  {isSelected && (
                    <div
                      className="hidden sm:flex absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-2 py-1.5 items-center gap-1 shadow-2xl z-50 text-[11px] text-white pointer-events-auto whitespace-nowrap"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* D-Pad Nudge Buttons */}
                      <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => nudgeAnnotation(ann.id, -3, 0)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                          title="Nudge Left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => nudgeAnnotation(ann.id, 0, -3)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                          title="Nudge Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => nudgeAnnotation(ann.id, 0, 3)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                          title="Nudge Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => nudgeAnnotation(ann.id, 3, 0)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                          title="Nudge Right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Snap Presets */}
                      <button
                        onClick={() => jumpToBottom(ann.id)}
                        className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-[10px] text-white shadow-sm flex items-center gap-1"
                        title="Snap to Signature Line at bottom"
                      >
                        <span>⬇️ Sign Line</span>
                      </button>

                      <button
                        onClick={() => jumpToCenter(ann.id)}
                        className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                        title="Snap to Center"
                      >
                        <Crosshair className="w-3 h-3" />
                      </button>

                      {/* Resize */}
                      <div className="flex items-center gap-0.5 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => changeSize(ann.id, -20)}
                          className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-white font-bold"
                          title="Shrink"
                        >
                          -
                        </button>
                        <button
                          onClick={() => changeSize(ann.id, 20)}
                          className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-white font-bold"
                          title="Enlarge"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeAnnotation(ann.id)}
                        className="p-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white"
                        title="Delete Annotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Render based on type */}
                  {ann.type === 'signature' && (
                    <div
                      onMouseDown={(e) => handleStartDrag(e, ann)}
                      onTouchStart={(e) => handleStartDrag(e, ann)}
                      style={{ touchAction: 'none' }}
                      className="w-full h-full cursor-grab active:cursor-grabbing relative group/sig touch-none"
                    >
                      <img
                        src={ann.content}
                        alt="Signature"
                        className="w-full h-full object-contain pointer-events-none select-none"
                      />
                      <div className="absolute top-0 right-0 bg-indigo-600/80 text-white text-[8px] px-1 rounded-bl opacity-0 group-hover/sig:opacity-100 transition">
                        Move
                      </div>
                    </div>
                  )}

                  {ann.type === 'redaction' && (
                    <div
                      onMouseDown={(e) => handleStartDrag(e, ann)}
                      onTouchStart={(e) => handleStartDrag(e, ann)}
                      style={{ touchAction: 'none' }}
                      className="w-full h-full bg-black flex items-center justify-center text-[10px] font-mono text-zinc-400 font-bold select-none cursor-grab active:cursor-grabbing touch-none"
                    >
                      [REDACTED]
                    </div>
                  )}

                  {ann.type === 'stamp' && (
                    <div
                      onMouseDown={(e) => handleStartDrag(e, ann)}
                      onTouchStart={(e) => handleStartDrag(e, ann)}
                      style={{ touchAction: 'none' }}
                      className={`w-full h-full border-2 rounded px-2 flex items-center justify-center font-black tracking-wider uppercase text-xs cursor-grab active:cursor-grabbing select-none touch-none ${
                        ann.content === 'CONFIDENTIAL'
                          ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                          : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                      }`}
                    >
                      {ann.content}
                    </div>
                  )}

                  {(ann.type === 'text' || ann.type === 'date') && (
                    <div className="flex flex-col w-full h-full bg-white/95 rounded border border-indigo-400/80 shadow-md overflow-hidden">
                      {/* Drag Grip Handle */}
                      <div
                        onMouseDown={(e) => handleStartDrag(e, ann)}
                        onTouchStart={(e) => handleStartDrag(e, ann)}
                        style={{ touchAction: 'none' }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 flex items-center justify-between cursor-grab active:cursor-grabbing select-none touch-none"
                      >
                        <span className="flex items-center gap-1">
                          <Move className="w-2.5 h-2.5" />
                          <span>Drag to Move</span>
                        </span>
                        <span className="text-[8px] opacity-75 font-normal">Tap box to edit</span>
                      </div>
                      <input
                        type="text"
                        value={ann.content}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnnId(ann.id);
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnnotations((prev) =>
                            prev.map((a) => (a.id === ann.id ? { ...a, content: val } : a))
                          );
                        }}
                        className="w-full bg-transparent px-1.5 py-1 outline-none text-slate-900 font-sans text-xs"
                        style={{
                          fontSize: `${ann.fontSize || 14}px`,
                          color: ann.color || '#000000',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Canva (+) Action Button (Mobile Only, shown when no item selected) */}
      {!selectedAnn && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAddSheetOpen(true);
          }}
          className="fixed bottom-20 right-5 sm:hidden z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-2xl flex items-center justify-center border-2 border-white/20 active:scale-95 transition-all shadow-indigo-600/50 cursor-pointer"
          aria-label="Add Element"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Canva-Style Contextual Bottom Toolbar (Mobile Only, shown when an item is selected) */}
      {selectedAnn && !isPositionDrawerOpen && (
        <div
          className="fixed bottom-16 inset-x-2 sm:hidden z-40 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center justify-between gap-1.5 animate-in slide-in-from-bottom-2 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Position & Nudge Button */}
          <button
            onClick={() => setIsPositionDrawerOpen(true)}
            className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5 text-xs font-bold text-white active:bg-indigo-600 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Position / Nudge</span>
          </button>

          {/* 1-Tap Sign Line Snap */}
          <button
            onClick={() => jumpToBottom(selectedAnn.id)}
            className="py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <span>⬇️ Sign Line</span>
          </button>

          {/* Size Adjusters */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => changeSize(selectedAnn.id, -20)}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-white font-bold text-sm active:bg-slate-700 cursor-pointer"
              title="Shrink"
            >
              -
            </button>
            <button
              onClick={() => changeSize(selectedAnn.id, 20)}
              className="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-white font-bold text-sm active:bg-slate-700 cursor-pointer"
              title="Enlarge"
            >
              +
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={() => removeAnnotation(selectedAnn.id)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white active:scale-95 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Done / Deselect */}
          <button
            onClick={() => setSelectedAnnId(null)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white active:scale-95 cursor-pointer"
            title="Done"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Canva-Style Position & Nudge Sheet */}
      {selectedAnn && isPositionDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setIsPositionDrawerOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-4 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Position & Nudge</h3>
              </div>
              <button
                onClick={() => setIsPositionDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1-Tap Alignment Grid */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2">1-Tap Align Snaps:</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 10, 10)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ↖ Top Left
                </button>
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 38, 10)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ⬆ Top Center
                </button>
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 65, 10)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ↗ Top Right
                </button>

                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 10, 48)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ⬅ Mid Left
                </button>
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 35, 48)}
                  className="py-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold cursor-pointer"
                >
                  🎯 Center
                </button>
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 65, 48)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ➡ Mid Right
                </button>

                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 10, 86)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ↙ Bottom Left
                </button>
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 38, 86)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                >
                  ⬇ Bottom Center
                </button>
                <button
                  onClick={() => alignAnnotation(selectedAnn.id, 60, 86)}
                  className="py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-md cursor-pointer"
                >
                  ✍️ Sign Line
                </button>
              </div>
            </div>

            {/* Precision Nudge D-Pad */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1">Fine Nudge:</p>
                <div className="flex gap-1 text-[10px] font-bold">
                  <button
                    onClick={() => setNudgeStep(1)}
                    className={`px-2 py-0.5 rounded-lg border cursor-pointer ${nudgeStep === 1 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                  >
                    Fine 1%
                  </button>
                  <button
                    onClick={() => setNudgeStep(3)}
                    className={`px-2 py-0.5 rounded-lg border cursor-pointer ${nudgeStep === 3 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                  >
                    Normal 3%
                  </button>
                </div>
              </div>

              {/* D-Pad Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                <button
                  onClick={() => nudgeAnnotation(selectedAnn.id, -nudgeStep, 0)}
                  className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-indigo-600 font-bold cursor-pointer"
                  title="Left"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => nudgeAnnotation(selectedAnn.id, 0, -nudgeStep)}
                    className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-indigo-600 font-bold cursor-pointer"
                    title="Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => nudgeAnnotation(selectedAnn.id, 0, nudgeStep)}
                    className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-indigo-600 font-bold cursor-pointer"
                    title="Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => nudgeAnnotation(selectedAnn.id, nudgeStep, 0)}
                  className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-indigo-600 font-bold cursor-pointer"
                  title="Right"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsPositionDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              ✓ Done Positioning
            </button>
          </div>
        </div>
      )}

      {/* Canva-Style Bottom "Add to Document" Sheet */}
      {isAddSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setIsAddSheetOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-w-lg mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Add to Document</h3>
              </div>
              <button
                onClick={() => setIsAddSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Canva Tool Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  setIsAddSheetOpen(false);
                  setIsSignatureModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-2 text-center active:bg-indigo-950/60 active:border-indigo-500 transition cursor-pointer shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <PenTool className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">Signature</span>
                <span className="text-[10px] text-slate-400">Draw or Sign</span>
              </button>

              <button
                onClick={() => {
                  setIsAddSheetOpen(false);
                  handleAddText();
                }}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-2 text-center active:bg-indigo-950/60 active:border-indigo-500 transition cursor-pointer shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <Type className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">Text Box</span>
                <span className="text-[10px] text-slate-400">Type Any Note</span>
              </button>

              <button
                onClick={() => {
                  setIsAddSheetOpen(false);
                  handleAddDate();
                }}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-2 text-center active:bg-indigo-950/60 active:border-indigo-500 transition cursor-pointer shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">Date Stamp</span>
                <span className="text-[10px] text-slate-400">Today's Date</span>
              </button>

              <button
                onClick={() => {
                  setIsAddSheetOpen(false);
                  handleAddStamp('APPROVED');
                }}
                className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center active:bg-emerald-950/60 active:border-emerald-500 transition cursor-pointer shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Approved</span>
                <span className="text-[9px] text-emerald-400">Verified</span>
              </button>

              <button
                onClick={() => {
                  setIsAddSheetOpen(false);
                  handleAddStamp('CONFIDENTIAL');
                }}
                className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center active:bg-amber-950/60 active:border-amber-500 transition cursor-pointer shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Confidential</span>
                <span className="text-[9px] text-amber-400">Restricted</span>
              </button>

              <button
                onClick={() => {
                  setIsAddSheetOpen(false);
                  handleAddRedaction();
                }}
                className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center active:bg-rose-950/60 active:border-rose-500 transition cursor-pointer shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                  <Square className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Redact</span>
                <span className="text-[9px] text-rose-400">Blackout Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redaction Security Confirmation Dialog */}
      {isRedactionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Square className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm Permanent Redaction</h3>
                <p className="text-xs text-rose-300 font-medium">Irreversible Text &amp; Metadata Purge</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">
                {redactionStats.total} {redactionStats.total === 1 ? 'redaction' : 'redactions'} detected on {redactionStats.pages.length === 1 ? `Page ${redactionStats.pages[0]}` : `Pages ${redactionStats.pages.join(', ')}`}.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                PDFCraft will permanently burn black blocks into the document and purge the underlying text stream, font glyphs, and annotations. The concealed text will be <strong>impossible to recover</strong> via search, copy/paste, or text extraction.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsRedactionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel &amp; Review
              </button>
              <button
                onClick={triggerSaveExecution}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Apply &amp; Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleAddSignature}
      />
    </div>
  );
};
