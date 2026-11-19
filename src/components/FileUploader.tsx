import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, Shield, Zap } from 'lucide-react';

interface FileUploaderProps {
  onFileLoaded: (file: File, bytes: ArrayBuffer) => void;
  title?: string;
  subtitle?: string;
  accept?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileLoaded,
  title = "Drop your PDF here to begin",
  subtitle = "Free forever • No file size limits • 100% Client-Side Private",
  accept = ".pdf",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    onFileLoaded(file, arrayBuffer);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  // Generate an instant rich sample document for instant testing!
  const handleLoadSamplePDF = async () => {
    setIsGeneratingSample(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const page1 = doc.addPage([600, 750]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      // Page 1: Professional Service Agreement
      page1.drawText("CONSULTING SERVICES AGREEMENT", {
        x: 50,
        y: 690,
        size: 18,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.4),
      });

      page1.drawText("Date: November 19, 2026   |   Document ID: AGR-88219-X", {
        x: 50,
        y: 665,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.5),
      });

      // Horizontal divider
      page1.drawLine({
        start: { x: 50, y: 650 },
        end: { x: 550, y: 650 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.85),
      });

      const sampleBody = [
        "1. SCOPE OF SERVICES",
        "The Provider agrees to furnish client-side digital infrastructure consulting and web system",
        "design services with 100% privacy and zero external server reliance.",
        "",
        "2. COMPENSATION & FEE SCHEDULE (Sample Table)",
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
        "Confidential Tax ID: 88-3920194 (Test Redaction Area)",
        "",
        "4. ACCEPTANCE & SIGNATURES",
        "By signing below, the parties agree to all terms outlined in this document.",
        "",
        "Client Authorized Representative: _______________________",
        "Signature:                                        Date: ",
      ];

      let currentY = 620;
      for (const line of sampleBody) {
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

      // Page 2: Appendix
      const page2 = doc.addPage([600, 750]);
      page2.drawText("APPENDIX A: TECHNICAL SPECIFICATIONS", {
        x: 50,
        y: 690,
        size: 16,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.4),
      });
      page2.drawText("• Fully client-side processing using WebAssembly and HTML5 Canvas.", {
        x: 50,
        y: 650,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page2.drawText("• Zero backend server latency and zero cloud compute bills.", {
        x: 50,
        y: 625,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      const pdfBytes = await doc.save();
      const sampleBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const sampleFile = new File([sampleBlob], "sample_agreement.pdf", { type: "application/pdf" });
      onFileLoaded(sampleFile, await sampleBlob.arrayBuffer());
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 sm:py-12 px-3 sm:px-4">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-14 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        <input
          type="file"
          accept={accept}
          aria-label="Upload PDF Document"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 sm:mb-5 shadow-inner">
            <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mb-5 sm:mb-6">{subtitle}</p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <button className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Choose PDF File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Or Load Demo PDF */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-200">No PDF on hand right now?</p>
            <p className="text-[11px] text-slate-400">Load a sample 2-page agreement to test signatures, redaction, & tables</p>
          </div>
        </div>
        <button
          onClick={handleLoadSamplePDF}
          disabled={isGeneratingSample}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{isGeneratingSample ? 'Generating...' : 'Try With Sample PDF'}</span>
        </button>
      </div>

      {/* Guarantee Badges */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/80">
          <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-200">100% Private</p>
          <p className="text-[10px] text-slate-400">Zero data sent to any cloud</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/80">
          <Zap className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-200">Instant Processing</p>
          <p className="text-[10px] text-slate-400">Powered by browser WebAssembly</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/80">
          <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-200">Completely Free</p>
          <p className="text-[10px] text-slate-400">No trials, limits, or watermarks</p>
        </div>
      </div>
    </div>
  );
};
