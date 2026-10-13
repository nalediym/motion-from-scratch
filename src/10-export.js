// Layer 10 · Export — frames to MP4, then map it to Remotion.
// Read the chapter first (docs/10-export.md). Each comment below is a spec; the tests check it.
(function (MS) {
  // An MP4 file is a list of boxes, and a box can hold other boxes. All numbers
  // are big-endian: the most significant byte comes first.
  // lib/mp4.js (provided) builds the boilerplate boxes with your functions;
  // read it to see each field.

  /** n (a whole number from 0 to 65535) as 2 bytes, biggest first, in a Uint8Array. */
  function u16(n) {
    throw MS.todo("u16");
  }

  /** n (a whole number from 0 to 2³² − 1) as 4 bytes, biggest first, in a Uint8Array. */
  function u32(n) {
    throw MS.todo("u32");
  }

  /**
   * A box, as a Uint8Array: its size in bytes as a u32 (the whole box,
   * these 4 bytes included), its type as 4 ASCII characters, then each part
   * in order. Parts are Uint8Arrays or plain arrays of byte values.
   *   box("abcd", [1, 2]) → [0, 0, 0, 10, 97, 98, 99, 100, 1, 2]
   */
  function box(type, ...parts) {
    throw MS.todo("box");
  }

  /**
   * A "full box": a box whose contents start with a version byte and 3 bytes
   * of flags (biggest first), then the parts.
   */
  function fullBox(type, version, flags, ...parts) {
    throw MS.todo("fullBox");
  }

  /**
   * The time-to-sample box: how long each sample (frame) lasts, in the
   * track's timescale. A full box "stts", version 0, flags 0, holding the
   * number of entries, then for each run of samples in a row with the same
   * duration: how many (u32) and the duration (u32).
   *   stts([3000, 3000, 1500]) holds 2 entries: (2, 3000) and (1, 1500)
   */
  function stts(durations) {
    throw MS.todo("stts");
  }

  /**
   * The sample size box: a full box "stsz", version 0, flags 0, holding a
   * u32 0 (meaning "the sizes differ, here's a list"), the number of samples,
   * then each sample's size in bytes, all u32.
   */
  function stsz(sizes) {
    throw MS.todo("stsz");
  }

  /**
   * The chunk offset box: a full box "stco", version 0, flags 0, holding the
   * number of chunks, then where each chunk's first byte is in the file
   * (counting from the file's first byte as 0), all u32.
   */
  function stco(offsets) {
    throw MS.todo("stco");
  }

  /**
   * The sync sample box: which samples are key frames, where a player can
   * start decoding. `keys` has one true or false per sample. A full box
   * "stss", version 0, flags 0, holding how many keys there are, then each
   * key sample's number, counting the first sample as 1, all u32.
   */
  function stss(keys) {
    throw MS.todo("stss");
  }

  /**
   * A whole MP4 file, as a Uint8Array, for chunks from the encoder:
   * [{ data (Uint8Array), key (boolean), timestamp, duration }], with
   * timestamp and duration in microseconds, one chunk per frame, in order.
   * opts: { width, height, description } (description: the encoder's avcC bytes).
   * The file is three boxes in a row:
   *   ftyp   MS.MP4.ftyp()
   *   mdat   every chunk's data, back to back, in order
   *   moov   mvhd, then trak:
   *            tkhd, then mdia:
   *              mdhd, hdlr, then minf:
   *                vmhd, dinf, then stbl: stsd, stts, stsc, stsz, stco, stss
   * Every MS.MP4 builder is in lib/mp4.js; the rest are your functions.
   * Time: the media (mdhd, stts) counts in 90000ths of a second; a chunk's
   * duration there is Math.round(duration × 90000 ÷ 1000000), and mdhd's
   * duration is their total. The movie (mvhd) counts in milliseconds
   * (timescale 1000): its duration, and tkhd's, is Math.round(total × 1000 ÷ 90000).
   * Each chunk is its own chunk in stco: its offset is where its data starts
   * inside the file.
   */
  function mp4(chunks, opts) {
    throw MS.todo("mp4");
  }

  Object.assign(MS, { u16, u32, box, fullBox, stts, stsz, stco, stss, mp4 });
})(globalThis.MS = globalThis.MS || {});
