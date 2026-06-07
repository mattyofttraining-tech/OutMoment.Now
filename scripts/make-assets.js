/**
 * Generates the required app image assets (icon, splash, adaptive icon,
 * favicon) as real PNGs with zero dependencies, so the project builds out of
 * the box. These are tasteful dark placeholders with a soft golden gradient —
 * replace with final branded art before shipping.
 *
 * Run: node scripts/make-assets.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(OUT, { recursive: true });

// Brand palette
const BG = [11, 11, 15]; // #0B0B0F
const ACCENT = [201, 162, 39]; // #C9A227

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/** Build an RGBA pixel buffer with a radial golden glow centred on the canvas. */
function render(width, height, { glow = true } = {}) {
  const buf = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.hypot(cx, cy);
  // Disc radius for the "lens" mark
  const disc = Math.min(width, height) * 0.16;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const d = Math.hypot(x - cx, y - cy);

      // Background with a subtle vertical darkening + optional centre glow.
      const vt = y / height;
      let r = lerp(BG[0] + 8, BG[0], vt);
      let g = lerp(BG[1] + 8, BG[1], vt);
      let b = lerp(BG[2] + 12, BG[2], vt);

      if (glow) {
        const glowT = Math.max(0, 1 - d / (maxR * 0.9));
        const gi = Math.pow(glowT, 2.2) * 0.5;
        r = lerp(r, ACCENT[0], gi);
        g = lerp(g, ACCENT[1], gi);
        b = lerp(b, ACCENT[2], gi);
      }

      // Centre "aperture" ring mark.
      const ring = Math.abs(d - disc);
      if (ring < Math.max(2, disc * 0.06)) {
        r = ACCENT[0];
        g = ACCENT[1];
        b = ACCENT[2];
      } else if (d < disc * 0.5) {
        r = lerp(r, 245, 0.9);
        g = lerp(g, 245, 0.9);
        b = lerp(b, 247, 0.9);
      }

      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return buf;
}

/** Encode an RGBA buffer to a PNG Buffer. */
function encodePNG(width, height, rgba) {
  // Add a filter byte (0 = none) at the start of each scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// CRC32 (PNG)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

function write(name, width, height, opts) {
  const png = encodePNG(width, height, render(width, height, opts));
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(`  ✓ ${name} (${width}×${height}, ${(png.length / 1024).toFixed(0)}kb)`);
}

console.log('Generating OurMoment assets…');
write('icon.png', 1024, 1024);
write('adaptive-icon.png', 1024, 1024);
write('splash.png', 1284, 1284);
write('favicon.png', 64, 64);
console.log('Done.');
