/**
 * Web/PWA export for saved photos. Browsers can't write to a camera roll, so
 * the equivalent of "export to device" is a single ZIP download of every saved
 * moment. The ZIP is built in-memory with STORE (no compression) entries —
 * JPEGs are already compressed, and this keeps us dependency-free.
 */

export interface WebExportItem {
  /** Becomes the filename inside the archive (sanitised, .jpg appended). */
  name: string;
  url: string;
}

export interface WebExportResult {
  ok: number;
  failed: number;
}

/** CRC-32 (the one ZIP requires), small table-driven implementation. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60) || 'photo';
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  offset: number;
}

/** Build a STORE-only ZIP from named binary entries. */
function buildZip(files: { name: string; data: Uint8Array }[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  const push = (chunk: Uint8Array) => {
    chunks.push(chunk);
    offset += chunk.length;
  };

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    entries.push({ name: file.name, data: file.data, crc, offset });

    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true); // local file header signature
    header.setUint16(4, 20, true); // version needed
    header.setUint16(6, 0x0800, true); // UTF-8 names
    header.setUint16(8, 0, true); // method: STORE
    header.setUint32(14, crc, true);
    header.setUint32(18, file.data.length, true); // compressed size
    header.setUint32(22, file.data.length, true); // uncompressed size
    header.setUint16(26, nameBytes.length, true);
    push(new Uint8Array(header.buffer));
    push(nameBytes);
    push(file.data);
  }

  const centralStart = offset;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true); // central directory signature
    central.setUint16(4, 20, true); // version made by
    central.setUint16(6, 20, true); // version needed
    central.setUint16(8, 0x0800, true); // UTF-8 names
    central.setUint16(10, 0, true); // method: STORE
    central.setUint32(16, entry.crc, true);
    central.setUint32(20, entry.data.length, true);
    central.setUint32(24, entry.data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint32(42, entry.offset, true);
    push(new Uint8Array(central.buffer));
    push(nameBytes);
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // end of central directory
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, offset - centralStart, true);
  end.setUint32(16, centralStart, true);
  push(new Uint8Array(end.buffer));

  return new Blob(chunks as BlobPart[], { type: 'application/zip' });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a beat to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Download every saved photo as `OurMoment-Saved.zip`. Fetches each image,
 * skips any that fail (CORS/offline) and reports the counts so the UI can be
 * honest about partial exports.
 */
export async function exportPhotosAsZip(items: WebExportItem[]): Promise<WebExportResult> {
  const files: { name: string; data: Uint8Array }[] = [];
  let failed = 0;
  const seen = new Set<string>();

  for (const item of items) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      let name = `${sanitizeName(item.name)}.jpg`;
      // ZIP readers choke on duplicate names — number them.
      for (let i = 2; seen.has(name); i++) name = `${sanitizeName(item.name)}-${i}.jpg`;
      seen.add(name);
      files.push({ name, data: buf });
    } catch (e) {
      console.warn('[webExport] fetch failed', item.name, e);
      failed++;
    }
  }

  if (files.length > 0) {
    triggerDownload(buildZip(files), 'OurMoment-Saved.zip');
  }
  return { ok: files.length, failed };
}
