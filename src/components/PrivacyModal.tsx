import React, { useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Trash2,
  HardDrive,
  EyeOff,
  CheckCircle2,
  X,
  ExternalLink,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Zero-Cloud Privacy Architecture</span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Client-Side Only
                </span>
              </h2>
              <p className="text-xs text-slate-400">Technical security disclosure &amp; privacy guarantee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
          {/* Executive Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">The PDFCraft Document Guarantee</p>
              <p className="mt-1 text-slate-300">
                Your PDF documents, contracts, resumes, signatures, and personal data{' '}
                <strong className="text-emerald-400">never leave your device</strong>. Unlike cloud-based PDF tools
                that upload your files to remote servers, PDFCraft executes 100% inside your local web browser memory.
              </p>
            </div>
          </div>

          {/* Technical Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                <Cpu className="w-4 h-4 shrink-0" />
                <span>1. In-Browser Execution</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                PDF rendering, text redaction, page merging, splitting, and conversion are processed entirely by WebAssembly, HTML5 Canvas, and modern Web APIs executing directly on your CPU/GPU.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>2. Ephemeral RAM Memory</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Files exist strictly as transient <code className="text-slate-200">ArrayBuffer</code> objects in browser RAM. Closing the tab, refreshing, or clicking the close button immediately triggers garbage collection.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                <HardDrive className="w-4 h-4 shrink-0" />
                <span>3. Zero Document Storage</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                We do not write your documents or signatures to cookies or persistent database records. Browser storage (<code className="text-slate-200">localStorage</code>) is used exclusively for non-sensitive UI preferences.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>4. Pure Client-Side Crypto</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Password encryption and decryption employ industry-standard Web Crypto AES-256 routines locally. Passwords and keys are never sent across the internet.
              </p>
            </div>
          </div>

          {/* Verification Guide for Engineers */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Independent Verification: How to Inspect Our Network Activity</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-3">
              We encourage security professionals and privacy-conscious users to verify our claims:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
              <li>
                Open Developer Tools in your browser (<kbd className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">F12</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">Ctrl+Shift+I</kbd>).
              </li>
              <li>
                Switch to the <strong>Network</strong> tab and check &quot;Fetch/XHR&quot;.
              </li>
              <li>
                Upload, sign, redact, compress, or merge any document.
              </li>
              <li>
                Observe that <strong className="text-emerald-400">zero HTTP POST or PUT requests</strong> containing document bytes are transmitted. You can even disconnect your internet Wi-Fi before processing!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">PDFCraft • 100% Open &amp; Private</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
