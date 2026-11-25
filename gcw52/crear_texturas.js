const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);

  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let scanlineOffset = 0;
  let rgbaOffset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[scanlineOffset++] = 0;
    for (let x = 0; x < width; x++) {
      scanlines[scanlineOffset++] = rgbaBuffer[rgbaOffset++];
      scanlines[scanlineOffset++] = rgbaBuffer[rgbaOffset++];
      scanlines[scanlineOffset++] = rgbaBuffer[rgbaOffset++];
      scanlines[scanlineOffset++] = rgbaBuffer[rgbaOffset++];
    }
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const texturesDir = path.join(__dirname, 'models', 'ninja', 'textures');
if (!fs.existsSync(texturesDir)) {
  fs.mkdirSync(texturesDir, { recursive: true });
}

const size = 256;
const suitData = Buffer.alloc(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4;
    const weave = ((x % 8 < 4) ^ (y % 8 < 4)) ? 32 : 18;
    const noise = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 6;
    const val = Math.min(255, Math.max(0, Math.floor(weave + noise)));

    suitData[idx] = val;
    suitData[idx + 1] = Math.floor(val * 1.05);
    suitData[idx + 2] = Math.floor(val * 1.25);
    suitData[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'ninja_suit.png'), encodePNG(size, size, suitData));

const accentData = Buffer.alloc(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const idx = (y * size + x) * 4;
    const isGoldStripe = (y > 40 && y < 55) || (y > 200 && y < 215);
    if (isGoldStripe) {
      accentData[idx] = 220;
      accentData[idx + 1] = 180;
      accentData[idx + 2] = 40;
    } else {
      const gradient = Math.sin(y / size * Math.PI) * 40;
      accentData[idx] = Math.min(255, Math.floor(180 + gradient));
      accentData[idx + 1] = 20;
      accentData[idx + 2] = 30;
    }
    accentData[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'ninja_accent.png'), encodePNG(size, size, accentData));

const floorSize = 512;
const floorData = Buffer.alloc(floorSize * floorSize * 4);
for (let y = 0; y < floorSize; y++) {
  for (let x = 0; x < floorSize; x++) {
    const idx = (y * floorSize + x) * 4;
    const gridX = x % 64;
    const gridY = y % 64;
    const isBorder = (gridX < 2 || gridY < 2);
    
    if (isBorder) {
      floorData[idx] = 45;
      floorData[idx + 1] = 40;
      floorData[idx + 2] = 35;
    } else {
      const grain = ((x * 7 + y * 13) % 23) - 11;
      const baseCol = 95 + grain;
      floorData[idx] = Math.floor(baseCol * 1.05);
      floorData[idx + 1] = Math.floor(baseCol * 0.95);
      floorData[idx + 2] = Math.floor(baseCol * 0.85);
    }
    floorData[idx + 3] = 255;
  }
}
fs.writeFileSync(path.join(texturesDir, 'dojo_floor.png'), encodePNG(floorSize, floorSize, floorData));

console.log('Texturas generadas con éxito en: ' + texturesDir);
