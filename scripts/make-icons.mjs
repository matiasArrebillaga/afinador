// ponytail: provisional icon drawn from rectangles (the meter); replace when the real icon exists.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { crc32, deflateSync } from 'node:zlib';

const BG = [11, 12, 13];
const WHITE = [238, 240, 238];
const GREEN = [94, 227, 143];

function draw(size, pad) {
  const px = Buffer.alloc(size * size * 3);
  const fill = (x0, y0, w, h, [r, g, b]) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = (y * size + x) * 3;
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
      }
    }
  };
  fill(0, 0, size, size, BG);
  const unit = (size - 2 * pad) / 16;
  for (let k = 0; k < 7; k++) {
    const x = Math.round(pad + unit * (1.4 + k * 2));
    fill(
      x,
      Math.round(pad + unit * 5),
      Math.round(unit * 1.2),
      Math.round(unit * 6),
      k === 3 ? GREEN : WHITE,
    );
  }
  return px;
}

function png(size, pad) {
  const px = draw(size, pad);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++)
    px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#0b0c0d"/>${[
  0, 1, 2, 3, 4, 5, 6,
]
  .map(
    (k) =>
      `<rect x="${1.4 + k * 2}" y="5" width="1.2" height="6" fill="${k === 3 ? '#5ee38f' : '#eef0ee'}"/>`,
  )
  .join('')}</svg>`;

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', png(192, 12));
writeFileSync('public/icons/icon-512.png', png(512, 32));
writeFileSync('public/icons/icon-maskable-512.png', png(512, 104)); // 80 % safe zone
writeFileSync('public/icons/icon.svg', svg);
