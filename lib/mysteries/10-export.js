// lib/mysteries/10-export.js — layer 10's checkpoint picture. PROVIDED.
// A word made of dots. Every dot asks one small question about the bytes of
// an MP4 (byte order, box sizes, run-length durations, the sample tables, how
// the file nests, where each frame's bytes are and when it plays). A dot that
// gets a wrong answer flies off its letter. Every rule right spells a word.
// The video files here are made of pretend frames: the container doesn't care
// what's inside them.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle } = MS.mysteryKit;
  const WORD = "EXPORT", C = 3, M = 6;
  const is = (v, list) => (isBytes(v) || Array.isArray(v)) && v.length === list.length && list.every((b, i) => v[i] === b);
  const ascii = s => Array.from(s, c => c.charCodeAt(0));
  const isBytes = v => Object.prototype.toString.call(v) === "[object Uint8Array]";
  const u32at = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const u32s = (b, from, count) => Array.from({ length: count }, (_, k) => u32at(b, from + 4 * k));
  const fake = (sizes, keys, durations) => sizes.map((s, i) => ({
    data: Uint8Array.from({ length: s }, (_, j) => (i * 53 + j * 11 + 5) & 255), key: keys[i], timestamp: 0, duration: durations[i],
  }));
  const AVCC = Uint8Array.from([1, 77, 64, 31, 255, 225, 0, 3, 103, 77, 64, 1, 0, 2, 104, 238]);
  const FILE_A = () => fake([30, 7, 7, 9, 40, 8], [true, false, false, false, true, false], [41708, 41708, 41708, 41667, 41667, 41667]);
  const make = chunks => MS.mp4(chunks, { width: 320, height: 240, description: AVCC });
  const stbl = file => MS.findBox(MS.parseMP4(file), "moov/trak/mdia/minf/stbl");

  const RULES = [
    { // E: byte order
      rule: "u16 and u32 write a number's bytes biggest first, 2 or 4 of them, as a Uint8Array",
      probes: [
        () => is(MS.u16(0xabcd), [0xab, 0xcd]), () => is(MS.u16(256), [1, 0]), () => is(MS.u32(0xdeadbeef), [222, 173, 190, 239]),
        () => is(MS.u32(2 ** 31), [128, 0, 0, 0]), () => is(MS.u32(65536), [0, 1, 0, 0]), () => is(MS.u32(0), [0, 0, 0, 0]),
        () => isBytes(MS.u16(1)) && isBytes(MS.u32(1)),
      ],
    },
    { // X: boxes
      rule: "a box is its whole size (header included) as a u32, its 4-letter type, then its parts in order; a full box puts a version byte and 3 bytes of flags first",
      probes: [
        () => is(MS.box("moof"), [0, 0, 0, 8, ...ascii("moof")]),
        () => is(MS.box("wxyz", [255], MS.u32(7), []), [0, 0, 0, 13, ...ascii("wxyz"), 255, 0, 0, 0, 7]),
        () => is(MS.box("big ", new Uint8Array(300)).slice(0, 8), [0, 0, 1, 52, ...ascii("big ")]),
        () => is(MS.box("a   ", MS.box("b   ", MS.box("c   "))), [0, 0, 0, 24, ...ascii("a   "), 0, 0, 0, 16, ...ascii("b   "), 0, 0, 0, 8, ...ascii("c   ")]),
        () => is(MS.fullBox("meta", 0, 0), [0, 0, 0, 12, ...ascii("meta"), 0, 0, 0, 0]),
        () => is(MS.fullBox("vers", 2, 0xabcdef, [1]), [0, 0, 0, 13, ...ascii("vers"), 2, 0xab, 0xcd, 0xef, 1]),
      ],
    },
    { // P: durations
      rule: "stts writes one (count, duration) entry for each run of samples in a row that last the same time",
      probes: [
        () => is(MS.stts([1001]), [0, 0, 0, 24, ...ascii("stts"), 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 3, 233]),
        () => { const b = MS.stts([5, 6, 5, 6]); return u32at(b, 12) === 4 && is(u32s(b, 16, 8), [1, 5, 1, 6, 1, 5, 1, 6]); },
        () => { const b = MS.stts([7, 7, 9, 9, 9]); return b.length === 32 && is(u32s(b, 12, 5), [2, 2, 7, 3, 9]); },
        () => is(MS.stts([]), [0, 0, 0, 16, ...ascii("stts"), 0, 0, 0, 0, 0, 0, 0, 0]),
        () => { const b = MS.stts(new Array(500).fill(3754)); return b.length === 24 && is(u32s(b, 12, 3), [1, 500, 3754]); },
      ],
    },
    { // O: the sample tables
      rule: "stsz lists a 0 and the count before the sizes, stco the count before the offsets, and stss the key samples' numbers counting from 1",
      probes: [
        () => is(MS.stsz([70000, 1]), [0, 0, 0, 28, ...ascii("stsz"), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 17, 112, 0, 0, 0, 1]),
        () => is(MS.stsz([]), [0, 0, 0, 20, ...ascii("stsz"), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        () => is(MS.stco([4294967295]), [0, 0, 0, 20, ...ascii("stco"), 0, 0, 0, 0, 0, 0, 0, 1, 255, 255, 255, 255]),
        () => is(MS.stco([]), [0, 0, 0, 16, ...ascii("stco"), 0, 0, 0, 0, 0, 0, 0, 0]),
        () => is(u32s(MS.stss([false, true, false, false, true]), 12, 3), [2, 2, 5]),
        () => is(u32s(MS.stss([true]), 12, 2), [1, 1]),
        () => MS.stss([false, false, false]).length === 16,
      ],
    },
    { // R: the file's shape
      rule: "the file is an ftyp, an mdat holding every chunk's bytes in order, and a moov whose trak, mdia, minf and stbl hold their boxes in the order in mp4's spec",
      probes: [
        () => MS.parseMP4(make(FILE_A())).map(b => b.type).join(" ") === "ftyp mdat moov",
        () => { const c = FILE_A(); return is(MS.findBox(MS.parseMP4(make(c)), "mdat").body, c.flatMap(x => Array.from(x.data))); },
        () => stbl(make(FILE_A())).children.map(b => b.type).join(" ") === "stsd stts stsc stsz stco stss",
        () => MS.findBox(MS.parseMP4(make(FILE_A())), "moov/trak/mdia/minf").children.map(b => b.type).join(" ") === "vmhd dinf stbl",
        () => MS.findBox(MS.parseMP4(make(FILE_A())), "moov/trak/mdia").children.map(b => b.type).join(" ") === "mdhd hdlr minf",
        () => { const f = make(fake([12], [true], [40000])), t = MS.parseMP4(f); return t.reduce((s, b) => s + b.size, 0) === f.length && MS.findBox(t, "mdat").size === 20; },
        () => { const s = MS.findBox(stbl(make(FILE_A())), "stsd").body; return is(s.slice(s.length - AVCC.length), Array.from(AVCC)); },
      ],
    },
    { // T: where and when
      rule: "each stco offset is where that chunk's bytes start in the whole file, sizes match, durations become 90000ths of a second (rounded), mdhd adds them up, and mvhd and tkhd give the total in milliseconds",
      probes: [
        () => { const c = FILE_A(), f = make(c), off = u32s(MS.findBox(stbl(f), "stco").body, 8, 6); return c.every((x, i) => is(f.slice(off[i], off[i] + x.data.length), Array.from(x.data))); },
        () => is(u32s(MS.findBox(stbl(make(FILE_A())), "stsz").body, 12, 6), [30, 7, 7, 9, 40, 8]),
        () => is(u32s(MS.findBox(stbl(make(FILE_A())), "stts").body, 4, 5), [2, 3, 3754, 3, 3750]),
        () => is(u32s(MS.findBox(MS.parseMP4(make(FILE_A())), "moov/trak/mdia/mdhd").body, 12, 2), [90000, 22512]),
        () => is(u32s(MS.findBox(MS.parseMP4(make(FILE_A())), "moov/mvhd").body, 12, 2), [1000, 250]),
        () => u32at(MS.findBox(MS.parseMP4(make(FILE_A())), "moov/trak/tkhd").body, 20) === 250,
        () => is(u32s(MS.findBox(stbl(make(FILE_A())), "stss").body, 4, 3), [2, 1, 5]),
      ],
    },
  ];

  const OFFSETS = [];
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) if (Math.abs(dx) + Math.abs(dy) >= 7) OFFSETS.push([dx, dy]);
  shuffle(OFFSETS, 10);
  const STOPS = [[255, 92, 138], [91, 140, 255], [234, 240, 250]];

  MS.mystery("10", {
    draw() {
      const W = M * 2 + (WORD.length * 6 - 1) * C, H = M * 2 + 7 * C;
      const frame = MS.createFrame(W, H);
      MS.clearFrame(frame, [11, 13, 18]);
      const wrong = WORD.split("").map(() => 0), failed = [];
      let dot = 0;
      [...WORD].forEach((ch, j) => {
        const color = MS.interpolateColors(j, [0, 2.5, 5], STOPS), rules = RULES[j];
        // Dot k asks probes k, k + dots, k + 2 × dots...; with fewer probes than dots, they repeat.
        const n = rules.probes.length, dots = MS.FONT_5x7[ch].join("").split("").filter(cell => cell === "#").length;
        let k = 0;
        MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
          if (cell !== "#") return;
          const gx = M + (j * 6 + c) * C, gy = M + r * C, o = OFFSETS[dot++ % OFFSETS.length];
          const mine = n >= dots ? rules.probes.filter((p, i) => i % dots === k) : [rules.probes[k % n]];
          let right = false;
          try { right = mine.every(p => p() === true); } catch (e) { failed.push(`the ${ch}: ${e.message}`); }
          if (!right) wrong[j]++;
          k++;
          MS.fillRect(frame, right ? gx : gx + o[0], right ? gy : gy + o[1], C, C, color);
        }));
      });
      return { frame, wrong, failed: [...new Set(failed)] };
    },
    check({ frame, wrong, failed }, data) {
      const hints = failed.map(msg => `Part of the picture couldn't be drawn (${msg}).`);
      const names = ["E", "X", "P", "O", "R", "T"];
      wrong.forEach((n, j) => { if (n) hints.push(`Some dots of the ${names[j]} flew off: ${RULES[j].rule}.`); });
      const ok = MS.hashFrame(frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
