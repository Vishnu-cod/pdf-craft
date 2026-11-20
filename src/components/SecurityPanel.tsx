import React, { useState, useEffect } from 'react';
import {
  protectPDF,
  unlockPDF,
  isPDFEncrypted,
  downloadBlob,
} from '../utils/pdfEngine';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  UploadCloud,
  FileText,
  Shield,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SecurityPanelProps {
  pdfBytes?: ArrayBuffer;
  fileName?: string;
  initialMode?: 'protect' | 'unlock';
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  pdfBytes,
  fileName = 'document.pdf',
  initialMode = 'protect',
  onFileLoaded,
}) => {
  const [mode, setMode] = useState<'protect' | 'unlock'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Protect state
  const [protectPassword, setProtectPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowAnnotating, setAllowAnnotating] = useState(false);

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState('');

  // Processing & Status state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadReadyBytes, setDownloadReadyBytes] = useState<Uint8Array | null>(null);
  const [downloadReadyName, setDownloadReadyName] = useState<string>('');

  // Execute Password Protection
  const handleProtect = async () => {
    if (!pdfBytes) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setDownloadReadyBytes(null);

    if (!protectPassword || protectPassword.trim().length === 0) {
      setErrorMessage('Please enter a password to protect your PDF.');
      return;
    }

    if (protectPassword.length < 4) {
      setErrorMessage('Password should be at least 4 characters long.');
      return;
    }

    if (protectPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password to avoid being locked out.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Encrypt with AES-256
      const protectedBytes = await protectPDF(pdfBytes, {
        userPassword: protectPassword,
        permissions: {
          printing: allowPrinting ? 'highResolution' : false,
          copying: allowCopying,
          annotating: allowAnnotating,
          modifying: false,
        },
      });

      // 2. Perform automated integrity verification: confirm it requires password
      const verifySuccess = await (async () => {
        try {
          await unlockPDF(protectedBytes.buffer as ArrayBuffer, protectPassword);
          return true;
        } catch {
          return false;
        }
      })();

      if (!verifySuccess) {
        throw new Error('Verification failed: the encrypted document could not be unlocked with the set password.');
      }

      const outName = fileName.replace(/\.pdf$/i, '') + '_protected.pdf';
      setDownloadReadyBytes(protectedBytes);
      setDownloadReadyName(outName);
      setStatusMessage('Document successfully encrypted with AES-256 password protection and verified!');
      confetti({ particleCount: 60, spread: 50 });
    } catch (err: any) {
      console.error('Protection failed:', err);
      setErrorMessage(err?.message || 'Failed to encrypt document. Please check the file and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Password Decryption & Unlocking
  const handleUnlock = async () => {
    if (!pdfBytes) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setDownloadReadyBytes(null);

    if (!unlockPassword || unlockPassword.trim().length === 0) {
      setErrorMessage('Please enter the document password.');
      return;
    }

    setIsProcessing(true);
    try {
      const unlockedBytes = await unlockPDF(pdfBytes, unlockPassword);
      const outName = fileName.replace(/\.pdf$/i, '') + '_unlocked.pdf';
      setDownloadReadyBytes(unlockedBytes);
      setDownloadReadyName(outName);
      setStatusMessage('Password verified! The document has been unlocked and encryption removed.');
      confetti({ particleCount: 60, spread: 50 });
    } catch (err: any) {
      console.error('Unlock failed:', err);
      setErrorMessage('Incorrect password. The document could not be decrypted. Please verify the password and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadReadyBytes || !downloadReadyName) return;
    downloadBlob(downloadReadyBytes, downloadReadyName);
  };

  if (!pdfBytes) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Protect or Unlock PDF</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Add military-grade AES-256 password encryption to confidential documents, or remove passwords from files you legitimately own.
        </p>
        <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 cursor-pointer transition">
          <UploadCloud className="w-4 h-4" />
          <span>Select PDF Document</span>
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {mode === 'protect' ? <Lock className="w-5 h-5 text-indigo-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
            <span>{mode === 'protect' ? 'Password Protect PDF' : 'Unlock & Decrypt PDF'}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
              AES-256
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Active file: <span className="font-mono text-slate-300">{fileName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('protect');
                setErrorMessage(null);
                setStatusMessage(null);
                setDownloadReadyBytes(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'protect' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Protect
            </button>
            <button
              onClick={() => {
                setMode('unlock');
                setErrorMessage(null);
                setStatusMessage(null);
                setDownloadReadyBytes(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'unlock' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unlock
            </button>
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition">
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Change</span>
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
      </div>

      {/* Main Form Container */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        {mode === 'protect' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Set Document Password</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Anyone attempting to open this PDF will be prompted to enter this password.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Document Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={protectPassword}
                    onChange={(e) => setProtectPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            {/* Permission Flags */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-300">Document Permissions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200">Allow Printing</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={allowCopying}
                    onChange={(e) => setAllowCopying(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200">Allow Copying Text</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={allowAnnotating}
                    onChange={(e) => setAllowAnnotating(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200">Allow Annotations</span>
                </label>
              </div>
            </div>

            {/* Security Explanation Box */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-white">Military-Grade AES-256 Client-Side Encryption</p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Encryption takes place 100% inside your browser memory using the standard ISO 32000-2 security handler. Your password is never sent to any server.
                </p>
              </div>
            </div>

            <button
              onClick={handleProtect}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encrypting &amp; Verifying PDF...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Encrypt &amp; Protect Document</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Enter Document Password to Unlock</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide the password given to you by the document owner to remove password encryption and export an unlocked copy.
              </p>
            </div>

            <div className="max-w-md space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Document Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter owner password..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ethical Security Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Legitimate Decryption Standard</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                PDFCraft respects encryption standards and does not attempt brute-force attacks or unauthorized security bypasses. Unlocking is performed cleanly using the legitimate owner credentials.
              </p>
            </div>

            <button
              onClick={handleUnlock}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Decrypting document...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock &amp; Decrypt PDF</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner & Download Action */}
        {statusMessage && downloadReadyBytes && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-300 font-mono">
                {downloadReadyName} ({Math.round(downloadReadyBytes.length / 1024)} KB)
              </span>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Resulting PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
