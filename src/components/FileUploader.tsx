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
  title = 'Drop any PDF here to launch the workbench',
  subtitle = 'Zero account • No telemetry • 100% client-side WebAssembly execution',
  accept = '.pdf',
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

  const handleLoadSamplePDF = async () => {
    setIsGeneratingSample(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const page1 = doc.addPage([600, 750]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      page1.drawText('CONSULTING SERVICES AGREEMENT', {
        x: 50,
        y: 690,
        size: 18,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.4),
      });

      page1.drawText('Date: November 19, 2026   |   Document ID: AGR-88219-X', {
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

      const sampleBody = [
        '1. SCOPE OF SERVICES',
        'The Provider agrees to furnish client-side digital infrastructure consulting and web system',
        'design services with 100% privacy and zero external server reliance.',
        '',
        '2. COMPENSATION & FEE SCHEDULE (Sample Table)',
        'Service Item                         Hours       Rate ($/hr)      Total ($)',
        '----------------------------------------------------------------------------',
        'Architecture & System Design          16           $120.00         $1,920.00',
        'Canvas & PDF Engine Integration       24           $120.00         $2,880.00',
        'Client-Side Cryptographic Audit       10           $130.00         $1,300.00',
        '----------------------------------------------------------------------------',
        'ESTIMATED TOTAL                                                   $6,100.00',
        '',
        '3. CONFIDENTIALITY & DATA PROTECTION',
        'Neither party shall disclose confidential records, bank credentials, or tax identifications.',
        'Confidential Tax ID: 88-3920194 (Test Redaction Area)',
        '',
        '4. ACCEPTANCE & SIGNATURES',
        'By signing below, the parties agree to all terms outlined in this document.',
        '',
        'Client Authorized Representative: _______________________',
        'Signature:                                        Date: ',
      ];

      let currentY = 620;
      for (const line of sampleBody) {
        const isHeader =
          line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.');
        page1.drawText(line, {
          x: 50,
          y: currentY,
          size: isHeader ? 11 : 9.5,
          font: isHeader ? fontBold : font,
          color: isHeader ? rgb(0.1, 0.15, 0.3) : rgb(0.2, 0.25, 0.3),
        });
        currentY -= 17;
      }

      const page2 = doc.addPage([600, 750]);
      page2.drawText('APPENDIX A: TECHNICAL SPECIFICATIONS', {
        x: 50,
        y: 690,
        size: 16,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.4),
      });
      page2.drawText('• Fully client-side processing using WebAssembly and HTML5 Canvas.', {
        x: 50,
        y: 650,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page2.drawText('• Zero backend server latency and zero cloud compute bills.', {
        x: 50,
        y: 625,
        size: 11,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      const pdfBytes = await doc.save();
      const sampleBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], 'sample_agreement.pdf', { type: 'application/pdf' });
      onFileLoaded(sampleFile, await sampleBlob.arrayBuffer());
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hairline Dropzone Frame */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border border-dashed transition-colors cursor-pointer p-8 sm:p-14 text-center ${
          isDragging
            ? 'border-app-ink bg-bg-raised'
            : 'border-line-strong bg-bg-raised/70 hover:border-ink hover:bg-bg-raised'
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
          <div className="w-12 h-12 border border-line-strong bg-bg text-app-ink flex items-center justify-center mb-5">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="hud-label text-app-ink mb-2">CLIENT-SIDE DROPZONE · ZERO UPLOAD</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-[-0.02em] text-ink-strong mb-2">{title}</h2>
          <p className="font-sans text-sm text-muted max-w-md mb-6">{subtitle}</p>

          <div className="flex items-center justify-center">
            <span className="h-12 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Choose PDF File</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Metadata & Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-line border-t border-line">
        <div className="md:col-span-6 bg-bg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <p className="hud-label text-muted">SAMPLE WORKBENCH</p>
            <p className="font-sans text-xs text-faint mt-1">
              Load a 2-page agreement to test signatures, redaction &amp; tables
            </p>
          </div>
          <button
            onClick={handleLoadSamplePDF}
            disabled={isGeneratingSample}
            className="h-10 px-4 invert-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-app-ink" />
            <span>{isGeneratingSample ? 'Generating...' : 'Load Sample PDF'}</span>
          </button>
        </div>

        <div className="md:col-span-2 bg-bg p-4 flex flex-col justify-between">
          <Shield className="w-4 h-4 text-app-ink mb-2" />
          <div>
            <p className="hud-label text-ink">100% PRIVATE</p>
            <p className="text-[11px] text-faint mt-0.5">No server storage</p>
          </div>
        </div>

        <div className="md:col-span-2 bg-bg p-4 flex flex-col justify-between">
          <Zap className="w-4 h-4 text-ink mb-2" />
          <div>
            <p className="hud-label text-ink">LOCAL WASM</p>
            <p className="text-[11px] text-faint mt-0.5">Browser CPU/GPU</p>
          </div>
        </div>

        <div className="md:col-span-2 bg-bg p-4 flex flex-col justify-between">
          <Sparkles className="w-4 h-4 text-app-ink mb-2" />
          <div>
            <p className="hud-label text-ink">OPEN SOURCE</p>
            <p className="text-[11px] text-faint mt-0.5">Zero paywalls</p>
          </div>
        </div>
      </div>
    </div>
  );
};
