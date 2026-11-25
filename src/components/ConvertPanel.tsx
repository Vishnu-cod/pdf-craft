import React, { useState, useEffect } from 'react';
import {
  convertImagesToPDF,
  convertPDFToImagesZip,
  downloadBlob,
} from '../utils/pdfEngine';
import {
  convertPDFToExcelAllPages,
  convertPDFToWordDocx,
  convertDocxToPDF,
  convertDocxToImages,
} from '../utils/universalConverter';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Image as ImageIcon,
  FileType,
  Download,
  Loader2,
  Sparkles,
  Upload,
  UploadCloud,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConvertPanelProps {
  currentPdfBytes?: ArrayBuffer;
  currentFileName?: string;
  initialConverter?: 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images';
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const ConvertPanel: React.FC<ConvertPanelProps> = ({
  currentPdfBytes,
  currentFileName = 'document.pdf',
  initialConverter = 'pdf-to-word',
  onFileLoaded,
}) => {
  const [activeConverter, setActiveConverter] = useState<
    'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-images' | 'images-to-pdf' | 'word-to-pdf' | 'word-to-images'
  >(initialConverter);

  useEffect(() => {
    if (initialConverter) {
      setActiveConverter(initialConverter);
    }
  }, [initialConverter]);

  const [localPdfBytes, setLocalPdfBytes] = useState<ArrayBuffer | null>(currentPdfBytes || null);
  const [localFileName, setLocalFileName] = useState<string>(currentFileName || 'document.pdf');

  useEffect(() => {
    if (currentPdfBytes) {
      setLocalPdfBytes(currentPdfBytes);
      setLocalFileName(currentFileName || 'document.pdf');
    }
  }, [currentPdfBytes, currentFileName]);

  const handlePdfUpload = async (file: File) => {
    const bytes = await file.arrayBuffer();
    setLocalPdfBytes(bytes);
    setLocalFileName(file.name);
    if (onFileLoaded) {
      onFileLoaded(file, bytes);
    }
    confetti({ particleCount: 30, spread: 45 });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [conversionError, setConversionError] = useState<{ isScanned: boolean; message: string } | null>(null);

  // Sample generator for testing conversions
  const handleLoadSamplePdf = async () => {
    setIsLoading(true);
    setProgressText('Generating sample multi-page document for conversion...');
    try {
      const doc = await PDFDocument.create();
      const page1 = doc.addPage([600, 750]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      page1.drawText("CORPORATE PERFORMANCE & FINANCIAL CONVERSION TEST", {
        x: 50,
        y: 690,
        size: 15,
        font: fontBold,
        color: rgb(0.12, 0.18, 0.35),
      });
      page1.drawText("Document ID: DOC-98210   |   Export Verification Sample", {
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

      const lines = [
        "1. EXECUTIVE OVERVIEW",
        "PDFCraft converts documents 100% in-browser with zero cloud uploads or telemetry.",
        "",
        "2. FINANCIAL PERFORMANCE SUMMARY (Test for Excel & Word)",
        "Department                     Q1 ($)        Q2 ($)        Q3 ($)        Q4 ($)",
        "-------------------------------------------------------------------------------",
        "Software Infrastructure        12,400        14,200        11,900        15,800",
        "Design & Web R&D                8,500         9,100         9,400        10,200",
        "Security Audits & Compliance    6,000         6,500         6,200         7,100",
        "-------------------------------------------------------------------------------",
        "TOTAL ANNUAL EXPENSE           26,900        29,800        27,500        33,100",
      ];
      let y = 620;
      for (const l of lines) {
        page1.drawText(l, { x: 50, y, size: 9.5, font });
        y -= 18;
      }

      const page2 = doc.addPage([600, 750]);
      page2.drawText("PAGE 2: VERIFICATION & MULTI-PAGE EXPORT", {
        x: 50,
        y: 690,
        size: 14,
        font: fontBold,
        color: rgb(0.12, 0.18, 0.35),
      });
      page2.drawText("This second page verifies multi-page Word (.docx), Excel (.xlsx), and ZIP image exports.", {
        x: 50,
        y: 660,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      const sampleBytes = await doc.save();
      const arr = sampleBytes.buffer as ArrayBuffer;
      const blob = new Blob([arr], { type: "application/pdf" });
      const sampleFile = new File([blob], "sample_financial_report.pdf", { type: "application/pdf" });
      await handlePdfUpload(sampleFile);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  // Images state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  // Word doc state
  const [selectedWordFile, setSelectedWordFile] = useState<File | null>(null);

  // 1. PDF to Word
  const handlePdfToWord = async () => {
    if (!localPdfBytes) {
      alert('Please upload or load a PDF first!');
      return;
    }
    setConversionError(null);
    setIsLoading(true);
    setProgressText('Extracting text and compiling OpenXML Word (.docx)...');
    try {
      await convertPDFToWordDocx(localPdfBytes, localFileName);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      const isScanned = err?.message?.includes('SCANNED_PDF_DETECTED');
      const msg = err?.message?.replace('SCANNED_PDF_DETECTED: ', '') || 'Failed to convert to Word document.';
      setConversionError({ isScanned, message: msg });
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  // 2. PDF to Excel
  const handlePdfToExcel = async () => {
    if (!localPdfBytes) {
      alert('Please upload or load a PDF first!');
      return;
    }
    setConversionError(null);
    setIsLoading(true);
    setProgressText('Scanning document coordinates into multi-page Excel workbook...');
    try {
      await convertPDFToExcelAllPages(localPdfBytes, localFileName);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      const isScanned = err?.message?.includes('SCANNED_PDF_DETECTED');
      const msg = err?.message?.replace('SCANNED_PDF_DETECTED: ', '') || 'Failed to convert to Excel spreadsheet.';
      setConversionError({ isScanned, message: msg });
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  // 3. PDF to Images
  const handlePdfToImages = async () => {
    if (!localPdfBytes) {
      alert('Please upload or load a PDF first!');
      return;
    }
    setIsLoading(true);
    setProgressText('Rendering high-res retina pages into .ZIP archive...');
    try {
      const zipBlob = await convertPDFToImagesZip(localPdfBytes, 'png', 2.0);
      downloadBlob(zipBlob, localFileName.replace(/\.pdf$/i, '') + '_images.zip');
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      alert('Failed to export images: ' + err?.message);
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  // 4. Images to PDF
  const handleImagesToPdf = async () => {
    if (selectedImages.length === 0) return;
    setIsLoading(true);
    setProgressText('Compiling images into vector PDF pages...');
    try {
      const pdfBytes = await convertImagesToPDF(selectedImages);
      downloadBlob(pdfBytes, 'converted_images.pdf');
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      alert('Failed to convert images: ' + err?.message);
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  // 5. Word to PDF
  const handleWordToPdf = async () => {
    if (!selectedWordFile) return;
    setIsLoading(true);
    setProgressText('Parsing Word document paragraphs into PDF layout...');
    try {
      const buffer = await selectedWordFile.arrayBuffer();
      await convertDocxToPDF(buffer, selectedWordFile.name);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      alert('Failed to convert Word file: ' + err?.message);
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  // 6. Word to Images
  const handleWordToImages = async () => {
    if (!selectedWordFile) return;
    setIsLoading(true);
    setProgressText('Rendering Word document into high-res image...');
    try {
      const buffer = await selectedWordFile.arrayBuffer();
      await convertDocxToImages(buffer, selectedWordFile.name);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      alert('Failed to export Word to image: ' + err?.message);
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  };

  const converters = [
    { id: 'pdf-to-word', label: 'PDF ➔ Word (.docx)', icon: FileText, category: 'From PDF' },
    { id: 'pdf-to-excel', label: 'PDF ➔ Excel (.xlsx)', icon: FileSpreadsheet, category: 'From PDF' },
    { id: 'pdf-to-images', label: 'PDF ➔ Images (.zip)', icon: FileImage, category: 'From PDF' },
    { id: 'images-to-pdf', label: 'Images ➔ PDF', icon: ImageIcon, category: 'To PDF' },
    { id: 'word-to-pdf', label: 'Word (.docx) ➔ PDF', icon: FileType, category: 'From Word' },
    { id: 'word-to-images', label: 'Word (.docx) ➔ Images', icon: FileImage, category: 'From Word' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      {/* Editorial Section Header */}
      <div className="border-b border-line pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="hud-label text-app-ink mb-2">CLIENT-SIDE CONVERSION ENGINE</p>
          <h1 className="font-display text-3xl sm:text-5xl tracking-[-0.03em] text-ink-strong">
            Convert any document, <span className="text-app-ink">locally</span>.
          </h1>
          <p className="font-sans text-sm text-muted mt-2 max-w-xl">
            Transform PDFs into editable Word, Excel, or retina images — and pack Word or images back into crisp PDFs inside browser memory.
          </p>
        </div>
        <span className="hud-label text-faint border border-line px-3 py-1.5 shrink-0">
          ZERO UPLOADS · UNLIMITED
        </span>
      </div>

      {/* 6-Column Hairline Format Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-line border border-line mb-8">
        {converters.map((conv, idx) => {
          const Icon = conv.icon;
          const isSelected = activeConverter === conv.id;
          return (
            <button
              key={conv.id}
              onClick={() => setActiveConverter(conv.id as any)}
              className={`p-4 flex flex-col items-start justify-between text-left transition-colors cursor-pointer min-h-[96px] ${
                isSelected
                  ? 'bg-invert-bg text-invert-fg'
                  : 'bg-bg text-muted hover:text-ink-strong hover:bg-bg-raised'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-3">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-app' : 'text-app-ink'}`} />
                <span className="font-mono text-[9px] tracking-widest opacity-60">
                  0{idx + 1}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold tracking-[0.06em] uppercase leading-snug">
                {conv.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Converter Workbench Container */}
      <div className="bg-bg-raised border border-line-strong p-6 sm:p-10 max-w-3xl mx-auto">
        {/* Scanned PDF or Conversion Notice Alert */}
        {conversionError && (
          <div className="p-4 border border-app bg-bg mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-app-ink" />
            <div className="space-y-1.5 text-xs">
              <p className="font-display text-sm text-ink-strong">
                {conversionError.isScanned ? 'Scanned PDF Detected (OCR Required)' : 'Conversion Notice'}
              </p>
              <p className="font-sans text-muted leading-relaxed">{conversionError.message}</p>
              {conversionError.isScanned && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveConverter('pdf-to-images');
                    setConversionError(null);
                  }}
                  className="mt-2 h-9 px-4 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] cursor-pointer flex items-center gap-2"
                >
                  <FileImage className="w-3.5 h-3.5 text-app-ink" />
                  <span>Extract Pages as PNG (.zip) →</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Helper reusable layout for PDF -> Output tabs */}
        {(activeConverter === 'pdf-to-word' ||
          activeConverter === 'pdf-to-excel' ||
          activeConverter === 'pdf-to-images') && (() => {
          const meta =
            activeConverter === 'pdf-to-word'
              ? {
                  icon: FileText,
                  eyebrow: 'OPENXML EXPORT · .DOCX',
                  heading: 'Convert PDF to Word Document (.docx)',
                  sub: 'Extracts paragraphs, hierarchy, and clean typography into editable Microsoft Word format.',
                  dropTitle: 'Select a PDF to Convert to Word',
                  dropSub: 'Executes 100% inside browser memory. Zero files leave your computer.',
                  cta: 'Export Word (.docx)',
                  onRun: handlePdfToWord,
                }
              : activeConverter === 'pdf-to-excel'
              ? {
                  icon: FileSpreadsheet,
                  eyebrow: 'SPREADSHEET PARSER · .XLSX',
                  heading: 'Convert PDF to Excel Workbook (.xlsx)',
                  sub: 'Reads table coordinate rows from financial reports and invoices into native Excel sheets.',
                  dropTitle: 'Select a PDF to Convert to Excel',
                  dropSub: 'Turns multi-page tables and itemized sheets directly into .xlsx tabs.',
                  cta: 'Export Excel (.xlsx)',
                  onRun: handlePdfToExcel,
                }
              : {
                  icon: FileImage,
                  eyebrow: 'RETINA RASTER ARCHIVE · .ZIP',
                  heading: 'Convert PDF to High-Res Images (.zip)',
                  sub: 'Renders every page at 2x resolution into lossless PNG files packed inside a single ZIP archive.',
                  dropTitle: 'Select a PDF to Export as PNG Images',
                  dropSub: 'Hardware canvas rendering produces crisp, ready-to-share image sheets.',
                  cta: 'Download Images (.zip)',
                  onRun: handlePdfToImages,
                };
          const ActiveIcon = meta.icon;

          return (
            <div>
              {/* Card Title Row */}
              <div className="flex items-start gap-4 pb-6 mb-6 border-b border-line">
                <div className="w-12 h-12 bg-app text-white flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="hud-label text-app-ink block mb-1">{meta.eyebrow}</span>
                  <h3 className="font-display text-xl sm:text-2xl text-ink-strong tracking-tight">
                    {meta.heading}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-muted mt-1">{meta.sub}</p>
                </div>
              </div>

              {localPdfBytes ? (
                <div className="space-y-6">
                  <div className="p-4 border border-line bg-bg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 border border-line bg-bg-raised text-app-ink flex items-center justify-center shrink-0">
                        <ActiveIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="hud-label text-faint">LOADED DOCUMENT</p>
                        <p className="font-mono text-xs text-ink-strong font-semibold truncate mt-0.5">
                          {localFileName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="h-9 px-3.5 invert-block font-mono text-[10px] font-bold uppercase tracking-[0.12em] cursor-pointer flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-app-ink" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handlePdfUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                      <span className="hud-label text-app-ink border border-line px-2 py-1">
                        READY
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={meta.onRun}
                    disabled={isLoading}
                    className="w-full h-12 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{meta.cta}</span>
                  </button>
                </div>
              ) : (
                <div className="py-10 px-6 border border-dashed border-line-strong hover:border-app-ink bg-bg transition-colors text-center space-y-5">
                  <div className="w-12 h-12 border border-line-strong bg-bg-raised text-app-ink flex items-center justify-center mx-auto">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-xl text-ink-strong mb-1.5">{meta.dropTitle}</h4>
                    <p className="font-sans text-xs sm:text-sm text-muted max-w-md mx-auto">
                      {meta.dropSub}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <label className="w-full sm:w-auto h-11 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer">
                      <UploadCloud className="w-4 h-4" />
                      <span>Choose PDF File</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handlePdfUpload(e.target.files[0]);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSamplePdf}
                      disabled={isLoading}
                      className="w-full sm:w-auto h-11 px-5 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-app-ink" />
                      <span>Try With Sample PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Case 4: Images to PDF */}
        {activeConverter === 'images-to-pdf' && (
          <div>
            <div className="flex items-start gap-4 pb-6 mb-6 border-b border-line">
              <div className="w-12 h-12 bg-app text-white flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="hud-label text-app-ink block mb-1">RASTER TO VECTOR PDF</span>
                <h3 className="font-display text-xl sm:text-2xl text-ink-strong tracking-tight">
                  Convert Images to Single PDF
                </h3>
                <p className="font-sans text-xs sm:text-sm text-muted mt-1">
                  Combine photos, JPG receipts, or PNG scans into one crisp multi-page PDF document.
                </p>
              </div>
            </div>

            <label className="border border-dashed border-line-strong hover:border-app-ink bg-bg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-5">
              <Upload className="w-6 h-6 text-app-ink mb-3" />
              <span className="font-display text-base text-ink-strong">
                Drop Images (JPG, PNG, WebP)
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted mt-1">
                Click to select multiple files
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) setSelectedImages(Array.from(e.target.files));
                }}
                className="hidden"
              />
            </label>

            {selectedImages.length > 0 && (
              <div className="space-y-4">
                <p className="hud-label text-ink-strong">{selectedImages.length} IMAGES QUEUED</p>
                <button
                  onClick={handleImagesToPdf}
                  disabled={isLoading}
                  className="w-full h-12 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Generate Combined PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Case 5 & 6: Word to PDF / Word to Images */}
        {(activeConverter === 'word-to-pdf' || activeConverter === 'word-to-images') && (
          <div>
            <div className="flex items-start gap-4 pb-6 mb-6 border-b border-line">
              <div className="w-12 h-12 bg-app text-white flex items-center justify-center shrink-0">
                {activeConverter === 'word-to-pdf' ? (
                  <FileType className="w-5 h-5" />
                ) : (
                  <FileImage className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="hud-label text-app-ink block mb-1">OPENXML IN-BROWSER CONVERTER</span>
                <h3 className="font-display text-xl sm:text-2xl text-ink-strong tracking-tight">
                  {activeConverter === 'word-to-pdf'
                    ? 'Convert Word (.docx) to PDF'
                    : 'Convert Word (.docx) to PNG Images'}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-muted mt-1">
                  {activeConverter === 'word-to-pdf'
                    ? 'Render Microsoft Word files locally into crisp vector PDF documents.'
                    : 'Render Microsoft Word pages into high-resolution PNG graphics.'}
                </p>
              </div>
            </div>

            <label className="border border-dashed border-line-strong hover:border-app-ink bg-bg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-5">
              <Upload className="w-6 h-6 text-app-ink mb-3" />
              <span className="font-display text-base text-ink-strong">
                {selectedWordFile ? selectedWordFile.name : 'Select Word Document (.docx)'}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted mt-1">
                Zero server uploads · Local DOM parser
              </span>
              <input
                type="file"
                accept=".docx,.doc"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setSelectedWordFile(e.target.files[0]);
                }}
                className="hidden"
              />
            </label>

            {selectedWordFile && (
              <button
                onClick={activeConverter === 'word-to-pdf' ? handleWordToPdf : handleWordToImages}
                disabled={isLoading}
                className="w-full h-12 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>
                  {activeConverter === 'word-to-pdf' ? 'Convert .DOCX to PDF' : 'Export as PNG Image'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Loading Progress */}
        {progressText && (
          <div className="mt-5 p-3.5 border border-app bg-bg flex items-center gap-2.5 hud-label text-app-ink">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{progressText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
