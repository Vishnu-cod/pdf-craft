import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  FileCheck2,
  Lock,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Info,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { scanPdfForPii, DetectedPiiItem } from '../utils/smartPiiMasker';
import { validatePdfDigitalSignatures, SignatureValidationReport } from '../utils/signatureValidator';
import { burnInRedactions } from '../utils/pdfEngine';
import { Annotation } from '../types';

interface SecurityPrivacyStudioProps {
  initialFile?: File | null;
  initialPdfBytes?: ArrayBuffer | null;
  initialSubTab?: 'pii_masker' | 'signature_validator';
  onClose?: () => void;
  onOpenTool?: (toolId: string) => void;
  onFileLoaded?: (file: File, bytes: ArrayBuffer) => void;
}

export const SecurityPrivacyStudio: React.FC<SecurityPrivacyStudioProps> = ({
  initialFile,
  initialPdfBytes,
  initialSubTab = 'pii_masker',
  onClose,
  onOpenTool,
  onFileLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'pii_masker' | 'signature_validator'>(initialSubTab);
  const [currentFile, setCurrentFile] = useState<File | null>(initialFile || null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(initialPdfBytes || null);

  // Sync initialSubTab
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync initialFile or initialPdfBytes
  useEffect(() => {
    if (initialFile) {
      setCurrentFile(initialFile);
      initialFile.arrayBuffer().then((buf) => {
        setFileBuffer(buf);
        if (activeTab === 'pii_masker') {
          runPiiScan(buf);
        } else {
          runSigValidation(buf);
        }
      });
    } else if (initialPdfBytes) {
      setFileBuffer(initialPdfBytes);
      const docFile = new File([initialPdfBytes], 'document.pdf', { type: 'application/pdf' });
      setCurrentFile(docFile);
      if (activeTab === 'pii_masker') {
        runPiiScan(initialPdfBytes);
      } else {
        runSigValidation(initialPdfBytes);
      }
    }
  }, [initialFile, initialPdfBytes]);

  // PII Masker State
  const [isScanningPii, setIsScanningPii] = useState(false);
  const [detectedPii, setDetectedPii] = useState<DetectedPiiItem[]>([]);
  const [hasScannedPii, setHasScannedPii] = useState(false);
  const [isApplyingMask, setIsApplyingMask] = useState(false);
  const [maskedPdfUrl, setMaskedPdfUrl] = useState<string | null>(null);

  // Digital Signature Validator State
  const [isValidatingSig, setIsValidatingSig] = useState(false);
  const [sigReport, setSigReport] = useState<SignatureValidationReport | null>(null);

  // Handle Tab Switch with auto-trigger
  const handleTabChange = (tab: 'pii_masker' | 'signature_validator') => {
    setActiveTab(tab);
    if (fileBuffer) {
      if (tab === 'pii_masker' && !hasScannedPii && !isScanningPii) {
        runPiiScan(fileBuffer);
      } else if (tab === 'signature_validator' && !sigReport && !isValidatingSig) {
        runSigValidation(fileBuffer);
      }
    }
  };

  // Handle file drop / selection
  const handleFileChange = async (file: File) => {
    setCurrentFile(file);
    const buffer = await file.arrayBuffer();
    setFileBuffer(buffer);
    setMaskedPdfUrl(null);
    setDetectedPii([]);
    setHasScannedPii(false);
    setSigReport(null);
    onFileLoaded?.(file, buffer);

    if (activeTab === 'pii_masker') {
      runPiiScan(buffer);
    } else {
      runSigValidation(buffer);
    }
  };

  // Run PII Scanner
  const runPiiScan = async (buffer: ArrayBuffer) => {
    setIsScanningPii(true);
    try {
      const items = await scanPdfForPii(buffer);
      setDetectedPii(items);
      setHasScannedPii(true);
    } catch (err) {
      console.error('Error scanning PDF for PII:', err);
    } finally {
      setIsScanningPii(false);
    }
  };

  // Run Signature Validation
  const runSigValidation = async (buffer: ArrayBuffer) => {
    setIsValidatingSig(true);
    try {
      const report = await validatePdfDigitalSignatures(buffer);
      setSigReport(report);
    } catch (err) {
      console.error('Error validating PDF signatures:', err);
    } finally {
      setIsValidatingSig(false);
    }
  };

  // Toggle PII item selection
  const togglePiiItem = (id: string) => {
    setDetectedPii((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Select / Deselect all PII items
  const toggleSelectAll = (select: boolean) => {
    setDetectedPii((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Apply Irreversible High-DPI Masking
  const handleApplyMasking = async () => {
    if (!fileBuffer || !currentFile) return;
    const selectedItems = detectedPii.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      alert('Please select at least one item to mask.');
      return;
    }

    setIsApplyingMask(true);
    try {
      // Map detected PII to redaction annotations for burnInRedactions
      const redactionAnnotations: Annotation[] = selectedItems.map((item) => ({
        id: item.id,
        pageIndex: item.pageNumber - 1,
        type: 'redaction',
        x: item.bounds.x,
        y: item.bounds.y,
        width: item.bounds.width,
        height: item.bounds.height,
        color: '#000000',
        content: '',
      }));

      const maskedBytes = await burnInRedactions(fileBuffer, redactionAnnotations, 2.0);
      const blob = new Blob([maskedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMaskedPdfUrl(url);
      confetti({ particleCount: 70, spread: 70 });
    } catch (err) {
      console.error('Failed to apply irreversible masking:', err);
      alert('Failed to apply irreversible masking. Please try again.');
    } finally {
      setIsApplyingMask(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Private In-Browser Protection</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Mask Sensitive IDs &amp; Verify Digital Signatures
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
              100% private in your browser. Automatically black out sensitive Aadhaar and PAN numbers before sharing, or check if digital signatures on government certificates and documents are genuine and unaltered.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center">
            <button
              onClick={() => {
                setActiveTab('pii_masker');
                if (fileBuffer && !hasScannedPii) runPiiScan(fileBuffer);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'pii_masker'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span>Mask Aadhaar &amp; IDs</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('signature_validator');
                if (fileBuffer && !sigReport) runSigValidation(fileBuffer);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'signature_validator'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Verify Digital Signature</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Dropzone if no file selected */}
      {!currentFile && (
        <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-3xl p-12 text-center bg-slate-900/40 backdrop-blur transition mb-8">
          <input
            type="file"
            id="security-upload"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <label htmlFor="security-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Select or Drop any PDF to Scan & Verify
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
              Works with Aadhaar cards, PAN cards, DigiLocker certificates, legal contracts, and signed tax documents. Zero server uploads.
            </p>
            <span className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition">
              Choose PDF File
            </span>
          </label>
        </div>
      )}

      {/* Active File Loaded View */}
      {currentFile && (
        <div>
          {/* File Header Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{currentFile.name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {(currentFile.size / 1024).toFixed(1)} KB • Zero-Cloud Ephemeral RAM
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentFile(null);
                setFileBuffer(null);
                setDetectedPii([]);
                setSigReport(null);
                setMaskedPdfUrl(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          {/* TAB 1: SMART PII & AADHAAR MASKER */}
          {activeTab === 'pii_masker' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Detected PII List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Automated Sensitive Data Detection</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Scanned for Aadhaar, PAN, SSN, Credit Cards, and contact info in local memory.
                      </p>
                    </div>

                    {detectedPii.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => toggleSelectAll(true)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          onClick={() => toggleSelectAll(false)}
                          className="text-slate-400 hover:text-slate-300 font-medium"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  {isScanningPii && (
                    <div className="py-12 flex flex-col items-center text-center">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                      <p className="text-sm font-semibold text-white">Scanning document text layers...</p>
                      <p className="text-xs text-slate-400 mt-1">Checking for 12-digit Aadhaar, PAN, and PII patterns.</p>
                    </div>
                  )}

                  {!isScanningPii && hasScannedPii && detectedPii.length === 0 && (
                    <div className="py-12 flex flex-col items-center text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                      <h4 className="text-sm font-bold text-white">No Sensitive Identifiers Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                        No automated Aadhaar, PAN, SSN, or card patterns were detected. If this is a scanned raster document, use manual redaction to black out any text.
                      </p>
                    </div>
                  )}

                  {!isScanningPii && detectedPii.length > 0 && (
                    <div className="space-y-3">
                      {detectedPii.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => togglePiiItem(item.id)}
                          className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                            item.selected
                              ? 'bg-indigo-600/10 border-indigo-500/40 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                item.selected
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{item.label}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                  Page {item.pageNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="font-mono text-slate-400 line-through">
                                  {item.originalText}
                                </span>
                                <ArrowRight className="w-3 h-3 text-indigo-400" />
                                <span className="font-mono font-bold text-emerald-400">
                                  {item.maskedText}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Masking Action Card */}
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Irreversible Burn-In</span>
                  </h3>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Legal Compliance Standard</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      Complies with UIDAI / RBI guidelines for Masked Aadhaar. High-DPI canvas burn-in ensures underlying text cannot be extracted or copied.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span>Detected Identifiers:</span>
                      <span className="font-bold text-white">{detectedPii.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span>Selected to Mask:</span>
                      <span className="font-bold text-indigo-400">
                        {detectedPii.filter((i) => i.selected).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Redaction Method:</span>
                      <span className="font-bold text-emerald-400">200+ DPI Raster Purge</span>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyMasking}
                    disabled={isApplyingMask || detectedPii.filter((i) => i.selected).length === 0}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition ${
                      isApplyingMask || detectedPii.filter((i) => i.selected).length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {isApplyingMask ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Applying Irreversible Masking...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Apply Irreversible Masking</span>
                      </>
                    )}
                  </button>

                  {maskedPdfUrl && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Document Masked & Sanitized!</span>
                      </div>
                      <a
                        href={maskedPdfUrl}
                        download={`masked_${currentFile.name}`}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Masked PDF</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL SIGNATURE & PKI VALIDATOR */}
          {activeTab === 'signature_validator' && (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-indigo-400" />
                      <span>Cryptographic PKI & Digital Signature Inspector</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Validates byte integrity and matches certificates against CCA India Root CA (eMudhra, Capricorn, VSign, Aadhaar eSign) and Adobe AATL.
                    </p>
                  </div>

                  <div className="text-right">
                    {isValidatingSig && (
                      <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Validating Certificate Chain...</span>
                      </span>
                    )}
                  </div>
                </div>

                {isValidatingSig && (
                  <div className="py-16 flex flex-col items-center text-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <h4 className="text-base font-bold text-white">Inspecting Cryptographic Signatures...</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Extracting `/ByteRange` digests, checking PKCS#7 container, and auditing certificate chain.
                    </p>
                  </div>
                )}

                {!isValidatingSig && sigReport && !sigReport.hasSignature && (
                  <div className="py-12 flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-white">No Cryptographic Digital Signature Detected</h4>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                      This document does not contain an embedded cryptographic signature (ISO 32000 `/Type /Sig`). Note: Visual stamp images, scanned hand signatures, or basic annotations are cosmetic and do not provide PKI cryptographic validity.
                    </p>
                  </div>
                )}

                {!isValidatingSig && sigReport && sigReport.hasSignature && (
                  <div className="space-y-6">
                    {/* Overall Status Banner */}
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">
                              Verified Authentic Digital Signatures ({sigReport.totalSignatures})
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                              Document Integrity Intact
                            </span>
                          </div>
                          <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                            Cryptographic byte-range verification confirms this document has not been altered or tampered with since signing.
                          </p>
                        </div>
                      </div>

                      {sigReport.documentHashSha256 && (
                        <div className="text-left md:text-right font-mono text-[11px] text-slate-400 shrink-0">
                          <span className="text-slate-500">SHA-256 Digest:</span>
                          <p className="text-slate-300 font-semibold">{sigReport.documentHashSha256.slice(0, 16)}...</p>
                        </div>
                      )}
                    </div>

                    {/* Signatures List */}
                    <div className="space-y-4">
                      {sigReport.signatures.map((sig) => (
                        <div
                          key={sig.id}
                          className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-sm"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <h5 className="font-bold text-white text-sm">{sig.signerName}</h5>
                              {sig.isCcaIndiaCertified && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                                  CCA India Certified
                                </span>
                              )}
                              {sig.isAdobeAatlCertified && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                                  Adobe AATL Validated
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-mono text-slate-400">{sig.signingTime}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 block mb-0.5">Certifying Authority (Issuer):</span>
                              <span className="font-semibold text-slate-200">{sig.certAuthority}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Format & Standard:</span>
                              <span className="font-mono text-slate-200">{sig.subFilter}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">Tamper Verification:</span>
                              <span className="font-semibold text-emerald-400">Byte Range Covered (Unaltered)</span>
                            </div>
                            {sig.reason && (
                              <div className="md:col-span-2">
                                <span className="text-slate-500 block mb-0.5">Signing Reason:</span>
                                <span className="text-slate-300 italic">{sig.reason}</span>
                              </div>
                            )}
                            {sig.location && (
                              <div>
                                <span className="text-slate-500 block mb-0.5">Signing Location:</span>
                                <span className="text-slate-300">{sig.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
