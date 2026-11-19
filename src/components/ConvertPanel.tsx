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
    setIsLoading(true);
    setProgressText('Extracting text and compiling OpenXML Word (.docx)...');
    try {
      await convertPDFToWordDocx(localPdfBytes, localFileName);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      alert('Failed to convert to Word: ' + err?.message);
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
    setIsLoading(true);
    setProgressText('Scanning document coordinates into multi-page Excel workbook...');
    try {
      await convertPDFToExcelAllPages(localPdfBytes, localFileName);
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      console.error(err);
      alert('Failed to convert to Excel: ' + err?.message);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal Client-Side Converters</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">Convert Any Document For Free</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
          Convert PDF to Word, Excel, and Images, or convert Word and Images into clean PDFs with zero file limits.
        </p>
      </div>

      {/* Converter Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8">
        {converters.map((conv) => {
          const Icon = conv.icon;
          const isSelected = activeConverter === conv.id;
          return (
            <button
              key={conv.id}
              onClick={() => setActiveConverter(conv.id as any)}
              className={`p-3 rounded-2xl flex flex-col items-center text-center transition border ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-5 h-5 mb-1.5" />
              <span className="text-[11px] font-bold leading-tight">{conv.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Converter Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-xl">
        {/* Case 1: PDF to Word */}
        {activeConverter === 'pdf-to-word' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Convert PDF to Word Document (.docx)</h3>
                <p className="text-xs text-slate-400">
                  Exports your PDF into an editable Microsoft Word .docx file with clean paragraphs.
                </p>
              </div>
            </div>

            {localPdfBytes ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Current PDF</p>
                      <p className="text-xs font-mono text-indigo-300 truncate">{localFileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
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
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      Ready
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePdfToWord}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Export to Word (.docx)</span>
                </button>
              </div>
            ) : (
              <div className="py-8 px-4 border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl bg-slate-950/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Select a PDF to Convert to Word</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Converts paragraphs, headings, and formatting into clean Microsoft Word OpenXML (.docx).
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Try With Sample PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Case 2: PDF to Excel */}
        {activeConverter === 'pdf-to-excel' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Convert PDF to Excel Spreadsheet (.xlsx)</h3>
                <p className="text-xs text-slate-400">
                  Reads coordinate positions of tables and financial data, exporting each page to a spreadsheet tab.
                </p>
              </div>
            </div>

            {localPdfBytes ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Current PDF</p>
                      <p className="text-xs font-mono text-emerald-300 truncate">{localFileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
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
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      Ready
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePdfToExcel}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Export to Excel (.xlsx)</span>
                </button>
              </div>
            ) : (
              <div className="py-8 px-4 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl bg-slate-950/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Select a PDF to Convert to Excel</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Converts invoices, receipts, and table coordinate rows directly into Microsoft Excel (.xlsx).
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Try With Sample PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Case 3: PDF to Images */}
        {activeConverter === 'pdf-to-images' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Convert PDF to High-Res Images (.zip)</h3>
                <p className="text-xs text-slate-400">
                  Renders every page into crisp PNG images packed into a single organized ZIP download.
                </p>
              </div>
            </div>

            {localPdfBytes ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Current PDF</p>
                      <p className="text-xs font-mono text-purple-300 truncate">{localFileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
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
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      Ready
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePdfToImages}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download Images (.zip)</span>
                </button>
              </div>
            ) : (
              <div className="py-8 px-4 border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 rounded-2xl bg-slate-950/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Select a PDF to Convert to PNG Images</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Renders high-res 2x retina images of every page and bundles them into an organized ZIP.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition">
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Try With Sample PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Case 4: Images to PDF */}
        {activeConverter === 'images-to-pdf' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Convert Images to PDF</h3>
                <p className="text-xs text-slate-400">
                  Select multiple photos, receipts, or scans to combine them into one clean PDF document.
                </p>
              </div>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition mb-4">
              <Upload className="w-6 h-6 text-indigo-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-200">Drop Images (JPG, PNG, WebP)</span>
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
                <p className="text-xs text-slate-400">{selectedImages.length} images selected</p>
                <button
                  onClick={handleImagesToPdf}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Generate PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Case 5: Word to PDF */}
        {activeConverter === 'word-to-pdf' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FileType className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Convert Word (.docx) to PDF</h3>
                <p className="text-xs text-slate-400">
                  Upload a Word document to convert it client-side into a crisp, vector-formatted PDF.
                </p>
              </div>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition mb-4">
              <Upload className="w-6 h-6 text-blue-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedWordFile ? selectedWordFile.name : 'Select Word Document (.docx)'}
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
                onClick={handleWordToPdf}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Convert to PDF</span>
              </button>
            )}
          </div>
        )}

        {/* Case 6: Word to Images */}
        {activeConverter === 'word-to-images' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Convert Word (.docx) to Images</h3>
                <p className="text-xs text-slate-400">
                  Render your Word file into high-res PNG images for easy sharing or presentations.
                </p>
              </div>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition mb-4">
              <Upload className="w-6 h-6 text-amber-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedWordFile ? selectedWordFile.name : 'Select Word Document (.docx)'}
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
                onClick={handleWordToImages}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Export as Image (.png)</span>
              </button>
            )}
          </div>
        )}

        {/* Loading Progress */}
        {progressText && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{progressText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
