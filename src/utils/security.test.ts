import { describe, it, expect } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { protectPDF, unlockPDF, isPDFEncrypted } from './pdfEngine';

describe('PDF Security (AES-256 Encryption & Decryption)', () => {
  async function createTestPDF(): Promise<ArrayBuffer> {
    const doc = await PDFDocument.create();
    const p = doc.addPage([500, 300]);
    p.drawText('Confidential Legal Agreement');
    const bytes = await doc.save();
    return bytes.buffer as ArrayBuffer;
  }

  it('correctly encrypts a PDF with AES-256 password protection', async () => {
    const rawBytes = await createTestPDF();
    const password = 'StrongPassword@2026';

    const protectedBytes = await protectPDF(rawBytes, {
      userPassword: password,
      permissions: { printing: 'highResolution', modifying: false, copying: false },
    });

    expect(protectedBytes.length).toBeGreaterThan(0);

    // Verify raw loading without password fails
    let failedWithoutPass = false;
    try {
      await PDFDocument.load(protectedBytes.buffer as ArrayBuffer);
    } catch (err: any) {
      failedWithoutPass = true;
    }
    expect(failedWithoutPass).toBe(true);

    // Verify loading with WRONG password fails
    let failedWithWrongPass = false;
    try {
      await PDFDocument.load(protectedBytes.buffer as ArrayBuffer, { password: 'wrong' });
    } catch {
      failedWithWrongPass = true;
    }
    expect(failedWithWrongPass).toBe(true);

    // Verify loading with CORRECT password succeeds
    const loadedDoc = await PDFDocument.load(protectedBytes.buffer as ArrayBuffer, { password });
    expect(loadedDoc.getPageCount()).toBe(1);
  });

  it('correctly unlocks an encrypted document and exports unencrypted PDF', async () => {
    const rawBytes = await createTestPDF();
    const password = 'DecryptMe123';

    const protectedBytes = await protectPDF(rawBytes, { userPassword: password });
    const unlockedBytes = await unlockPDF(protectedBytes.buffer as ArrayBuffer, password);

    // Unlocked PDF should now open without ANY password
    const plainDoc = await PDFDocument.load(unlockedBytes.buffer as ArrayBuffer);
    expect(plainDoc.getPageCount()).toBe(1);
  });
});
