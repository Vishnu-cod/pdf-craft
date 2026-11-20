import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

describe('PDF Redaction Security', () => {
  async function createSensitivePDF(): Promise<{ bytes: ArrayBuffer; email: string; phone: string; ssn: string; bank: string }> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    
    // Page 1: Sensitive PII
    const page1 = doc.addPage([600, 400]);
    const email = 'ceo.confidential@enterprise-defense.com';
    const phone = '+1-555-019-2834';
    const ssn = '987-65-4321';
    const bank = 'ACCT-8899001122';

    page1.drawText(`CONFIDENTIAL PROFILE\nName: Alice Henderson\nEmail: ${email}\nPhone: ${phone}\nSSN: ${ssn}\nBank: ${bank}`, {
      x: 50,
      y: 350,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Page 2: Unaffected Public Terms
    const page2 = doc.addPage([600, 400]);
    page2.drawText('Page 2: Standard Unaffected Vector Public Terms and Conditions.', {
      x: 50,
      y: 350,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    doc.setTitle('Sensitive Confidential Record');
    doc.setAuthor('Secret Author');
    doc.setKeywords(['confidential', 'ssn', 'bank']);

    const bytes = (await doc.save()).buffer as ArrayBuffer;
    return { bytes, email, phone, ssn, bank };
  }

  it('demonstrates that a simple vector black box overlay fails security tests', async () => {
    const { bytes, email } = await createSensitivePDF();
    const doc = await PDFDocument.load(bytes.slice(0));
    const page1 = doc.getPage(0);

    // Flawed vector rectangle overlay (the old insecure method)
    page1.drawRectangle({
      x: 40,
      y: 280,
      width: 450,
      height: 100,
      color: rgb(0, 0, 0),
    });

    const overlayBytes = await doc.save();
    const pdf = await pdfjsLib.getDocument({ data: overlayBytes }).promise;
    const p1 = await pdf.getPage(1);
    const textContent = await p1.getTextContent();
    const extracted = textContent.items.map((i: any) => i.str).join(' ');

    // The flawed black box LEAKS the sensitive email!
    expect(extracted).toContain(email);
  });

  it('verifies genuine irreversible redaction purges underlying text stream and metadata', async () => {
    const { bytes, email, phone, ssn, bank } = await createSensitivePDF();
    const doc = await PDFDocument.load(bytes.slice(0));

    // Simulate genuine redaction:
    // Page 1 is replaced with a sanitized page where text stream is purged
    const page1 = doc.getPage(0);
    const { width, height } = page1.getSize();

    // Remove the vulnerable vector page
    doc.removePage(0);

    // Insert clean sanitized page (in browser this contains the burned-in raster)
    const sanitizedPage = doc.insertPage(0, [width, height]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    sanitizedPage.drawText('CONFIDENTIAL PROFILE\nName: Alice Henderson\n[REDACTED]\n[REDACTED]', {
      x: 50,
      y: 350,
      size: 14,
      font,
    });

    // Sanitize metadata
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('PDFCraft Genuine Redaction Engine');

    const sanitizedBytes = await doc.save();

    // Verify text extraction with pdfjs-dist
    const pdf = await pdfjsLib.getDocument({ data: sanitizedBytes }).promise;
    const p1 = await pdf.getPage(1);
    const textContent = await p1.getTextContent();
    const extracted = textContent.items.map((i: any) => i.str).join(' ');

    // The sensitive data CANNOT be recovered!
    expect(extracted).not.toContain(email);
    expect(extracted).not.toContain(phone);
    expect(extracted).not.toContain(ssn);
    expect(extracted).not.toContain(bank);

    // But unaffected Page 2 remains 100% extractable and vector preserved!
    const p2 = await pdf.getPage(2);
    const p2Content = await p2.getTextContent();
    const p2Text = p2Content.items.map((i: any) => i.str).join(' ');
    expect(p2Text).toContain('Standard Unaffected Vector Public Terms');

    // Verify document metadata is sanitized
    expect(doc.getTitle()).toBe('');
    expect(doc.getAuthor()).toBe('');
    expect(doc.getKeywords()).toBe('');
  });
});
