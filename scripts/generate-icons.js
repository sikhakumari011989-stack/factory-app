import fs from 'fs';
import zlib from 'zlib';

function createIconPng(size) {
  const width = size;
  const height = size;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB truecolor
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  function calcCrc(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = calcCrc(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlineLen = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLen);

  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLen;
    rawData[offset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;

      // Distance from center for rounded container
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: slate-950 (#090d16) -> (9, 13, 22)
      let r = 9;
      let g = 13;
      let b = 22;

      // Outer glowing rim
      if (dist < radius + size * 0.02 && dist >= radius - size * 0.02) {
        r = 16;
        g = 185;
        b = 129; // emerald-500
      } else if (dist < radius) {
        // Inner card gradient (#0f172a to #020617)
        const t = y / height;
        r = Math.floor(15 * (1 - t) + 2 * t);
        g = Math.floor(23 * (1 - t) + 6 * t);
        b = Math.floor(42 * (1 - t) + 23 * t);

        // Factory Building silhouette in center
        // Base box: x: 0.25 to 0.75, y: 0.45 to 0.78
        const inBase = x >= size * 0.22 && x <= size * 0.78 && y >= size * 0.50 && y <= size * 0.76;
        
        // Roof saw-tooths:
        // Tooth 1: x: 0.22 to 0.40, y: 0.35 to 0.50
        const t1 = x >= size * 0.22 && x <= size * 0.40 && y >= size * 0.35 + (x - size * 0.22) * 0.8 && y <= size * 0.50;
        // Tooth 2: x: 0.40 to 0.58, y: 0.35 to 0.50
        const t2 = x >= size * 0.40 && x <= size * 0.58 && y >= size * 0.35 + (x - size * 0.40) * 0.8 && y <= size * 0.50;
        // Smokestack: x: 0.62 to 0.72, y: 0.28 to 0.50
        const inStack = x >= size * 0.62 && x <= size * 0.72 && y >= size * 0.28 && y <= size * 0.50;

        // Windows: grid of small punchouts
        const isWindow1 = x >= size * 0.30 && x <= size * 0.38 && y >= size * 0.58 && y <= size * 0.66;
        const isWindow2 = x >= size * 0.46 && x <= size * 0.54 && y >= size * 0.58 && y <= size * 0.66;
        const isDoor = x >= size * 0.62 && x <= size * 0.70 && y >= size * 0.58 && y <= size * 0.76;

        if (isWindow1 || isWindow2) {
          r = 6;
          g = 182;
          b = 212; // cyan-500 glow
        } else if (isDoor) {
          r = 99;
          g = 102;
          b = 241; // indigo-500
        } else if (inBase || t1 || t2 || inStack) {
          r = 16;
          g = 185;
          b = 129; // emerald-500 factory silhouette
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

fs.writeFileSync('public/icon-192.png', createIconPng(192));
fs.writeFileSync('public/icon-512.png', createIconPng(512));
fs.writeFileSync('public/apple-touch-icon.png', createIconPng(180));
console.log('Generated factory PWA icons (192, 512, 180) successfully!');

