// lib/png.js — turn a frame into PNG file bytes, from scratch. PROVIDED.
// Used by the notebooks and `node tools/pictures.js` to show your pictures
// where there's no <canvas>.
//
// A PNG file is a signature followed by "chunks". Each chunk is:
//   [length: 4 bytes][type: 4 letters][data][CRC-32 checksum: 4 bytes]
//
//   89 50 4E 47 0D 0A 1A 0A   signature ("\x89PNG\r\n\x1a\n")
//   IHDR   width, height, bit depth 8, color type 6 (RGBA)
//   IDAT   the pixels, wrapped in zlib format
//   IEND   end of file
//
// The pixels are your frame.data, one row at a time, each row starting with
// a "filter" byte (0 = none). Real encoders then compress with DEFLATE; we
// use DEFLATE's "stored" mode, which wraps the bytes without compressing
// them. Files are bigger, but every byte is easy to follow.
(function (MS) {
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes, start, end) {
    let c = 0xffffffff;
    for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function adler32(bytes) {
    let a = 1, b = 0;
    for (let i = 0; i < bytes.length; i++) { a = (a + bytes[i]) % 65521; b = (b + a) % 65521; }
    return ((b << 16) | a) >>> 0;
  }

  MS.encodePNG = function (frame) {
    const { width: w, height: h, data } = frame;
    // 1. raw scanlines: filter byte 0, then the row's RGBA bytes
    const raw = new Uint8Array(h * (1 + w * 4));
    for (let y = 0; y < h; y++) {
      raw[y * (1 + w * 4)] = 0;
      raw.set(data.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1);
    }
    // 2. zlib stream: 2-byte header, stored DEFLATE blocks (max 65535 bytes each), Adler-32
    const blocks = Math.max(1, Math.ceil(raw.length / 65535));
    const z = new Uint8Array(2 + raw.length + blocks * 5 + 4);
    let p = 0;
    z[p++] = 0x78; z[p++] = 0x01;
    for (let i = 0; i < blocks; i++) {
      const start = i * 65535, len = Math.min(65535, raw.length - start);
      z[p++] = i === blocks - 1 ? 1 : 0;            // BFINAL bit, BTYPE 00 = stored
      z[p++] = len & 255; z[p++] = len >>> 8;       // LEN, little-endian
      z[p++] = ~len & 255; z[p++] = (~len >>> 8) & 255; // NLEN = one's complement
      z.set(raw.subarray(start, start + len), p); p += len;
    }
    const ad = adler32(raw);
    z[p++] = ad >>> 24; z[p++] = (ad >>> 16) & 255; z[p++] = (ad >>> 8) & 255; z[p++] = ad & 255;
    // 3. chunks
    const chunk = (type, body) => {
      const out = new Uint8Array(12 + body.length);
      const v = new DataView(out.buffer);
      v.setUint32(0, body.length);
      for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
      out.set(body, 8);
      v.setUint32(8 + body.length, crc32(out, 4, 8 + body.length));
      return out;
    };
    const ihdr = new Uint8Array(13);
    const iv = new DataView(ihdr.buffer);
    iv.setUint32(0, w); iv.setUint32(4, h);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", z), chunk("IEND", new Uint8Array(0))];
    const file = new Uint8Array(parts.reduce((n, a) => n + a.length, 0));
    let o = 0;
    for (const a of parts) { file.set(a, o); o += a.length; }
    return file;
  };

  // Scale a frame up by a whole number, nearest-neighbor, so small test
  // pictures stay crisp when shown as an image.
  MS.zoomFrame = function (frame, k) {
    const out = { width: frame.width * k, height: frame.height * k, data: new Uint8ClampedArray(frame.width * k * frame.height * k * 4) };
    for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
      const s = ((Math.floor(y / k) * frame.width) + Math.floor(x / k)) * 4, d = (y * out.width + x) * 4;
      out.data[d] = frame.data[s]; out.data[d + 1] = frame.data[s + 1]; out.data[d + 2] = frame.data[s + 2]; out.data[d + 3] = frame.data[s + 3];
    }
    return out;
  };

  MS.toBase64 = function (bytes) {
    // globalThis.Buffer, not bare Buffer: notebooks treat unknown bare names as cell references.
    if (globalThis.Buffer) return globalThis.Buffer.from(bytes).toString("base64");
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
})(globalThis.MS = globalThis.MS || {});
