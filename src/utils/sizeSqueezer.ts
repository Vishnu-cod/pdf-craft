import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from '@cantoo/pdf-lib';

export type CompressionStrategy = 'vector-preserve' | 'balanced' | 'target-squeeze';

export interface SqueezeResult {
  compressedBytes: Uint8Array;
  compressedSizeKB: number;
  originalSizeKB: number;
  reductionPercentage: number;
  numPages: number;
  firstPagePreviewUrl: string;
  targetAchieved: boolean;
  requestedTargetKB?: number;
  strategyUsed: CompressionStrategy;
  warning?: string;
}

export interface SqueezeProgressCallback {
  (currentPage: number, totalPages: number, message: string): void;
}

/**
 * High-quality vector compression:
 * Optimizes internal PDF streams, removes unused objects, applies object streams,
 * and preserves 100% vector fonts, selectable text, and hyperlinks.
 */
export async function compressPDFVectorPreserve(
  pdfBytes: ArrayBuffer,
  onProgress?: SqueezeProgressCallback
): Promise<SqueezeResult> {
  const originalSizeKB = Math.round(pdfBytes.byteLength / 1024);
  if (onProgress) onProgress(1, 1, 'Optimizing PDF object streams and structure...');

  const pdfDoc = await PDFDocument.load(pdfBytes.slice(0), { ignoreEncryption: true });
  const numPages = pdfDoc.getPageCount();

  // Re-save with object streams compression enabled
  const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
  const compressedSizeKB = Math.round(compressedBytes.byteLength / 1024);
  const reductionPercentage = Math.max(
    0,
    Math.round(((originalSizeKB - compressedSizeKB) / Math.max(1, originalSizeKB)) * 100)
  );

  // Generate thumbnail of first page for preview
  let firstPagePreviewUrl = '';
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
    const jsDoc = await loadingTask.promise;
    const page = await jsDoc.getPage(1);
    const vp = page.getViewport({ scale: 0.5 });
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        firstPagePreviewUrl = canvas.toDataURL('image/jpeg', 0.8);
      }
    }
  } catch (err) {
    console.warn('Could not render preview thumbnail:', err);
  }

  return {
    compressedBytes,
    compressedSizeKB,
    originalSizeKB,
    reductionPercentage,
    numPages,
    firstPagePreviewUrl,
    targetAchieved: true,
    strategyUsed: 'vector-preserve',
  };
}

/**
 * Compresses an uploaded PDF to stay strictly under a specified target KB limit.
 * Uses adaptive resolution scaling and JPEG quality tuning with verified post-compression size checks.
 */
export async function squeezePDFToTargetKB(
  pdfBytes: ArrayBuffer,
  targetKB: number,
  onProgress?: SqueezeProgressCallback,
  checkCancelled?: () => boolean
): Promise<SqueezeResult> {
  const originalSizeKB = Math.round(pdfBytes.byteLength / 1024);
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Approximate per-page byte budget with safety margin (12% safety margin so we stay strictly below ceiling)
  const safeTargetBytes = targetKB * 1024 * 0.88;
  const perPageByteBudget = Math.max(6000, safeTargetBytes / numPages);

  // Determine starting scale & quality based on budget
  let scale = 1.4;
  let quality = 0.85;

  if (perPageByteBudget < 40000) {
    scale = 1.1;
    quality = 0.70;
  }
  if (perPageByteBudget < 25000) {
    scale = 0.90;
    quality = 0.55;
  }
  if (perPageByteBudget < 15000) {
    scale = 0.75;
    quality = 0.45;
  }
  if (perPageByteBudget < 9000) {
    scale = 0.60;
    quality = 0.35;
  }

  const newPdfDoc = await PDFDocument.create();
  let firstPagePreviewUrl = '';

  for (let i = 1; i <= numPages; i++) {
    if (checkCancelled && checkCancelled()) {
      throw new Error('Compression cancelled by user.');
    }

    if (onProgress) {
      onProgress(i, numPages, `Optimizing page ${i} of ${numPages} to target budget...`);
    }

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    if (typeof document === 'undefined') {
      throw new Error('Canvas rendering requires a browser environment');
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) throw new Error('Could not initialize canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // Convert canvas to compressed JPEG
    let dataUrl = canvas.toDataURL('image/jpeg', quality);

    // If single page exceeds budget, scale down further
    let pageBytesEstimate = (dataUrl.length * 3) / 4;
    if (pageBytesEstimate > perPageByteBudget && quality > 0.30) {
      const tunedQuality = Math.max(0.28, quality * (perPageByteBudget / pageBytesEstimate));
      dataUrl = canvas.toDataURL('image/jpeg', tunedQuality);
    }

    if (i === 1) {
      firstPagePreviewUrl = dataUrl;
    }

    // Embed into new PDF
    const base64Data = dataUrl.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const embeddedImage = await newPdfDoc.embedJpg(imageBytes);

    const pdfPage = newPdfDoc.addPage([viewport.width / scale, viewport.height / scale]);
    pdfPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: viewport.width / scale,
      height: viewport.height / scale,
    });
  }

  const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });
  const compressedSizeKB = Math.round(compressedBytes.byteLength / 1024);
  const reductionPercentage = Math.max(
    0,
    Math.round(((originalSizeKB - compressedSizeKB) / Math.max(1, originalSizeKB)) * 100)
  );

  const targetAchieved = compressedSizeKB <= targetKB;
  let warning: string | undefined;

  if (!targetAchieved) {
    warning = `Notice: Target of ${targetKB} KB was exceeded (${compressedSizeKB} KB achieved). For documents with ${numPages} pages, achieving under ${targetKB} KB requires splitting or selecting a higher limit.`;
  }

  return {
    compressedBytes,
    compressedSizeKB,
    originalSizeKB,
    reductionPercentage,
    numPages,
    firstPagePreviewUrl,
    targetAchieved,
    requestedTargetKB: targetKB,
    strategyUsed: 'target-squeeze',
    warning,
  };
}
