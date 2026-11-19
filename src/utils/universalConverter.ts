import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { downloadBlob } from './pdfEngine';

/**
 * 1. Convert Entire PDF to Excel (.xlsx) with multi-page sheets
 */
export async function convertPDFToExcelAllPages(
  pdfBytes: ArrayBuffer,
  fileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const workbook = XLSX.utils.book_new();

  for (let p = 1; p <= totalPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items: { text: string; x: number; y: number }[] = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;
      items.push({
        text: item.str.trim(),
        x: item.transform[4],
        y: Math.round(viewport.height - item.transform[5]),
      });
    }

    if (items.length > 0) {
      // Group by vertical rows
      items.sort((a, b) => a.y - b.y);
      const rows: string[][] = [];
      let currentRow: { text: string; x: number }[] = [items[0]];

      for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        if (Math.abs(curr.y - prev.y) < 7) {
          currentRow.push(curr);
        } else {
          currentRow.sort((a, b) => a.x - b.x);
          rows.push(currentRow.map((c) => c.text));
          currentRow = [curr];
        }
      }
      if (currentRow.length > 0) {
        currentRow.sort((a, b) => a.x - b.x);
        rows.push(currentRow.map((c) => c.text));
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${p}`);
    }

    if (onProgress) onProgress(p, totalPages);
  }

  const exportName = fileName.replace(/\.pdf$/i, '') + '.xlsx';
  XLSX.writeFile(workbook, exportName);
}

/**
 * 2. Convert PDF to Microsoft Word (.docx) using OpenXML ZIP packaging
 */
export async function convertPDFToWordDocx(
  pdfBytes: ArrayBuffer,
  fileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let bodyXml = '';

  for (let p = 1; p <= totalPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items: { text: string; y: number; x: number }[] = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;
      items.push({
        text: item.str,
        x: item.transform[4],
        y: Math.round(viewport.height - item.transform[5]),
      });
    }

    items.sort((a, b) => a.y - b.y);

    let currentLine: string[] = [];
    let currentY = items[0]?.y ?? 0;

    for (const it of items) {
      if (Math.abs(it.y - currentY) < 6) {
        currentLine.push(it.text);
      } else {
        const lineText = currentLine.join(' ');
        const safeText = lineText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        bodyXml += `<w:p><w:r><w:t>${safeText}</w:t></w:r></w:p>`;
        currentLine = [it.text];
        currentY = it.y;
      }
    }
    if (currentLine.length > 0) {
      const lineText = currentLine.join(' ');
      const safeText = lineText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      bodyXml += `<w:p><w:r><w:t>${safeText}</w:t></w:r></w:p>`;
    }

    // Page break between PDF pages
    if (p < totalPages) {
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    }

    if (onProgress) onProgress(p, totalPages);
  }

  // Construct valid OpenXML DOCX archive
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const wordFolder = zip.folder('word');
  wordFolder?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
  </w:body>
</w:document>`
  );

  const docxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const exportName = fileName.replace(/\.pdf$/i, '') + '.docx';
  downloadBlob(docxBlob, exportName);
}

/**
 * 3. Extract text paragraphs from a Word (.docx) file
 */
export async function parseDocxFile(docxBuffer: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(docxBuffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) throw new Error('Invalid Word .docx file format');

  const xmlText = await docXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const paragraphs: string[] = [];
  const pElements = xmlDoc.getElementsByTagName('w:p');

  for (let i = 0; i < pElements.length; i++) {
    const p = pElements[i];
    const textNodes = p.getElementsByTagName('w:t');
    let line = '';
    for (let j = 0; j < textNodes.length; j++) {
      line += textNodes[j].textContent || '';
    }
    if (line.trim().length > 0) {
      paragraphs.push(line);
    }
  }

  return paragraphs;
}

/**
 * 4. Convert Word (.docx) to PDF
 */
export async function convertDocxToPDF(docxBuffer: ArrayBuffer, fileName: string): Promise<void> {
  const paragraphs = await parseDocxFile(docxBuffer);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // Standard A4 points
  const pageHeight = 841.89;
  const margin = 50;
  const maxLineWidth = pageWidth - (margin * 2);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Title header from filename
  currentPage.drawText(fileName.replace(/\.docx$/i, ''), {
    x: margin,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  currentY -= 30;

  for (const para of paragraphs) {
    // Word wrap logic
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, 11);

      if (textWidth > maxLineWidth) {
        if (currentY < margin + 20) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }
        currentPage.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 16;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (currentY < margin + 20) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      currentPage.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= 22; // Paragraph spacing
    }
  }

  const pdfBytes = await pdfDoc.save();
  const downloadName = fileName.replace(/\.docx?$/i, '') + '.pdf';
  downloadBlob(pdfBytes, downloadName);
}

/**
 * 5. Convert Word (.docx) to Images (PNG/JPG)
 */
export async function convertDocxToImages(docxBuffer: ArrayBuffer, fileName: string): Promise<void> {
  const paragraphs = await parseDocxFile(docxBuffer);
  const canvas = document.createElement('canvas');
  canvas.width = 1240; // 2x high resolution
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Render white document background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 32px Helvetica, Arial, sans-serif';
  ctx.fillText(fileName.replace(/\.docx$/i, ''), 100, 120);

  ctx.fillStyle = '#334155';
  ctx.font = '22px Helvetica, Arial, sans-serif';
  let y = 180;

  for (const para of paragraphs) {
    if (y > canvas.height - 100) break; // preview first page
    ctx.fillText(para.substring(0, 80), 100, y);
    y += 36;
  }

  canvas.toBlob((blob) => {
    if (blob) {
      const imgName = fileName.replace(/\.docx?$/i, '') + '_page1.png';
      downloadBlob(blob, imgName);
    }
  }, 'image/png');
}
