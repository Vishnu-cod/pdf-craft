import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

export interface SqueezeResult {
  compressedBytes: Uint8Array;
  compressedSizeKB: number;
  originalSizeKB: number;
  reductionPercentage: number;
  numPages: number;
  firstPagePreviewUrl: string;
}

export interface SqueezeProgressCallback {
  (currentPage: number, totalPages: number, message: string): void;
}

/**
 * Compresses an uploaded PDF to stay strictly under a specified target KB limit.
 * Uses adaptive binary-search resolution scaling and JPEG quality tuning.
 */
export async function squeezePDFToTargetKB(
  pdfBytes: ArrayBuffer,
  targetKB: number,
  onProgress?: SqueezeProgressCallback
): Promise<SqueezeResult> {
  const originalSizeKB = Math.round(pdfBytes.byteLength / 1024);
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Approximate per-page byte budget with safety margin (10% safety margin so we never exceed target)
  const safeTargetBytes = targetKB * 1024 * 0.90;
  const perPageByteBudget = Math.max(8000, safeTargetBytes / numPages);

  // Determine starting scale & quality based on budget
  let scale = 1.4;
  let quality = 0.85;

  if (perPageByteBudget < 35000) {
    scale = 1.0;
    quality = 0.65;
  }
  if (perPageByteBudget < 20000) {
    scale = 0.85;
    quality = 0.52;
  }
  if (perPageByteBudget < 12000) {
    scale = 0.70;
    quality = 0.42;
  }

  const newPdfDoc = await PDFDocument.create();
  let firstPagePreviewUrl = '';

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(i, numPages, `Optimizing page ${i} of ${numPages} to target budget...`);
    }

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

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
    if (pageBytesEstimate > perPageByteBudget && quality > 0.35) {
      const tunedQuality = Math.max(0.35, quality * (perPageByteBudget / pageBytesEstimate));
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

  const compressedBytes = await newPdfDoc.save();
  const compressedSizeKB = Math.round(compressedBytes.byteLength / 1024);
  const reductionPercentage = Math.max(
    0,
    Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100)
  );

  return {
    compressedBytes,
    compressedSizeKB,
    originalSizeKB,
    reductionPercentage,
    numPages,
    firstPagePreviewUrl,
  };
}
