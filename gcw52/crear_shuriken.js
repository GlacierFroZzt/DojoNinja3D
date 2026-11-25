const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const shurikenDir = path.join(__dirname, 'models', 'shuriken');
if (!fs.existsSync(shurikenDir)) {
  fs.mkdirSync(shurikenDir, { recursive: true });
}

const mtlContent = `newmtl ShurikenSteel
Ka 0.2 0.2 0.25
Kd 0.7 0.75 0.85
Ks 0.95 0.95 1.0
Ns 120.0
d 1.0
illum 2
map_Kd textures/shuriken_metal.png
`;
fs.writeFileSync(path.join(shurikenDir, 'shuriken.mtl'), mtlContent);

let vertices = [];
let uvs = [];
let normals = [];
let faces = [];

const rOuter = 1.0;
const rInner = 0.35;
const rHole = 0.12;
const halfThickness = 0.04;

const points = 4;
const totalAngles = points * 2;

let vIdx = 1;

for (let i = 0; i < totalAngles; i++) {
  const theta = (i / totalAngles) * Math.PI * 2;
  const x = Math.cos(theta) * rHole;
  const y = Math.sin(theta) * rHole;
  vertices.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${halfThickness}`);
  uvs.push(`vt ${(0.5 + x * 0.4).toFixed(4)} ${(0.5 + y * 0.4).toFixed(4)}`);
  normals.push(`vn 0.0000 0.0000 1.0000`);
}
const holeFrontStart = 1;

for (let i = 0; i < totalAngles; i++) {
  const theta = (i / totalAngles) * Math.PI * 2;
  const r = (i % 2 === 0) ? (rInner * 1.2) : rInner;
  const x = Math.cos(theta) * r;
  const y = Math.sin(theta) * r;
  vertices.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${halfThickness}`);
  uvs.push(`vt ${(0.5 + x * 0.45).toFixed(4)} ${(0.5 + y * 0.45).toFixed(4)}`);
  normals.push(`vn 0.0000 0.0000 1.0000`);
}
const midFrontStart = holeFrontStart + totalAngles;

for (let i = 0; i < totalAngles; i++) {
  const theta = (i / totalAngles) * Math.PI * 2;
  const r = (i % 2 === 0) ? rOuter : rInner;
  const x = Math.cos(theta) * r;
  const y = Math.sin(theta) * r;
  vertices.push(`v ${x.toFixed(4)} ${y.toFixed(4)} 0.0000`);
  uvs.push(`vt ${(0.5 + x * 0.48).toFixed(4)} ${(0.5 + y * 0.48).toFixed(4)}`);
  normals.push(`vn ${(Math.cos(theta) * 0.5).toFixed(4)} ${(Math.sin(theta) * 0.5).toFixed(4)} 0.7071`);
}
const outerStart = midFrontStart + totalAngles;

for (let i = 0; i < totalAngles; i++) {
  const theta = (i / totalAngles) * Math.PI * 2;
  const x = Math.cos(theta) * rHole;
  const y = Math.sin(theta) * rHole;
  vertices.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${-halfThickness}`);
  uvs.push(`vt ${(0.5 + x * 0.4).toFixed(4)} ${(0.5 + y * 0.4).toFixed(4)}`);
  normals.push(`vn 0.0000 0.0000 -1.0000`);
}
const holeBackStart = outerStart + totalAngles;

for (let i = 0; i < totalAngles; i++) {
  const theta = (i / totalAngles) * Math.PI * 2;
  const r = (i % 2 === 0) ? (rInner * 1.2) : rInner;
  const x = Math.cos(theta) * r;
  const y = Math.sin(theta) * r;
  vertices.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${-halfThickness}`);
  uvs.push(`vt ${(0.5 + x * 0.45).toFixed(4)} ${(0.5 + y * 0.45).toFixed(4)}`);
  normals.push(`vn 0.0000 0.0000 -1.0000`);
}
const midBackStart = holeBackStart + totalAngles;

for (let i = 0; i < totalAngles; i++) {
  const next = (i + 1) % totalAngles;
  const h1 = holeFrontStart + i;
  const h2 = holeFrontStart + next;
  const m1 = midFrontStart + i;
  const m2 = midFrontStart + next;
  const o1 = outerStart + i;
  const o2 = outerStart + next;

  faces.push(`f ${h1}/${h1}/${h1} ${m1}/${m1}/${m1} ${m2}/${m2}/${m2}`);
  faces.push(`f ${h1}/${h1}/${h1} ${m2}/${m2}/${m2} ${h2}/${h2}/${h2}`);

  faces.push(`f ${m1}/${m1}/${m1} ${o1}/${o1}/${o1} ${o2}/${o2}/${o2}`);
  faces.push(`f ${m1}/${m1}/${m1} ${o2}/${o2}/${o2} ${m2}/${m2}/${m2}`);
}

for (let i = 0; i < totalAngles; i++) {
  const next = (i + 1) % totalAngles;
  const h1 = holeBackStart + i;
  const h2 = holeBackStart + next;
  const m1 = midBackStart + i;
  const m2 = midBackStart + next;
  const o1 = outerStart + i;
  const o2 = outerStart + next;

  faces.push(`f ${h1}/${h1}/${h1} ${m2}/${m2}/${m2} ${m1}/${m1}/${m1}`);
  faces.push(`f ${h1}/${h1}/${h1} ${h2}/${h2}/${h2} ${m2}/${m2}/${m2}`);

  faces.push(`f ${m1}/${m1}/${m1} ${o2}/${o2}/${o2} ${o1}/${o1}/${o1}`);
  faces.push(`f ${m1}/${m1}/${m1} ${m2}/${m2}/${m2} ${o2}/${o2}/${o2}`);
}

for (let i = 0; i < totalAngles; i++) {
  const next = (i + 1) % totalAngles;
  const hf1 = holeFrontStart + i;
  const hf2 = holeFrontStart + next;
  const hb1 = holeBackStart + i;
  const hb2 = holeBackStart + next;

  faces.push(`f ${hf1}/${hf1}/${hf1} ${hb1}/${hb1}/${hb1} ${hb2}/${hb2}/${hb2}`);
  faces.push(`f ${hf1}/${hf1}/${hf1} ${hb2}/${hb2}/${hb2} ${hf2}/${hf2}/${hf2}`);
}

let objContent = `mtllib shuriken.mtl\n`;
objContent += `o Shuriken\n`;
objContent += vertices.join('\n') + '\n';
objContent += uvs.join('\n') + '\n';
objContent += normals.join('\n') + '\n';
objContent += `usemtl ShurikenSteel\n`;
objContent += `s 1\n`;
objContent += faces.join('\n') + '\n';

fs.writeFileSync(path.join(shurikenDir, 'shuriken.obj'), objContent);
console.log('[Shuriken] Modelo OBJ generado exitosamente con ' + vertices.length + ' vértices y ' + faces.length + ' caras.');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
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

const texSize = 256;
const metalData = Buffer.alloc(texSize * texSize * 4);
const texturesDir = path.join(__dirname, 'models', 'ninja', 'textures');

for (let y = 0; y < texSize; y++) {
  for (let x = 0; x < texSize; x++) {
    const idx = (y * texSize + x) * 4;
    const dx = x - 128;
    const dy = y - 128;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const brush = Math.sin(angle * 16) * 15 + ((x * 13 + y * 17) % 7) * 3;
    const rim = (dist > 115) ? 45 : 0;
    const steelBase = 180 + brush + rim;
    const finalVal = Math.min(255, Math.max(40, Math.floor(steelBase)));

    metalData[idx] = finalVal;
    metalData[idx + 1] = Math.min(255, Math.floor(finalVal * 1.02));
    metalData[idx + 2] = Math.min(255, Math.floor(finalVal * 1.08));
    metalData[idx + 3] = 255;
  }
}

fs.writeFileSync(path.join(texturesDir, 'shuriken_metal.png'), encodePNG(texSize, texSize, metalData));
const shurikenTexDir = path.join(shurikenDir, 'textures');
if (!fs.existsSync(shurikenTexDir)) fs.mkdirSync(shurikenTexDir, { recursive: true });
fs.writeFileSync(path.join(shurikenTexDir, 'shuriken_metal.png'), encodePNG(texSize, texSize, metalData));

console.log('[Shuriken] Textura metálica guardada exitosamente.');
