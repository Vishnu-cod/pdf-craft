const fs = require('fs');
const zlib = require('zlib');

// Create a 1200x630 brand PNG for Open Graph social previews
function createBrandPNG(width, height) {
  // Simple PNG header and chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB (3 bytes per pixel)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Generate image raw scanlines: filter byte (0) + 3 bytes per pixel (R, G, B)
  const rowStride = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;

      // Dark luxury background gradient: #030712 (almost black) to #0f172a (dark slate)
      const grad = (x / width) * 0.4 + (y / height) * 0.6;
      let r = Math.floor(3 + grad * 12);
      let g = Math.floor(7 + grad * 16);
      let b = Math.floor(18 + grad * 35);

      // Top-left glow: Indigo aura around (x: 250, y: 200)
      const dist1 = Math.hypot(x - 260, y - 220);
      if (dist1 < 380) {
        const factor = Math.cos((dist1 / 380) * (Math.PI / 2));
        r = Math.min(255, Math.floor(r + 79 * factor));
        g = Math.min(255, Math.floor(g + 70 * factor));
        b = Math.min(255, Math.floor(b + 229 * factor));
      }

      // Bottom-right glow: Violet / Emerald aura around (x: 950, y: 480)
      const dist2 = Math.hypot(x - 950, y - 480);
      if (dist2 < 340) {
        const factor = Math.cos((dist2 / 340) * (Math.PI / 2));
        r = Math.min(255, Math.floor(r + 16 * factor));
        g = Math.min(255, Math.floor(g + 185 * factor));
        b = Math.min(255, Math.floor(b + 129 * factor));
      }

      // Outer border frame (3px border)
      if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) {
        r = 79;
        g = 70;
        b = 229;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 implementation for PNG chunks
function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(calcCrc32(crcData), 0);

  return Buffer.concat([lenBuf, crcData, crcBuf]);
}

function calcCrc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

const png = createBrandPNG(1200, 630);
fs.writeFileSync('public/og-image.png', png);
console.log('Successfully created public/og-image.png (' + png.length + ' bytes)');
