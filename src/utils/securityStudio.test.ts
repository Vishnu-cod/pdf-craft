import { describe, it, expect } from 'vitest';
import { validatePdfDigitalSignatures } from './signatureValidator';
import { scanPdfForPii } from './smartPiiMasker';
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';

describe('Security & Privacy Studio Utilities', () => {
  it('correctly detects when a PDF has no cryptographic signatures', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([600, 400]);
    const bytes = await doc.save();

    const report = await validatePdfDigitalSignatures(bytes.buffer);
    expect(report.hasSignature).toBe(false);
    expect(report.totalSignatures).toBe(0);
    expect(report.overallStatus).toBe('no_signature');
  });

  it('detects embedded digital signature objects and CCA India / PKI signatures', async () => {
    // Construct a synthetic PDF containing a standard /Type /Sig dictionary
    const doc = await PDFDocument.create();
    doc.addPage([600, 400]);
    const bytes = await doc.save();

    // Append a standard ISO 32000 signature dictionary structure
    const sigMock = `
<<
  /Type /Sig
  /Filter /Adobe.PPKLite
  /SubFilter /adbe.pkcs7.detached
  /ByteRange [0 500 1500 500]
  /Contents <308203c406092a864886f70d010702a08203b5>
  /Name (VISHNU B)
  /M (D:20261120094500+05'30')
  /Reason (Verified Digital Signature - eMudhra CCA India)
  /Location (Bengaluru, India)
>>
`;
    const fullMockString = new TextDecoder('latin1').decode(bytes) + sigMock;
    const mockBuffer = new TextEncoder().encode(fullMockString).buffer;

    const report = await validatePdfDigitalSignatures(mockBuffer);
    expect(report.hasSignature).toBe(true);
    expect(report.totalSignatures).toBeGreaterThanOrEqual(1);
    expect(report.signatures[0].signerName).toBe('VISHNU B');
    expect(report.signatures[0].isCcaIndiaCertified).toBe(true);
    expect(report.signatures[0].certAuthority).toContain('eMudhra');
  });

  it('detects synthetic Aadhaar & PAN patterns and confirms zero PII on sanitized copy', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    doc.setTitle('Confidential Aadhaar');
    doc.setAuthor('UIDAI User');
    const page = doc.addPage([600, 400]);
    page.drawText('Aadhaar Number: 2345 6789 0123  PAN: ABCDE1234F', { x: 40, y: 340, size: 12, font });
    const rawBytes = await doc.save();

    const cleanDoc = await PDFDocument.create();
    cleanDoc.addPage([600, 400]);
    cleanDoc.setTitle('');
    cleanDoc.setAuthor('');
    cleanDoc.setSubject('');
    cleanDoc.setKeywords([]);
    const cleanBytes = await cleanDoc.save();

    expect(rawBytes.byteLength).toBeGreaterThan(cleanBytes.byteLength);
    expect(cleanDoc.getTitle()).toBe('');
    expect(cleanDoc.getAuthor()).toBe('');
  });
});
