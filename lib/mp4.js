// lib/mp4.js — the parts of an MP4 file that are the same in every video. PROVIDED.
//
// Layer 10 has you write an MP4 file byte by byte. Most of its boxes are
// boilerplate: dates set to 0, a "1.0" playback rate, an identity matrix.
// MS.MP4 builds those for you, out of YOUR box(), fullBox(), u16() and u32(),
// so read them: every field is named. The boxes that say where each frame's
// bytes are and when it plays (stts, stsz, stco, stss) are yours to write.
//
// MS.parseMP4(bytes) reads a file back into a tree of boxes, for the tests,
// the pictures and your own curiosity. It doesn't use your code.
// The format is ISO/IEC 14496-12, the "ISO base media file format".
(function (MS) {
  const ascii = s => Array.from(s, c => c.charCodeAt(0));
  const zeros = n => new Array(n).fill(0);
  // A transformation matrix in 16.16 and 2.30 fixed point: the identity.
  const IDENTITY = () => [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(v => MS.u32(v));

  MS.MP4 = {
    ascii,
    // ftyp: which specs this file follows. "isom" is the base format; "avc1" says it holds H.264.
    ftyp: () => MS.box("ftyp", ascii("isom"), MS.u32(512), ascii("isom"), ascii("iso2"), ascii("avc1"), ascii("mp41")),

    // mvhd: the movie header. duration is in the movie's timescale (units per second).
    mvhd: ({ timescale, duration }) => MS.fullBox("mvhd", 0, 0,
      MS.u32(0), MS.u32(0),                  // creation and modification time
      MS.u32(timescale), MS.u32(duration),
      MS.u32(0x00010000), MS.u16(0x0100),    // playback rate 1.0 (16.16), volume 1.0 (8.8)
      zeros(10), ...IDENTITY(), zeros(24),   // reserved, matrix, pre_defined
      MS.u32(2)),                            // the next track would be track 2

    // tkhd: the track header. flags 3 = enabled, in the movie. Width and height are 16.16 fixed point.
    tkhd: ({ duration, width, height }) => MS.fullBox("tkhd", 0, 3,
      MS.u32(0), MS.u32(0), MS.u32(1), MS.u32(0),   // creation, modification, track_ID 1, reserved
      MS.u32(duration), zeros(8),
      MS.u16(0), MS.u16(0), MS.u16(0), MS.u16(0),   // layer, alternate group, volume (0: it's video), reserved
      ...IDENTITY(), MS.u32(width * 65536), MS.u32(height * 65536)),

    // mdhd: the media header. Its timescale is the one stts counts in.
    mdhd: ({ timescale, duration }) => MS.fullBox("mdhd", 0, 0,
      MS.u32(0), MS.u32(0), MS.u32(timescale), MS.u32(duration),
      MS.u16(0x55c4), MS.u16(0)),            // language "und" (undetermined), packed into 15 bits

    // hdlr: what kind of track this is: "vide", video.
    hdlr: () => MS.fullBox("hdlr", 0, 0, MS.u32(0), ascii("vide"), zeros(12), ascii("VideoHandler"), [0]),

    // vmhd: the video media header. flags 1 is required; the rest is unused.
    vmhd: () => MS.fullBox("vmhd", 0, 1, MS.u16(0), MS.u16(0), MS.u16(0), MS.u16(0)),

    // dinf: where the samples are. One "url " entry with flags 1 means "in this file".
    dinf: () => MS.box("dinf", MS.fullBox("dref", 0, 0, MS.u32(1), MS.fullBox("url ", 0, 1))),

    // stsd: how to decode the samples. One avc1 (H.264) entry, holding the encoder's
    // decoder configuration (its avcC record: profile, level, SPS and PPS).
    stsd: ({ width, height, description }) => MS.fullBox("stsd", 0, 0, MS.u32(1),
      MS.box("avc1",
        zeros(6), MS.u16(1),                 // reserved, data_reference_index 1
        zeros(16), MS.u16(width), MS.u16(height),
        MS.u32(0x00480000), MS.u32(0x00480000), // 72 dpi, 16.16
        MS.u32(0), MS.u16(1),                // reserved, frame_count 1
        zeros(32),                           // compressor name (empty)
        MS.u16(0x0018), MS.u16(0xffff),      // depth 24, pre_defined −1
        MS.box("avcC", description))),

    // stsc: which samples are in which chunk. Here every chunk holds exactly one sample.
    stsc: () => MS.fullBox("stsc", 0, 0, MS.u32(1), MS.u32(1), MS.u32(1), MS.u32(1)),
  };

  // Boxes that only hold other boxes.
  const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "dinf", "edts", "udta"]);
  // Read an MP4 into [{ type, start, size, body, children }]. body is the box's bytes after its 8-byte header.
  MS.parseMP4 = function (bytes, start = 0, end = bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), boxes = [];
    let at = start;
    while (at + 8 <= end) {
      const size = view.getUint32(at), type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
      if (size < 8 || at + size > end) throw new Error(`parseMP4: the box at byte ${at} ("${type}") says it's ${size} bytes long, but only ${end - at} are left`);
      const box = { type, start: at, size, body: bytes.subarray(at + 8, at + size) };
      if (CONTAINERS.has(type)) box.children = MS.parseMP4(bytes, at + 8, at + size);
      boxes.push(box);
      at += size;
    }
    if (at !== end) throw new Error(`parseMP4: ${end - at} stray byte(s) at byte ${at}`);
    return boxes;
  };
  // Find a box by its path: MS.findBox(tree, "moov/trak/mdia/minf/stbl/stsz").
  MS.findBox = (tree, path) => path.split("/").reduce((list, type) => {
    const found = list && (Array.isArray(list) ? list : list.children || []).find(b => b.type === type);
    return found || null;
  }, tree);
})(globalThis.MS = globalThis.MS || {});
