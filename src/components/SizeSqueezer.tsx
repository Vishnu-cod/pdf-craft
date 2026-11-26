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
  Zap,
  AlertTriangle,
  FileText,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SizeSqueezerProps {
  initialPdfBytes?: ArrayBuffer;
  initialFileName?: string;
  initialTargetKB?: number;
  routeTitle?: string;
  routeSubtitle?: string;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const SizeSqueezer: React.FC<SizeSqueezerProps> = ({
  initialPdfBytes,
  initialFileName = 'document.pdf',
  initialTargetKB = 195,
  routeTitle,
  routeSubtitle,
  onFileLoaded,
}) => {
  const [strategy, setStrategy] = useState<CompressionStrategy>('target-squeeze');
  const [targetKB, setTargetKB] = useState<number>(initialTargetKB);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(initialPdfBytes || null);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [isGeneratingSample, setIsGeneratingSample] = useState<boolean>(false);

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
    { label: '50 KB', value: 48, desc: 'Photo, Signature & SSC Portal Cap' },
    { label: '100 KB', value: 95, desc: 'UPSC, SSC, State Govt Portals' },
    { label: '200 KB', value: 195, desc: 'UPSC Form & College Admissions' },
    { label: '300 KB', value: 295, desc: 'Visa & Scholarship Applications' },
    { label: '500 KB', value: 490, desc: 'USCIS, DS-160 & Email Caps' },
    { label: '1 MB', value: 980, desc: 'Corporate Portal Attachments' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setResult(null);
    setErrorMessage(null);
    try {
      if (files.length === 1) {
        const file = files[0];
        const arrayBuffer = await file.arrayBuffer();
        setPdfBytes(arrayBuffer);
        setFileName(file.name);
        onFileLoaded?.(file, arrayBuffer);
      } else {
        await mergeAndLoadBuffers(files.map((f) => ({ name: f.name, promise: f.arrayBuffer() })), files[0].name);
      }
    } catch {
      setErrorMessage('Failed to load or merge selected PDF file(s). Ensure none are corrupt or encrypted.');
    }
    e.target.value = '';
  };

  const mergeAndLoadBuffers = async (
    items: Array<{ name: string; promise: Promise<ArrayBuffer> }>,
    primaryName: string
  ) => {
    const { PDFDocument } = await import('@cantoo/pdf-lib');
    const mergedDoc = await PDFDocument.create();
    for (const item of items) {
      const buf = await item.promise;
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const copied = await mergedDoc.copyPages(src, src.getPageIndices());
      copied.forEach((p) => mergedDoc.addPage(p));
    }
    const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
    const mergedBuffer = mergedBytes.buffer.slice(mergedBytes.byteOffset, mergedBytes.byteOffset + mergedBytes.byteLength);
    const outName = `merged_${primaryName.replace(/\.pdf$/i, '')}.pdf`;
    setPdfBytes(mergedBuffer);
    setFileName(outName);
    setResult(null);
    onFileLoaded?.(new File([mergedBuffer], outName, { type: 'application/pdf' }), mergedBuffer);
  };

  const handleAppendMergeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !pdfBytes) return;
    setErrorMessage(null);
    try {
      const currentCopy = pdfBytes.slice(0);
      await mergeAndLoadBuffers(
        [{ name: fileName, promise: Promise.resolve(currentCopy) }, ...files.map((f) => ({ name: f.name, promise: f.arrayBuffer() }))],
        fileName
      );
    } catch {
      setErrorMessage('Could not append & merge the extra PDF file. Ensure it is not password-locked.');
    }
    e.target.value = '';
  };

  // Generate realistic ~280KB heavy canvas sample PDF so users on 200KB/100KB pages can test real size shrinking!
  const handleLoadHeavySamplePDF = async () => {
    setIsGeneratingSample(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      // Render a textured certificate scan canvas (~250KB JPEG embedded) so target-squeeze shows real KB reduction
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Subtle fine grain noise to mimic realistic scanner document size
        for (let y = 0; y < canvas.height; y += 6) {
          ctx.fillStyle = y % 12 === 0 ? '#f1f3f5' : '#ffffff';
          ctx.fillRect(0, y, canvas.width, 3);
        }
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText('SAMPLE ACADEMIC & EXAM CERTIFICATE', 120, 180);
        ctx.font = '26px sans-serif';
        ctx.fillStyle = '#334155';
        for (let i = 0; i < 24; i++) {
          ctx.fillText(
            `Verification Record Line ${i + 1}: Client-side WebAssembly Target Compression Sample.`,
            120,
            270 + i * 48
          );
        }
        const jpgData = canvas.toDataURL('image/jpeg', 0.92);
        const raw = Uint8Array.from(atob(jpgData.split(',')[1]), (c) => c.charCodeAt(0));
        const img = await doc.embedJpg(raw);
        const page = doc.addPage([600, 800]);
        page.drawImage(img, { x: 0, y: 0, width: 600, height: 800 });
        page.drawText('Official Portal Compression Test Document', {
          x: 60,
          y: 40,
          size: 10,
          font,
          color: rgb(0.2, 0.2, 0.25),
        });
      } else {
        const page = doc.addPage([600, 800]);
        page.drawText('SAMPLE PORTAL DOCUMENT', { x: 60, y: 700, size: 18, font: fontBold });
      }

      const bytes = await doc.save();
      const arr = bytes.buffer as ArrayBuffer;
      const blob = new Blob([arr], { type: 'application/pdf' });
      const sampleFile = new File([blob], 'sample_scanned_certificate.pdf', { type: 'application/pdf' });
      setPdfBytes(arr);
      setFileName(sampleFile.name);
      onFileLoaded?.(sampleFile, arr);
      confetti({ particleCount: 30, spread: 45 });
    } catch (err: any) {
      setErrorMessage('Could not generate sample PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleRunSqueeze = async () => {
    if (!pdfBytes) {
      setErrorMessage('Please upload or load a PDF document first.');
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

  const originalKB = pdfBytes ? Math.max(1, Math.round(pdfBytes.byteLength / 1024)) : 0;
  const headingText = (routeTitle || 'Target Size Squeezer & Compressor').replace(/\s*\|\s*PDFCraft$/i, '');
  const subtitleText =
    routeSubtitle ||
    'Compress PDFs strictly under 50KB, 100KB, or 200KB for UPSC, SSC, and visa portals. 100% in-browser memory.';

  return (
    <div className="w-full min-w-0 max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Top Banner with Route-Specific H1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="hud-label text-app-ink">STRICT KB TARGET ENGINE</span>
            <span className="hud-label text-[9px] text-ink-strong border border-line px-2 py-0.5 whitespace-nowrap shrink-0">
              Target Ceiling: {targetKB} KB
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl tracking-[-0.03em] text-ink-strong break-words">
            {headingText}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-muted mt-1.5 max-w-2xl leading-relaxed">
            {subtitleText}
          </p>
        </div>

        {pdfBytes && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label className="min-h-[44px] px-4 border border-line-strong bg-bg-raised hover:bg-bg text-ink-strong hud-label flex items-center gap-2 cursor-pointer transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-app-ink" />
              <span>+ Merge Another PDF</span>
              <input type="file" accept=".pdf" multiple className="hidden" onChange={handleAppendMergeUpload} />
            </label>
            <label className="min-h-[44px] px-4 invert-block hud-label flex items-center gap-2 cursor-pointer">
              <UploadCloud className="w-4 h-4 text-app-ink" />
              <span>Change PDF</span>
              <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>

      {/* Upload Zone when no document is active */}
      {!pdfBytes ? (
        <div className="border border-dashed border-line-strong hover:border-app-ink bg-bg-raised p-6 sm:p-12 text-center transition-colors">
          <div className="w-12 h-12 border border-line-strong bg-bg text-app-ink flex items-center justify-center mx-auto mb-5">
            <Shrink className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl text-ink-strong mb-2">
            Drop your PDF here to compress under {targetKB <= 50 ? '50KB' : targetKB <= 100 ? '100KB' : targetKB <= 200 ? '200KB' : `${targetKB}KB`}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-muted max-w-md mx-auto mb-6">
            Select 1 PDF or multiple marksheets to merge &amp; compress strictly into valid portal bounds (100% browser RAM).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label className="w-full sm:w-auto min-h-[44px] h-11 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity inline-flex items-center justify-center gap-2 cursor-pointer">
              <UploadCloud className="w-4 h-4" />
              <span>Select PDF(s) or Merge Marksheets</span>
              <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileUpload} />
            </label>

            <button
              type="button"
              onClick={handleLoadHeavySamplePDF}
              disabled={isGeneratingSample}
              className="w-full sm:w-auto min-h-[44px] h-11 px-5 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingSample ? (
                <Loader2 className="w-4 h-4 animate-spin text-app-ink" />
              ) : (
                <Sparkles className="w-4 h-4 text-app-ink" />
              )}
              <span>{isGeneratingSample ? 'Creating Sample...' : 'Load Sample PDF'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Card & Strategy Selector */}
          <div className="p-4 sm:p-6 bg-bg-raised border border-line space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-line pb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-app-ink shrink-0" />
                <span className="font-mono font-semibold text-ink-strong truncate max-w-[200px] sm:max-w-xs">
                  {fileName}
                </span>
              </div>
              <span className="hud-label text-ink-strong bg-bg border border-line px-2.5 py-1 whitespace-nowrap">
                Original: {originalKB} KB
              </span>
            </div>

            {/* Strategy Modes */}
            <div className="space-y-2">
              <label className="hud-label text-muted block">Compression Strategy:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
                <button
                  type="button"
                  onClick={() => setStrategy('target-squeeze')}
                  className={`p-4 text-left transition-colors cursor-pointer ${
                    strategy === 'target-squeeze'
                      ? 'bg-invert-bg text-invert-fg'
                      : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
                  }`}
                >
                  <p className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${strategy === 'target-squeeze' ? 'text-app' : 'text-app-ink'}`} />
                    <span>Strict Target Size Squeezer</span>
                  </p>
                  <p className="font-sans text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    Adaptive scaling tailored to strict government, college, or exam portal limits (50KB, 100KB, 200KB).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy('vector-preserve')}
                  className={`p-4 text-left transition-colors cursor-pointer ${
                    strategy === 'vector-preserve'
                      ? 'bg-invert-bg text-invert-fg'
                      : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
                  }`}
                >
                  <p className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className={`w-3.5 h-3.5 ${strategy === 'vector-preserve' ? 'text-app' : 'text-app-ink'}`} />
                    <span>High Quality (Vector Preserved)</span>
                  </p>
                  <p className="font-sans text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    Optimizes object streams without rasterizing. Keeps 100% vector fonts and selectable text.
                  </p>
                </button>
              </div>
            </div>

            {/* Target KB Presets & Slider */}
            {strategy === 'target-squeeze' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="hud-label text-muted flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-app-ink" />
                    <span>Target Size Limit:</span>
                  </label>
                  <span className="hud-label text-app-ink border border-line bg-bg px-2.5 py-1 whitespace-nowrap">
                    Target: {targetKB} KB
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line border border-line">
                  {presets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setTargetKB(p.value)}
                      className={`p-3 min-h-[44px] text-left transition-colors cursor-pointer ${
                        targetKB === p.value
                          ? 'bg-invert-bg text-invert-fg'
                          : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold">{p.label}</div>
                      <div className="font-sans text-[10px] opacity-75 truncate mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Visible Range Slider Track */}
                <div className="pt-3">
                  <input
                    type="range"
                    min="40"
                    max={Math.max(1000, originalKB)}
                    step="10"
                    aria-label="Target file size in KB"
                    value={targetKB}
                    onChange={(e) => setTargetKB(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-line-strong border border-line appearance-none cursor-pointer accent-[#e8204f]"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-faint mt-2">
                    <span>40 KB</span>
                    <span>200 KB (Govt)</span>
                    <span>500 KB</span>
                    <span>{Math.max(1000, originalKB)} KB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleRunSqueeze}
                disabled={isProcessing}
                className="flex-1 sm:flex-none min-h-[44px] h-11 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                  className="min-h-[44px] h-11 px-4 border border-danger text-danger font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-danger hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            {progressText && (
              <p className="hud-label text-app-ink flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{progressText}</span>
              </p>
            )}

            {errorMessage && (
              <div className="p-3.5 border border-danger bg-bg text-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="p-5 sm:p-6 bg-bg-raised border border-line-strong space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-app text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base text-ink-strong">
                        Compression Complete
                      </h3>
                      <span className="hud-label text-[9px] text-app-ink border border-line px-2 py-0.5 whitespace-nowrap">
                        {result.targetAchieved ? 'Under Target' : 'Best Effort'}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-muted mt-1">
                      Original: {result.originalSizeKB} KB → Output:{' '}
                      <strong className="text-ink-strong">{result.compressedSizeKB} KB</strong>{' '}
                      {result.reductionPercentage > 0
                        ? `(-${result.reductionPercentage}% reduced)`
                        : '(0% — original optimal file preserved)'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto min-h-[44px] h-11 px-5 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed PDF</span>
                </button>
              </div>

              {result.warning && (
                <div className="p-3.5 border border-line-strong bg-bg text-ink text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-app-ink" />
                  <span className="leading-relaxed">{result.warning}</span>
                </div>
              )}

              {/* Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line text-xs">
                <div className="p-3.5 bg-bg">
                  <p className="hud-label text-[9px] text-faint">Initial Size</p>
                  <p className="font-mono text-sm font-bold text-ink-strong mt-1">
                    {result.originalSizeKB} KB
                  </p>
                </div>
                <div className="p-3.5 bg-bg">
                  <p className="hud-label text-[9px] text-faint">Export Size</p>
                  <p className="font-mono text-sm font-bold text-app-ink mt-1">
                    {result.compressedSizeKB} KB
                  </p>
                </div>
                <div className="p-3.5 bg-bg">
                  <p className="hud-label text-[9px] text-faint">Reduction</p>
                  <p className="font-mono text-sm font-bold text-ink-strong mt-1">
                    {result.reductionPercentage > 0 ? `-${result.reductionPercentage}%` : '0%'}
                  </p>
                </div>
                <div className="p-3.5 bg-bg">
                  <p className="hud-label text-[9px] text-faint">Pages</p>
                  <p className="font-mono text-sm font-bold text-ink-strong mt-1">
                    {result.numPages} Pages
                  </p>
                </div>
              </div>

              {/* Official Indian Exam Portal Compliance Validator */}
              <div className="border border-line bg-bg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="hud-label text-app-ink">PORTAL COMPLIANCE CHECK ({result.compressedSizeKB} KB)</p>
                  <span className="font-mono text-[10px] text-faint">MIN &amp; MAX FLOOR VERIFIED</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {[
                    { name: 'UPSC OTR', min: 20, max: 200, host: 'upsconline.nic.in' },
                    { name: 'SSC Portal', min: 10, max: 50, host: 'ssc.gov.in' },
                    { name: 'GATE GOAPS', min: 10, max: 200, host: 'gate.iitk.ac.in' },
                    { name: 'NTA NEET UG', min: 50, max: 200, host: 'neet.nta.nic.in' },
                  ].map((portal) => {
                    const tooSmall = result.compressedSizeKB < portal.min;
                    const tooLarge = result.compressedSizeKB > portal.max;
                    const valid = !tooSmall && !tooLarge;
                    return (
                      <div key={portal.name} className="p-2.5 border border-line bg-bg-raised flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-ink-strong">{portal.name}</span>
                          <span
                            className={`hud-label text-[9px] px-1.5 py-0.5 border ${
                              valid
                                ? 'border-emerald-500/40 text-emerald-400'
                                : 'border-danger/40 text-danger'
                            }`}
                          >
                            {valid ? 'PASS' : tooSmall ? `< ${portal.min}KB` : `> ${portal.max}KB`}
                          </span>
                        </div>
                        <span className="font-sans text-[10px] text-muted">
                          {valid
                            ? `Fits ${portal.min}–${portal.max} KB (${portal.host})`
                            : tooSmall
                            ? `Rejected under ${portal.min} KB floor!`
                            : `Exceeds ${portal.max} KB limit`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* First Page Preview */}
              {result.firstPagePreviewUrl && (
                <div className="pt-2">
                  <p className="hud-label text-muted mb-2">Compressed Page Preview:</p>
                  <div className="max-w-[200px] aspect-[3/4] bg-white border border-line p-2">
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

      {/* Official Portal Size & Rejection Quick-Fix Reference Table */}
      <div className="border border-line bg-bg-raised p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="hud-label text-app-ink">INDIAN EXAM PORTAL PDF LIMITS &amp; REJECTION FIXES</p>
          <span className="font-mono text-[10px] text-faint">OFFICIAL BRACKETS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line text-xs">
          <div className="p-3 bg-bg space-y-1">
            <p className="font-mono font-bold text-ink-strong">UPSC Civil Services / OTR</p>
            <p className="text-app-ink font-mono text-[11px]">Valid: 20 KB – 200 KB</p>
            <p className="text-muted text-[11px]">Files under 20 KB or over 200 KB fail upsconline.nic.in checks. Use 195 KB preset.</p>
          </div>
          <div className="p-3 bg-bg space-y-1">
            <p className="font-mono font-bold text-ink-strong">SSC CGL / CHSL / MTS</p>
            <p className="text-app-ink font-mono text-[11px]">Valid: Strictly &le; 50 KB</p>
            <p className="text-muted text-[11px]">Set target to 48 KB so ssc.gov.in metadata overhead never crosses 50 KB.</p>
          </div>
          <div className="p-3 bg-bg space-y-1">
            <p className="font-mono font-bold text-ink-strong">IIT GATE GOAPS</p>
            <p className="text-app-ink font-mono text-[11px]">Valid: 10 KB – 200 KB</p>
            <p className="text-muted text-[11px]">Category &amp; PwD certificates preserve crisp stamps at 150–195 KB.</p>
          </div>
          <div className="p-3 bg-bg space-y-1">
            <p className="font-mono font-bold text-ink-strong">NTA NEET UG</p>
            <p className="text-app-ink font-mono text-[11px]">Valid: 50 KB – 200 KB</p>
            <p className="text-muted text-[11px]">Keep Class 10 &amp; category certificates between 50 KB minimum and 200 KB max.</p>
          </div>
        </div>
      </div>

      {/* Companion Portal Presets & Internal SEO Navigation */}
      <div className="border-t border-line pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="hud-label text-app-ink">PORTAL LIMITS &amp; COMPANION TOOLS</p>
          <span className="font-mono text-[10px] text-faint">100% OFFLINE WEBASSEMBLY</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
          <a
            href="/upsc-pdf-compressor"
            className="p-4 bg-bg hover:bg-bg-raised transition-colors min-h-[44px] flex flex-col justify-between gap-1"
          >
            <span className="font-mono text-xs font-bold text-ink-strong">UPSC PDF Compressor (20–200 KB)</span>
            <span className="font-sans text-[11px] text-muted">Safe 195 KB preset for degrees, caste certificates &amp; upsconline.nic.in.</span>
          </a>
          <a
            href="/compress-pdf-100kb"
            className="p-4 bg-bg hover:bg-bg-raised transition-colors min-h-[44px] flex flex-col justify-between gap-1"
          >
            <span className="font-mono text-xs font-bold text-ink-strong">Compress PDF to 100 KB</span>
            <span className="font-sans text-[11px] text-muted">Strict 95 KB buffer for state PSC, banking &amp; scholarship forms.</span>
          </a>
          <a
            href="/compress-pdf-200kb"
            className="p-4 bg-bg hover:bg-bg-raised transition-colors min-h-[44px] flex flex-col justify-between gap-1"
          >
            <span className="font-mono text-xs font-bold text-ink-strong">Compress PDF Under 200 KB</span>
            <span className="font-sans text-[11px] text-muted">Preserves crisp original vectors when already below ceiling.</span>
          </a>
          <a
            href="/ssc-cgl-signature-photo-compressor"
            className="p-4 bg-bg hover:bg-bg-raised transition-colors min-h-[44px] flex flex-col justify-between gap-1"
          >
            <span className="font-mono text-xs font-bold text-ink-strong">SSC CGL Signature &amp; Photo (50 KB)</span>
            <span className="font-sans text-[11px] text-muted">Strict 48 KB preset tailored for ssc.gov.in uploads.</span>
          </a>
          <a
            href="/mask-aadhaar"
            className="p-4 bg-bg hover:bg-bg-raised transition-colors min-h-[44px] flex flex-col justify-between gap-1"
          >
            <span className="font-mono text-xs font-bold text-ink-strong">Mask Aadhaar Card Offline</span>
            <span className="font-sans text-[11px] text-muted">Hide the first 8 digits permanently before portal KYC uploads.</span>
          </a>
          <a
            href="/sign-pdf-no-account"
            className="p-4 bg-bg hover:bg-bg-raised transition-colors min-h-[44px] flex flex-col justify-between gap-1"
          >
            <span className="font-mono text-xs font-bold text-ink-strong">Sign PDF Without Account</span>
            <span className="font-sans text-[11px] text-muted">Draw vector signatures offline with zero email gates or paywalls.</span>
          </a>
        </div>
      </div>
    </div>
  );
};
