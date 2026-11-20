import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb, StandardFonts } from '@cantoo/pdf-lib';
import { mergePDFDocuments, saveOrganizedPages, OrganizedPageConfig } from './pdfEngine';

describe('PDF Merge & Document Integrity', () => {
  it('correctly merges multiple source PDFs without dropping pages', async () => {
    // 1. Create Doc A (3 pages)
    const docA = await PDFDocument.create();
    for (let i = 1; i <= 3; i++) {
      const p = docA.addPage([400, 200]);
      p.drawText(`Doc A - Page ${i}`);
    }
    const bytesA = (await docA.save()).buffer as ArrayBuffer;

    // 2. Create Doc B (2 pages)
    const docB = await PDFDocument.create();
    for (let i = 1; i <= 2; i++) {
      const p = docB.addPage([400, 200]);
      p.drawText(`Doc B - Page ${i}`);
    }
    const bytesB = (await docB.save()).buffer as ArrayBuffer;

    // Standard sequential merge
    const mergedBytes = await mergePDFDocuments([bytesA, bytesB]);
    const mergedDoc = await PDFDocument.load(mergedBytes);
    expect(mergedDoc.getPageCount()).toBe(5);
  });

  it('correctly preserves source document references, order, and rotation in saveOrganizedPages', async () => {
    const docA = await PDFDocument.create();
    docA.addPage([400, 200]); // A-0
    docA.addPage([400, 200]); // A-1
    docA.addPage([400, 200]); // A-2
    const bytesA = (await docA.save()).buffer as ArrayBuffer;

    const docB = await PDFDocument.create();
    docB.addPage([400, 200]); // B-0
    docB.addPage([400, 200]); // B-1
    const bytesB = (await docB.save()).buffer as ArrayBuffer;

    // Sequence: [Doc B Page 1, Doc A Page 0 rotated 90 deg, Doc A Page 2, Doc B Page 0]
    const configs: OrganizedPageConfig[] = [
      { sourceBuffer: bytesB, originalPageIndex: 1, rotationDelta: 0 },
      { sourceBuffer: bytesA, originalPageIndex: 0, rotationDelta: 90 },
      { sourceBuffer: bytesA, originalPageIndex: 2, rotationDelta: 0 },
      { sourceBuffer: bytesB, originalPageIndex: 0, rotationDelta: 0 },
    ];

    const resultBytes = await saveOrganizedPages(bytesA, configs);
    const resultDoc = await PDFDocument.load(resultBytes);

    expect(resultDoc.getPageCount()).toBe(4);
    // Verify rotation of page 1 (which was A-0 with +90 delta)
    const rotatedPage = resultDoc.getPage(1);
    expect(rotatedPage.getRotation().angle).toBe(90);
  });
});
