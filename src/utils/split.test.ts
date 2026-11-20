import { describe, it, expect } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import {
  splitPDFToIndividualPages,
  extractPDFPageRanges,
  splitPDFEveryNPages,
} from './pdfEngine';

describe('PDF Split Engine', () => {
  async function create6PagePDF(): Promise<ArrayBuffer> {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 6; i++) {
      const p = doc.addPage([300, 200]);
      p.drawText(`Page Number ${i}`);
    }
    const bytes = await doc.save();
    return bytes.buffer as ArrayBuffer;
  }

  it('splits a document into individual pages', async () => {
    const bytes = await create6PagePDF();
    const files = await splitPDFToIndividualPages(bytes, 'contract.pdf');
    expect(files.length).toBe(6);
    expect(files[0].fileName).toBe('contract_page_1.pdf');
    expect(files[5].fileName).toBe('contract_page_6.pdf');

    for (const f of files) {
      const parsed = await PDFDocument.load(f.bytes);
      expect(parsed.getPageCount()).toBe(1);
    }
  });

  it('extracts custom page ranges into separate documents', async () => {
    const bytes = await create6PagePDF();
    const ranges = [
      { name: 'part_1', pageIndices: [0, 1, 2] }, // Pages 1-3
      { name: 'part_2', pageIndices: [3, 4, 5] }, // Pages 4-6
    ];

    const files = await extractPDFPageRanges(bytes, ranges, 'report.pdf');
    expect(files.length).toBe(2);
    expect(files[0].fileName).toBe('report_part_1.pdf');
    expect(files[1].fileName).toBe('report_part_2.pdf');

    const doc1 = await PDFDocument.load(files[0].bytes);
    expect(doc1.getPageCount()).toBe(3);

    const doc2 = await PDFDocument.load(files[1].bytes);
    expect(doc2.getPageCount()).toBe(3);
  });

  it('splits every N pages into uniform chunks', async () => {
    const bytes = await create6PagePDF();
    const files = await splitPDFEveryNPages(bytes, 2, 'manual.pdf');
    expect(files.length).toBe(3); // 6 / 2 = 3 parts

    for (const f of files) {
      const doc = await PDFDocument.load(f.bytes);
      expect(doc.getPageCount()).toBe(2);
    }
  });
});
