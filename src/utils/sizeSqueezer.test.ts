import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';
import { squeezePDFToTargetKB } from './sizeSqueezer';

describe('sizeSqueezer', () => {
  it('preserves an under-target PDF without bloating size or reporting negative reduction', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([600, 400]);
    page.drawText('Small crisp vector certificate under 10 KB.', {
      x: 40,
      y: 320,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    const saved = await doc.save();
    const rawBuffer = saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength);

    const result = await squeezePDFToTargetKB(rawBuffer, 195);

    expect(result.compressedBytes.byteLength).toBe(rawBuffer.byteLength);
    expect(result.reductionPercentage).toBe(0);
    expect(result.targetAchieved).toBe(true);
    expect(result.strategyUsed).toBe('vector-preserve');
    expect(result.warning).toMatch(/already under the 195 KB cap/i);
  });
});
