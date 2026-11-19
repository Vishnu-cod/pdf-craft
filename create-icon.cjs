const fs = require('fs');
const zlib = require('zlib');

function createIconPNG(size) {
  const width = size;
  const height = size;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk('IHDR', ihdrData);

  const rowStride = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;

      // Rounded rect check (radius 96px)
      const r_corner = 96;
      let inside = true;
      let dx = 0, dy = 0;
      if (x < r_corner && y < r_corner) { dx = r_corner - x; dy = r_corner - y; }
      else if (x >= width - r_corner && y < r_corner) { dx = x - (width - r_corner); dy = r_corner - y; }
      else if (x < r_corner && y >= height - r_corner) { dx = r_corner - x; dy = y - (height - r_corner); }
      else if (x >= width - r_corner && y >= height - r_corner) { dx = x - (width - r_corner); dy = y - (height - r_corner); }

      if (dx * dx + dy * dy > r_corner * r_corner) {
        inside = false;
      }

      let r = 15, g = 23, b = 42; // #0f172a slate 900
      if (!inside) {
        // Dark outer
        r = 10; g = 15; b = 30;
      } else {
        // Indigo to violet gradient
        const t = (x + y) / (width + height);
        r = Math.floor(79 + t * 40);   // Indigo-600 to Violet-600
        g = Math.floor(70 - t * 20);
        b = Math.floor(229 + t * 20);

        // Center PDF Document glyph
        const docX1 = Math.floor(width * 0.28);
        const docX2 = Math.floor(width * 0.72);
        const docY1 = Math.floor(height * 0.22);
        const docY2 = Math.floor(height * 0.78);

        if (x >= docX1 && x <= docX2 && y >= docY1 && y <= docY2) {
          // White paper sheet with fold
          const foldSize = Math.floor(width * 0.15);
          if (x >= docX2 - foldSize && y <= docY1 + foldSize && (x - (docX2 - foldSize)) > (foldSize - (y - docY1))) {
            // Folded corner cutout
            r = Math.floor(79 + t * 40);
            g = Math.floor(70 - t * 20);
            b = Math.floor(229 + t * 20);
          } else {
            // Clean white/crimson paper
            r = 255; g = 255; b = 255;

            // Red PDF banner across document
            const bannerY1 = Math.floor(height * 0.44);
            const bannerY2 = Math.floor(height * 0.58);
            if (y >= bannerY1 && y <= bannerY2 && x >= docX1 + 10 && x <= docX2 - 10) {
              r = 225; g = 29; b = 72; // Crimson #e11d48
            }
          }
        }
      }

      rawData[pxOffset] = Math.min(255, Math.max(0, r));
      rawData[pxOffset + 1] = Math.min(255, Math.max(0, g));
      rawData[pxOffset + 2] = Math.min(255, Math.max(0, b));
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

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

const png = createIconPNG(512);
fs.writeFileSync('C:/Users/MY-PC/.gemini/antigravity/scratch/pdf-craft/public/icon.png', png);
console.log('Successfully created public/icon.png (' + png.length + ' bytes)');
