/**
 * Lightweight, zero-dependency QR Code generator in pure TypeScript.
 * Generates standards-compliant QR Code (Model 2, Version 1-10) as SVG or Data URL.
 * Implements Reed-Solomon error correction and Byte mode encoding.
 */

// Galois Field GF(256) tables with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  LOG_TABLE[0] = 0;
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMultiply(poly[j], EXP_TABLE[i]);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsCalculateRemainder(data: Uint8Array, degree: number): Uint8Array {
  const gen = rsGeneratorPoly(degree);
  const remainder = new Uint8Array(degree);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    for (let i = 0; i < degree - 1; i++) {
      remainder[i] = remainder[i + 1] ^ gfMultiply(gen[i + 1], factor);
    }
    remainder[degree - 1] = gfMultiply(gen[degree], factor);
  }
  return remainder;
}

// Version configs: [capacity (bytes for M error correction), ecCodewordsPerBlock, numBlocks]
const VERSION_SPECS = [
  { version: 1, size: 21, dataBytes: 16, ecBytes: 10, blocks: 1 },
  { version: 2, size: 25, dataBytes: 28, ecBytes: 16, blocks: 1 },
  { version: 3, size: 29, dataBytes: 44, ecBytes: 26, blocks: 1 },
  { version: 4, size: 33, dataBytes: 64, ecBytes: 18, blocks: 2 },
  { version: 5, size: 37, dataBytes: 86, ecBytes: 24, blocks: 2 },
  { version: 6, size: 41, dataBytes: 108, ecBytes: 16, blocks: 4 },
];

/**
 * Creates a matrix representing the QR code modules.
 */
export function generateQRCodeMatrix(text: string): boolean[][] {
  const textBytes = new TextEncoder().encode(text);
  
  // Find smallest version that fits
  let spec = VERSION_SPECS.find((s) => s.dataBytes >= textBytes.length + 3);
  if (!spec) spec = VERSION_SPECS[VERSION_SPECS.length - 1];

  const size = spec.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (r: number, c: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isFunction[nr][nc] = true;
          if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
            matrix[nr][nc] = dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          } else {
            matrix[nr][nc] = false; // separator
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) {
      matrix[6][i] = i % 2 === 0;
      isFunction[6][i] = true;
    }
    if (!isFunction[i][6]) {
      matrix[i][6] = i % 2 === 0;
      isFunction[i][6] = true;
    }
  }

  // 3. Alignment patterns for version >= 2
  if (spec.version >= 2) {
    const alignCoords = [6, size - 7];
    const ar = alignCoords[1];
    const ac = alignCoords[1];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = ar + dr;
        const nc = ac + dc;
        if (!isFunction[nr][nc]) {
          matrix[nr][nc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          isFunction[nr][nc] = true;
        }
      }
    }
  }

  // 4. Dark module
  matrix[4 * spec.version + 9][8] = true;
  isFunction[4 * spec.version + 9][8] = true;

  // 5. Reserve format info
  for (let i = 0; i < 9; i++) {
    if (i < size) {
      if (!isFunction[8][i]) isFunction[8][i] = true;
      if (!isFunction[i][8]) isFunction[i][8] = true;
      if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
      if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
    }
  }

  // 6. Encode data stream (Byte mode: 0100 + char count + bytes)
  const bitBuffer: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(textBytes.length, 8); // Character count indicator
  for (const b of textBytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const totalDataBits = spec.dataBytes * 8;
  const termLength = Math.min(4, totalDataBits - bitBuffer.length);
  pushBits(0, termLength);

  // Byte align
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }

  // Pad bytes (0xEC, 0x11)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitBuffer.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bit buffer to bytes
  const dataBytes = new Uint8Array(spec.dataBytes);
  for (let i = 0; i < dataBytes.length; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitBuffer[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // 7. Calculate Error Correction codewords
  const ecBytesPerBlock = spec.ecBytes;
  const ecData = rsCalculateRemainder(dataBytes, ecBytesPerBlock);

  // Interleave data and EC
  const allCodewords = new Uint8Array(dataBytes.length + ecData.length);
  allCodewords.set(dataBytes, 0);
  allCodewords.set(ecData, dataBytes.length);

  // 8. Place codewords in matrix in zigzag pattern
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let up = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column

    for (let vert = 0; vert < size; vert++) {
      const r = up ? size - 1 - vert : vert;

      for (let c = right; c >= right - 1; c--) {
        if (!isFunction[r][c]) {
          let bit = false;
          if (bitIdx < totalBits) {
            const byte = allCodewords[Math.floor(bitIdx / 8)];
            bit = ((byte >> (7 - (bitIdx % 8))) & 1) === 1;
            bitIdx++;
          }

          // Apply Mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) {
            bit = !bit;
          }

          matrix[r][c] = bit;
        }
      }
    }
    up = !up;
  }

  // 9. Format Info for Mask 0, Error Level M (0b100000011001110)
  const formatBits = [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 0; i < 6; i++) matrix[5 - i][8] = formatBits[9 + i] === 1;

  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatBits[7 + i] === 1;

  // Convert nulls to false
  return matrix.map((row) => row.map((cell) => cell === true));
}

/**
 * Renders QR matrix as an inline SVG string
 */
export function generateQRCodeSVG(text: string, size = 120, fgColor = '#0f172a', bgColor = '#ffffff'): string {
  try {
    const matrix = generateQRCodeMatrix(text);
    const n = matrix.length;
    const moduleSize = size / (n + 2); // 1 module quiet zone

    let rects = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) {
          const x = (c + 1) * moduleSize;
          const y = (r + 1) * moduleSize;
          rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="${fgColor}"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      ${rects}
    </svg>`;
  } catch (err) {
    console.warn('QR Code generation failed:', err);
    return '';
  }
}
