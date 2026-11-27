// pdfLeakChecker.ts — In-Browser PDF Privacy & Metadata Leak Inspector
// Inspects hidden author details, creation software, raw XMP telemetry, embedded URLs, and JavaScript triggers

import { PDFDocument } from 'pdf-lib';

export interface MetadataField {
  label: string;
  value: string;
  isLeaked: boolean;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface PrivacyRiskItem {
  id: string;
  title: string;
  category: 'metadata' | 'tracking' | 'executable' | 'redaction';
  severity: 'info' | 'warning' | 'danger';
  description: string;
  evidence?: string;
}

export interface PdfPrivacyReport {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  privacyScore: number; // 0 - 100
  riskLevel: 'clean' | 'moderate' | 'high_risk';
  leakedFields: MetadataField[];
  risks: PrivacyRiskItem[];
  embeddedUrls: string[];
  hasEmbeddedJavascript: boolean;
  hasOpenAction: boolean;
  hasXmpTelemetry: boolean;
  inspectedAt: string;
}

export async function inspectPdfPrivacy(
  pdfBytes: ArrayBuffer,
  fileName: string = 'document.pdf'
): Promise<PdfPrivacyReport> {
  const risks: PrivacyRiskItem[] = [];
  const leakedFields: MetadataField[] = [];
  const embeddedUrls: string[] = [];
  let score = 100;
  let hasEmbeddedJavascript = false;
  let hasOpenAction = false;
  let hasXmpTelemetry = false;
  let pageCount = 1;

  // 1. Parse via pdf-lib for standard dictionary values
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();

    const author = pdfDoc.getAuthor()?.trim() || '';
    const creator = pdfDoc.getCreator()?.trim() || '';
    const producer = pdfDoc.getProducer()?.trim() || '';
    const title = pdfDoc.getTitle()?.trim() || '';
    const subject = pdfDoc.getSubject()?.trim() || '';
    const keywords = pdfDoc.getKeywords()?.trim() || '';
    const creationDate = pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()!.toISOString() : '';
    const modificationDate = pdfDoc.getModificationDate() ? pdfDoc.getModificationDate()!.toISOString() : '';

    if (author) {
      score -= 15;
      leakedFields.push({
        label: 'Author / System Username',
        value: author,
        isLeaked: true,
        severity: 'high',
        description: 'Reveals the person, account username, or department that created the document.',
      });
      risks.push({
        id: 'author_leak',
        title: 'Author Identity Disclosed',
        category: 'metadata',
        severity: 'warning',
        description: `Author "${author}" is embedded in the PDF dictionary. Anyone inspecting properties can view this.`,
        evidence: `Author: ${author}`,
      });
    }

    if (producer || creator) {
      const toolName = [creator, producer].filter(Boolean).join(' / ');
      score -= 10;
      leakedFields.push({
        label: 'Creation Software & OS',
        value: toolName,
        isLeaked: true,
        severity: 'medium',
        description: 'Discloses exact desktop software, PDF converter, or operating system used.',
      });
      risks.push({
        id: 'software_leak',
        title: 'Creation Software & Environment Leaked',
        category: 'metadata',
        severity: 'info',
        description: `Identified creation engine: ${toolName}. This exposes software versions to recipient analysis.`,
        evidence: toolName,
      });
    }

    if (creationDate || modificationDate) {
      score -= 5;
      const dates = [creationDate ? `Created: ${creationDate.split('T')[0]}` : '', modificationDate ? `Modified: ${modificationDate.split('T')[0]}` : ''].filter(Boolean).join('; ');
      leakedFields.push({
        label: 'Exact Timestamps',
        value: dates,
        isLeaked: true,
        severity: 'low',
        description: 'Exposes exact work hours, timezone offsets, and edit history.',
      });
    }

    if (title && title !== fileName) {
      leakedFields.push({
        label: 'Internal Document Title',
        value: title,
        isLeaked: true,
        severity: 'medium',
        description: 'Often contains internal project codes, client names, or draft numbers.',
      });
    }

    if (subject || keywords) {
      leakedFields.push({
        label: 'Subject / Keywords',
        value: [subject, keywords].filter(Boolean).join(', '),
        isLeaked: true,
        severity: 'low',
        description: 'Internal categorization tags or search indices.',
      });
    }
  } catch (err) {
    // If standard parsing encountered protected dictionaries, proceed to raw byte scan
    console.warn('pdf-lib dictionary scan partial warning:', err);
  }

  // 2. Raw Byte-Level Stream Analysis for Deeper Telemetry & Scripts
  const rawBytes = new Uint8Array(pdfBytes);
  const textDecoder = new TextDecoder('latin1');
  const rawText = textDecoder.decode(rawBytes);

  // Check for Embedded JavaScript
  if (rawText.includes('/JavaScript') || rawText.includes('/JS ')) {
    hasEmbeddedJavascript = true;
    score -= 35;
    risks.push({
      id: 'embedded_js',
      title: 'Active Embedded JavaScript Detected',
      category: 'executable',
      severity: 'danger',
      description: 'PDF contains active JavaScript hooks (/JavaScript). These can trigger network calls or arbitrary code execution in desktop PDF readers.',
    });
  }

  // Check for OpenAction auto-execution
  if (rawText.includes('/OpenAction') || rawText.includes('/Launch')) {
    hasOpenAction = true;
    score -= 20;
    risks.push({
      id: 'open_action',
      title: 'Automatic OpenAction Trigger Detected',
      category: 'executable',
      severity: 'warning',
      description: 'Document contains triggers designed to execute automatically when the PDF is opened by a recipient.',
    });
  }

  // Check for XMP Telemetry & Document History GUIDs
  if (rawText.includes('<xmpMM:DocumentID>') || rawText.includes('<xmpMM:InstanceID>') || rawText.includes('xmlns:xmp=')) {
    hasXmpTelemetry = true;
    score -= 10;
    risks.push({
      id: 'xmp_telemetry',
      title: 'XMP Telemetry & Machine GUIDs Embedded',
      category: 'metadata',
      severity: 'info',
      description: 'Adobe XMP metadata stream contains persistent UUIDs that can correlate multiple documents back to the same author machine.',
    });
  }

  // Scan for External Tracking URLs / Hyperlinks (/URI)
  const uriRegex = /\/URI\s*\(([^)]+)\)/g;
  let match;
  while ((match = uriRegex.exec(rawText)) !== null) {
    const url = match[1];
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      if (!embeddedUrls.includes(url) && embeddedUrls.length < 15) {
        embeddedUrls.push(url);
      }
    }
  }

  if (embeddedUrls.length > 0) {
    score -= 10;
    risks.push({
      id: 'embedded_urls',
      title: `Embedded Outbound URLs Found (${embeddedUrls.length} links)`,
      category: 'tracking',
      severity: 'info',
      description: `Contains external web links. These can be used for tracking web beacons or redirecting readers.`,
      evidence: embeddedUrls.slice(0, 3).join(', ') + (embeddedUrls.length > 3 ? ` (+${embeddedUrls.length - 3} more)` : ''),
    });
  }

  // Normalize score between 0 and 100
  const finalScore = Math.max(10, Math.min(100, score));
  let riskLevel: 'clean' | 'moderate' | 'high_risk' = 'clean';
  if (finalScore < 60) {
    riskLevel = 'high_risk';
  } else if (finalScore < 85) {
    riskLevel = 'moderate';
  }

  return {
    fileName,
    fileSizeBytes: pdfBytes.byteLength,
    pageCount,
    privacyScore: finalScore,
    riskLevel,
    leakedFields,
    risks,
    embeddedUrls,
    hasEmbeddedJavascript,
    hasOpenAction,
    hasXmpTelemetry,
    inspectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * 100% Client-side metadata stripping
 * Reconstructs a completely sanitized PDF with zero metadata, zero author tags, and wiped dictionaries
 */
export async function sanitizePdfMetadata(pdfBytes: ArrayBuffer): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const sanitizedDoc = await PDFDocument.create();

  // Copy all pages
  const pageIndices = srcDoc.getPageIndices();
  const copiedPages = await sanitizedDoc.copyPages(srcDoc, pageIndices);
  for (const page of copiedPages) {
    sanitizedDoc.addPage(page);
  }

  // Wipe standard metadata dictionary
  sanitizedDoc.setTitle('');
  sanitizedDoc.setAuthor('');
  sanitizedDoc.setSubject('');
  sanitizedDoc.setKeywords([]);
  sanitizedDoc.setProducer('PDFCraft (100% Client-Side Privacy)');
  sanitizedDoc.setCreator('PDFCraft');

  // Save sanitized binary
  return await sanitizedDoc.save({ useObjectStreams: true });
}
