import React, { useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Trash2,
  HardDrive,
  CheckCircle2,
  X,
  Terminal,
} from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-bg border border-line-strong flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-bg-raised">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-app text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="privacy-modal-title" className="font-display text-lg text-ink-strong">
                  Zero-Cloud Privacy Architecture
                </h2>
                <span className="hud-label text-[9px] text-app-ink border border-line px-1.5 py-0.5">
                  Client-Side Only
                </span>
              </div>
              <p className="font-sans text-xs text-muted mt-0.5">
                Technical security disclosure &amp; verifiable network guarantee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy modal"
            className="p-2 border border-line text-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-ink leading-relaxed">
          {/* Executive Guarantee */}
          <div className="p-4 border border-line-strong bg-bg-raised flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-app-ink shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-sm text-ink-strong">The PDFCraft Document Guarantee</p>
              <p className="mt-1 text-muted">
                Your PDF documents, contracts, resumes, signatures, and personal data{' '}
                <strong className="text-ink-strong">never leave your device</strong>. Unlike cloud-based PDF tools
                that upload your files to remote servers, PDFCraft executes 100% inside local browser memory.
              </p>
            </div>
          </div>

          {/* Technical Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
            <div className="p-4 bg-bg">
              <div className="flex items-center gap-2 hud-label text-app-ink mb-2">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>01 / In-Browser Execution</span>
              </div>
              <p className="text-muted text-[11px]">
                Rendering, text redaction, page merging, splitting, and conversion are processed entirely by WebAssembly, HTML5 Canvas, and Web APIs on your CPU/GPU.
              </p>
            </div>

            <div className="p-4 bg-bg">
              <div className="flex items-center gap-2 hud-label text-ink-strong mb-2">
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>02 / Ephemeral RAM Memory</span>
              </div>
              <p className="text-muted text-[11px]">
                Files exist strictly as transient <code className="font-mono text-ink-strong">ArrayBuffer</code> objects in RAM. Closing or refreshing immediately clears memory.
              </p>
            </div>

            <div className="p-4 bg-bg">
              <div className="flex items-center gap-2 hud-label text-ink-strong mb-2">
                <HardDrive className="w-3.5 h-3.5 shrink-0" />
                <span>03 / Zero Storage</span>
              </div>
              <p className="text-muted text-[11px]">
                No documents or signatures are persisted to cookies or databases. Browser <code className="font-mono text-ink-strong">localStorage</code> stores UI theme preferences only.
              </p>
            </div>

            <div className="p-4 bg-bg">
              <div className="flex items-center gap-2 hud-label text-app-ink mb-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>04 / Client-Side Crypto</span>
              </div>
              <p className="text-muted text-[11px]">
                Encryption and password removal employ pure client-side routines locally. Passwords and keys are never sent over the wire.
              </p>
            </div>
          </div>

          {/* Verification Guide */}
          <div className="p-4 border border-line bg-bg-sunken">
            <div className="flex items-center gap-2 hud-label text-ink-strong mb-2">
              <Terminal className="w-3.5 h-3.5 text-app-ink" />
              <span>Verify Zero-Network Claims Independently</span>
            </div>
            <p className="text-muted text-[11px] mb-3">
              Inspect network activity yourself in DevTools:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-muted">
              <li>
                Open Developer Tools (<kbd className="border border-line px-1 py-0.5 font-mono text-ink-strong">F12</kbd> or <kbd className="border border-line px-1 py-0.5 font-mono text-ink-strong">Ctrl+Shift+I</kbd>).
              </li>
              <li>Switch to the <strong className="text-ink-strong">Network</strong> tab and filter by Fetch/XHR.</li>
              <li>Upload, sign, redact, compress, or merge any document.</li>
              <li>
                Observe <strong className="text-app-ink">zero HTTP POST or PUT requests</strong> containing document bytes. Disconnect Wi-Fi and it continues working.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-bg-raised border-t border-line flex items-center justify-between">
          <span className="hud-label text-faint">PDFCRAFT · OPEN &amp; PRIVATE</span>
          <button
            onClick={onClose}
            className="h-10 px-6 bg-invert-bg text-invert-fg font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-80 transition-opacity cursor-pointer"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};
