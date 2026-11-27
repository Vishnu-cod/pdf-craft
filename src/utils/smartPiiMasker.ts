// smartPiiMasker.ts — Client-side automated PII & ID detector for PDFCraft
// 100% in-browser regex scanning and coordinate mapping for irreversible redaction

export interface DetectedPiiItem {
  id: string;
  type: 'aadhaar' | 'pan' | 'ssn' | 'credit_card' | 'email' | 'phone';
  label: string;
  originalText: string;
  maskedText: string;
  pageNumber: number;
  selected: boolean;
  // Bounding box in percentage coordinates (0 - 100)
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Regex patterns for sensitive PII
const PII_PATTERNS = [
  {
    type: 'aadhaar' as const,
    label: 'Aadhaar Card (12-digit)',
    // Matches 12-digit numbers formatted as 1234 5678 9012 or 123456789012
    regex: /\b([2-9]\d{3})[\s-]?(\d{4})[\s-]?(\d{4})\b/g,
    mask: (match: string) => {
      const clean = match.replace(/[\s-]/g, '');
      return `XXXX XXXX ${clean.slice(8)}`;
    },
  },
  {
    type: 'pan' as const,
    label: 'Indian PAN Card',
    // 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)
    regex: /\b([A-Z]{5}\d{4}[A-Z])\b/g,
    mask: (match: string) => `${match.slice(0, 5)}XXXX${match.slice(9)}`,
  },
  {
    type: 'ssn' as const,
    label: 'Social Security Number (SSN)',
    regex: /\b(\d{3}-\d{2}-\d{4})\b/g,
    mask: (match: string) => `XXX-XX-${match.slice(7)}`,
  },
  {
    type: 'credit_card' as const,
    label: 'Credit / Debit Card',
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    mask: (match: string) => {
      const clean = match.replace(/[-\s]/g, '');
      return `XXXX-XXXX-XXXX-${clean.slice(12)}`;
    },
  },
  {
    type: 'email' as const,
    label: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    mask: (match: string) => {
      const parts = match.split('@');
      const user = parts[0];
      const domain = parts[1];
      const visible = user.length > 2 ? `${user.slice(0, 2)}***` : '***';
      return `${visible}@${domain}`;
    },
  },
  {
    type: 'phone' as const,
    label: 'Phone Number',
    regex: /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b|\b(?:\+?1[\s-]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    mask: (match: string) => {
      const clean = match.replace(/\D/g, '');
      return clean.length >= 10 ? `******${clean.slice(-4)}` : '******';
    },
  },
];

/**
 * Scans a PDF using PDF.js text layer extraction to find and locate all sensitive PII
 */
export async function scanPdfForPii(pdfData: ArrayBuffer): Promise<DetectedPiiItem[]> {
  const pdfjsLib = await import('pdfjs-dist');
  const clonedBuffer = pdfData.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(clonedBuffer) });
  const doc = await loadingTask.promise;
  const detectedItems: DetectedPiiItem[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    for (const item of textContent.items as any[]) {
      if (!item.str || typeof item.str !== 'string') continue;
      const text = item.str;

      for (const pattern of PII_PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.regex.exec(text)) !== null) {
          const matchedString = match[0];
          const maskedString = pattern.mask(matchedString);

          // Calculate normalized bounding box in percentage (0 - 100)
          // PDF.js transform: [scaleX, skewY, skewX, scaleY, transX, transY]
          const tx = item.transform[4];
          const ty = item.transform[5];
          const width = item.width || 80;
          const height = item.height || 14;

          // Convert PDF points (bottom-left origin) to viewport percentage (top-left origin)
          const pctX = Math.max(0, Math.min(100, (tx / viewport.width) * 100));
          const pctY = Math.max(0, Math.min(100, ((viewport.height - ty - height) / viewport.height) * 100));
          const pctW = Math.max(2, Math.min(100, (width / viewport.width) * 100));
          const pctH = Math.max(1.5, Math.min(100, ((height * 1.4) / viewport.height) * 100));

          detectedItems.push({
            id: `pii-${pageNum}-${detectedItems.length}-${Date.now()}`,
            type: pattern.type,
            label: pattern.label,
            originalText: matchedString,
            maskedText: maskedString,
            pageNumber: pageNum,
            selected: true, // Selected by default for quick 1-click masking
            bounds: {
              x: pctX,
              y: pctY,
              width: pctW,
              height: pctH,
            },
          });
        }
      }
    }
  }

  return detectedItems;
}
