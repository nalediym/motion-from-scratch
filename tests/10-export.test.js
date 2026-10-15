// tests/10-export.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "10";
  const bytes = v => Array.from(v || []);
  const isBytes = v => Object.prototype.toString.call(v) === "[object Uint8Array]";
  const ascii = s => Array.from(s, c => c.charCodeAt(0));
  const u32at = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const u32s = (b, from, count) => Array.from({ length: count }, (_, k) => u32at(b, from + 4 * k));
  // Pretend encoder output: n chunks of made-up bytes (the file doesn't care what's inside them).
  const fake = (n, { size = i => 10 + ((i * 7) % 13), keyEvery = 4, duration = 33333 } = {}) => Array.from({ length: n }, (_, i) => ({
    data: Uint8Array.from({ length: size(i) }, (_, j) => (i * 31 + j * 7 + 1) & 255), key: i % keyEvery === 0, timestamp: i * duration, duration,
  }));
  const AVCC = Uint8Array.from([1, 66, 224, 40, 255, 225, 0, 4, 103, 66, 224, 40, 1, 0, 2, 104, 206]);
  const parse = file => { try { return MS.parseMP4(file); } catch (e) { throw new Error("the file doesn't read back as boxes: " + e.message); } };

  MS.test(L, "u16 writes a number as 2 bytes, biggest first", t => {
    t.deep(bytes(MS.u16(0x1234)), [0x12, 0x34], "0x1234");
    t.deep(bytes(MS.u16(65535)), [255, 255], "65535");
    t.deep(bytes(MS.u16(5)), [0, 5], "5");
  });

  MS.test(L, "u32 writes a number as 4 bytes, biggest first", t => {
    t.deep(bytes(MS.u32(0x12345678)), [0x12, 0x34, 0x56, 0x78], "0x12345678");
    t.deep(bytes(MS.u32(300)), [0, 0, 1, 44], "300");
    t.deep(bytes(MS.u32(4294967295)), [255, 255, 255, 255], "2³² − 1, the biggest");
    t.ok(isBytes(MS.u32(1)), "it should return a Uint8Array");
  });

  MS.test(L, "box: 4 bytes of size (including itself), 4 of type, then the contents", t => {
    t.deep(bytes(MS.box("free")), [0, 0, 0, 8, ...ascii("free")], "an empty box");
    t.deep(bytes(MS.box("abcd", [1, 2], MS.u16(3))), [0, 0, 0, 12, ...ascii("abcd"), 1, 2, 0, 3], "contents from a plain array and a Uint8Array, in order");
    t.ok(isBytes(MS.box("free")), "it should return a Uint8Array");
  });

  MS.test(L, "box: boxes go inside boxes", t => {
    const inner = MS.box("in  ", [9]);
    t.deep(bytes(MS.box("out ", inner, inner)), [0, 0, 0, 26, ...ascii("out "), 0, 0, 0, 9, ...ascii("in  "), 9, 0, 0, 0, 9, ...ascii("in  "), 9], "two boxes in a box");
  });

  MS.test(L, "fullBox: a box whose contents start with a version byte and 3 bytes of flags", t => {
    t.deep(bytes(MS.fullBox("tkhd", 0, 3)), [0, 0, 0, 12, ...ascii("tkhd"), 0, 0, 0, 3], "version 0, flags 3");
    t.deep(bytes(MS.fullBox("abcd", 1, 0x010203, [7])), [0, 0, 0, 13, ...ascii("abcd"), 1, 1, 2, 3, 7], "version 1, flags 0x010203, then the rest");
  });

  MS.test(L, "stts: how long each sample lasts, with runs of equal durations written once", t => {
    t.deep(bytes(MS.stts([3000, 3000, 3000])), [0, 0, 0, 24, ...ascii("stts"), 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 11, 184], "three samples of 3000: one entry");
    const b = MS.stts([3000, 3000, 1500, 3000, 3000]);
    t.eq(u32at(b, 12), 3, "entry count for 3000, 3000, 1500, 3000, 3000");
    t.deep(u32s(b, 16, 6), [2, 3000, 1, 1500, 2, 3000], "the entries (count, duration)");
    t.deep(bytes(MS.stts([])), [0, 0, 0, 16, ...ascii("stts"), 0, 0, 0, 0, 0, 0, 0, 0], "no samples");
  });

  MS.test(L, "stsz: 0 (sizes differ), the sample count, then every sample's size", t => {
    const b = MS.stsz([1200, 85, 90]);
    t.eq(b.length, 32, "size");
    t.deep(bytes(b.slice(4, 8)), ascii("stsz"), "type");
    t.deep(u32s(b, 8, 6), [0, 0, 3, 1200, 85, 90], "version and flags, 0, count, sizes");
  });

  MS.test(L, "stco: the count, then where each chunk starts in the file", t => {
    const b = MS.stco([48, 1248, 1333]);
    t.deep(bytes(b.slice(0, 8)), [0, 0, 0, 28, ...ascii("stco")], "size and type");
    t.deep(u32s(b, 8, 5), [0, 3, 48, 1248, 1333], "version and flags, count, offsets");
  });

  MS.test(L, "stss: the numbers of the key samples, counting from 1", t => {
    const b = MS.stss([true, false, false, true, false, true]);
    t.deep(bytes(b.slice(4, 8)), ascii("stss"), "type");
    t.deep(u32s(b, 12, 4), [3, 1, 4, 6], "count, then samples 1, 4 and 6");
    t.eq(MS.stss([false, false]).length, 16, "no key samples: an empty list");
  });

  const file = (n = 10, opts) => MS.mp4(fake(n, opts), { width: 216, height: 384, description: AVCC });

  MS.test(L, "mp4: an ftyp, then the mdat, then the moov, and nothing else", t => {
    const f = file();
    t.ok(isBytes(f), "it should return a Uint8Array");
    t.deep(parse(f).map(b => b.type), ["ftyp", "mdat", "moov"], "the top-level boxes");
    t.deep(bytes(MS.findBox(parse(f), "ftyp").body), bytes(MS.MP4.ftyp().slice(8)), "the ftyp is MS.MP4.ftyp()");
  });

  MS.test(L, "mp4: the mdat holds every chunk's bytes, back to back, in order", t => {
    const chunks = fake(6), f = MS.mp4(chunks, { width: 216, height: 384, description: AVCC });
    const all = chunks.flatMap(c => bytes(c.data));
    t.deep(bytes(MS.findBox(parse(f), "mdat").body), all, "the mdat's contents");
  });

  MS.test(L, "mp4: the track's boxes nest in the right order", t => {
    const tree = parse(file());
    t.deep(MS.findBox(tree, "moov").children.map(b => b.type), ["mvhd", "trak"], "moov");
    t.deep(MS.findBox(tree, "moov/trak").children.map(b => b.type), ["tkhd", "mdia"], "trak");
    t.deep(MS.findBox(tree, "moov/trak/mdia").children.map(b => b.type), ["mdhd", "hdlr", "minf"], "mdia");
    t.deep(MS.findBox(tree, "moov/trak/mdia/minf").children.map(b => b.type), ["vmhd", "dinf", "stbl"], "minf");
    t.deep(MS.findBox(tree, "moov/trak/mdia/minf/stbl").children.map(b => b.type), ["stsd", "stts", "stsc", "stsz", "stco", "stss"], "stbl");
  });

  MS.test(L, "mp4: stco points at each chunk's first byte in the file, and stsz gives its size", t => {
    const chunks = fake(7, { size: i => 20 + i * 3 }), f = MS.mp4(chunks, { width: 216, height: 384, description: AVCC });
    const stbl = MS.findBox(parse(f), "moov/trak/mdia/minf/stbl");
    const offsets = u32s(MS.findBox(stbl, "stco").body, 8, 7), sizes = u32s(MS.findBox(stbl, "stsz").body, 12, 7);
    t.deep(sizes, chunks.map(c => c.data.length), "sizes");
    chunks.forEach((c, i) => t.deep(bytes(f.slice(offsets[i], offsets[i] + sizes[i])), bytes(c.data), `the bytes at chunk ${i + 1}'s offset`));
  });

  MS.test(L, "mp4: time is counted in 90000ths of a second, from each chunk's duration", t => {
    const tree = parse(file(30, { duration: 33333 }));
    const mdhd = MS.findBox(tree, "moov/trak/mdia/mdhd").body, mvhd = MS.findBox(tree, "moov/mvhd").body;
    t.deep(u32s(mdhd, 12, 2), [90000, 90000], "mdhd: timescale 90000, duration 30 × 3000 (one second)");
    t.deep(u32s(mvhd, 12, 2), [1000, 1000], "mvhd: timescale 1000, duration in milliseconds");
    t.deep(u32s(MS.findBox(tree, "moov/trak/mdia/minf/stbl/stts").body, 4, 3), [1, 30, 3000], "stts: one run of 30 samples of 3000");
    t.eq(u32at(MS.findBox(tree, "moov/trak/tkhd").body, 20), 1000, "tkhd's duration, in the movie's timescale");
  });

  MS.test(L, "mp4: key frames in stss, and the encoder's description in the sample description", t => {
    const tree = parse(file(10, { keyEvery: 4 })), stbl = MS.findBox(tree, "moov/trak/mdia/minf/stbl");
    t.deep(u32s(MS.findBox(stbl, "stss").body, 4, 4), [3, 1, 5, 9], "key samples 1, 5 and 9");
    const stsd = MS.findBox(stbl, "stsd").body, tail = bytes(stsd.slice(stsd.length - AVCC.length - 8));
    t.deep(tail, [0, 0, 0, 8 + AVCC.length, ...ascii("avcC"), ...bytes(AVCC)], "the avcC box at the end of stsd");
  });

  // ---- pictures ----
  const KINDS = [["ftyp", [255, 92, 138]], ["mdat", [91, 140, 255]], ["moov", [120, 130, 150]], ["stbl", [234, 240, 250]], ["stsd", [250, 200, 80]]];
  MS.visual(L, "Every byte of a small MP4 as one pixel: ftyp (pink), mdat (blue), moov (grey), the sample tables (white) and the decoder setup (yellow); white dots mark where key frames start", () => {
    const chunks = fake(48, { size: i => (i % 12 === 0 ? 140 : 18 + ((i * 17) % 30)), keyEvery: 12 });
    const f = MS.mp4(chunks, { width: 216, height: 384, description: AVCC }), tree = MS.parseMP4(f);
    const W = 96, H = Math.ceil(f.length / W), pic = MS.createFrame(W + 4, H + 4);
    MS.clearFrame(pic, [11, 13, 18]);
    const paint = (box, color) => { for (let i = box.start; i < box.start + box.size; i++) MS.setPixel(pic, 2 + (i % W), 2 + Math.floor(i / W), color); };
    const color = t => KINDS.find(k => k[0] === t)[1];
    for (const t of ["ftyp", "mdat", "moov"]) paint(MS.findBox(tree, t), color(t));
    paint(MS.findBox(tree, "moov/trak/mdia/minf/stbl"), color("stbl"));
    paint(MS.findBox(tree, "moov/trak/mdia/minf/stbl/stsd"), color("stsd"));
    chunks.forEach((c, i) => { if (c.key) { let at = MS.findBox(tree, "mdat").start + 8 + chunks.slice(0, i).reduce((s, x) => s + x.data.length, 0); MS.setPixel(pic, 2 + (at % W), 2 + Math.floor(at / W), [255, 255, 255]); } });
    return pic;
  });

  MS.exporter(L, "KineticIntro, ready to export: press Export MP4 (in a browser)", () => MS.kineticIntro(216));
})(globalThis.MS = globalThis.MS || {});
