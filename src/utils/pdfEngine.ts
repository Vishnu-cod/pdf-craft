import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Annotation, PDFPageMeta } from '../types';
import JSZip from 'jszip';

// Configure Mozilla PDF.js worker
// Using standard unpkg CDN matching version for rock-solid worker resolution without Vite bundling hurdles
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

export async function loadPDFDocument(fileBytes: ArrayBuffer) {
  // Clone the ArrayBuffer using .slice(0) so the PDF.js Web Worker does NOT detach the original buffer!
  const cloned = fileBytes.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: cloned });
  return await loadingTask.promise;
}

export async function renderPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

export async function getDocumentPagesMeta(fileBytes: ArrayBuffer): Promise<PDFPageMeta[]> {
  const pdfDoc = await loadPDFDocument(fileBytes);
  const totalPages = pdfDoc.numPages;
  const pagesMeta: PDFPageMeta[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 0.3 }); // thumbnail scale
    
    // Create an offscreen canvas for thumbnail preview
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
      pagesMeta.push({
        pageNumber: i,
        width: page.view[2],
        height: page.view[3],
        rotation: page.rotate || 0,
        previewUrl: canvas.toDataURL('image/jpeg', 0.8),
      });
    }
  }

  return pagesMeta;
}

function sanitizeWinAnsi(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '?');
}

/**
 * Bake annotations (Signatures, Text, True Redaction, Dates) permanently into the PDF
 */
export async function applyAnnotationsAndSave(
  originalBytes: ArrayBuffer,
  annotations: Annotation[],
  canvasWidth: number,
  canvasHeight: number
): Promise<Uint8Array> {
  const cloned = originalBytes.slice(0);
  const pdfDoc = await PDFDocument.load(cloned, { ignoreEncryption: true });
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const ann of annotations) {
    const pages = pdfDoc.getPages();
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const page = pages[ann.pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Screen coords: ann.x and ann.y are stored as percentage (0 to 100)
    // PDF coords: origin (0,0) is bottom-left
    const scaleY = pageHeight / (canvasHeight || pageHeight);
    const pdfX = (ann.x / 100) * pageWidth;
    const itemWidth = ((ann.width || 140) / (canvasWidth || pageWidth)) * pageWidth;
    const itemHeight = ((ann.height || 45) / (canvasHeight || pageHeight)) * pageHeight;
    const pdfY = pageHeight - ((ann.y / 100) * pageHeight) - itemHeight;

    if (ann.type === 'signature' && ann.content.startsWith('data:image')) {
      const pngImageBytes = await fetch(ann.content).then((res) => res.arrayBuffer());
      const embeddedImage = await pdfDoc.embedPng(pngImageBytes);
      page.drawImage(embeddedImage, {
        x: pdfX,
        y: pdfY,
        width: itemWidth,
        height: itemHeight,
      });
    } else if (ann.type === 'redaction') {
      // True Burn-in Redaction: draw opaque black rectangle
      page.drawRectangle({
        x: pdfX,
        y: pdfY,
        width: itemWidth,
        height: itemHeight,
        color: rgb(0, 0, 0),
        opacity: 1,
      });
    } else if (ann.type === 'text' || ann.type === 'date') {
      const safeText = sanitizeWinAnsi(ann.content || '');
      const fontSize = Math.max(8, (ann.fontSize || 14) * scaleY);
      page.drawText(safeText, {
        x: pdfX,
        y: Math.max(0, pdfY + (itemHeight * 0.2)),
        size: fontSize,
        font: regularFont,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else if (ann.type === 'stamp') {
      const safeStamp = sanitizeWinAnsi(ann.content || '');
      // Draw a stamped badge with border
      page.drawRectangle({
        x: pdfX,
        y: pdfY,
        width: itemWidth,
        height: itemHeight,
        color: rgb(0.95, 0.95, 0.98),
        borderColor: rgb(0.3, 0.4, 0.9),
        borderWidth: 2,
        opacity: 0.9,
      });
      page.drawText(safeStamp, {
        x: pdfX + 8,
        y: Math.max(0, pdfY + (itemHeight * 0.3)),
        size: Math.max(8, 12 * scaleY),
        font: helveticaFont,
        color: rgb(0.2, 0.3, 0.8),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Merge multiple PDF file buffers into a single PDF
 */
export async function mergePDFDocuments(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const doc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Reorganize, reorder, delete, and rotate pages
 */
export async function saveOrganizedPages(
  originalBytes: ArrayBuffer,
  pageConfigs: { originalPageIndex: number; rotationDelta: number }[]
): Promise<Uint8Array> {
  const originalDoc = await PDFDocument.load(originalBytes.slice(0), { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  for (const config of pageConfigs) {
    const [copiedPage] = await newDoc.copyPages(originalDoc, [config.originalPageIndex]);
    const currentRotation = copiedPage.getRotation().angle;
    copiedPage.setRotation(degrees((currentRotation + config.rotationDelta) % 360));
    newDoc.addPage(copiedPage);
  }

  return await newDoc.save();
}

/**
 * Convert Images (JPG/PNG) to a single PDF
 */
export async function convertImagesToPDF(imageFiles: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of imageFiles) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // Handles jpeg, jpg, webp if converted
      image = await pdfDoc.embedJpg(arrayBuffer);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}

/**
 * Convert PDF pages to high-res PNG/JPG images and package into a ZIP
 */
export async function convertPDFToImagesZip(
  fileBytes: ArrayBuffer,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdfDoc = await loadPDFDocument(fileBytes);
  const total = pdfDoc.numPages;
  const zip = new JSZip();

  for (let i = 1; i <= total; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
      const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
      zip.file(`page_${i}.${format === 'png' ? 'png' : 'jpg'}`, base64Data, { base64: true });
    }

    if (onProgress) onProgress(i, total);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Helper to trigger immediate browser file download
 */
export function downloadBlob(blob: Blob | Uint8Array, fileName: string) {
  const actualBlob = blob instanceof Uint8Array ? new Blob([blob.buffer as ArrayBuffer], { type: 'application/pdf' }) : blob;
  const url = URL.createObjectURL(actualBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
