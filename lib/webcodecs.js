// lib/webcodecs.js — turn a composition into H.264 video with the browser's encoder. PROVIDED (browser only).
//
//   your renderFrame ──► VideoFrame ──► VideoEncoder (H.264) ──► chunks ──► your mp4() ──► a file
//
// Compressing video is a whole field of its own (motion search, transforms,
// entropy coding), so the browser's WebCodecs API does it here, often on the
// GPU's video hardware. What comes out is a list of "chunks": one compressed
// frame each, with its time and whether it's a key frame. Putting them in a
// file that players understand is layer 10, and that's yours.
(function (MS) {
  // H.264 Constrained Baseline (level 4.0, then 3.1). Baseline never reorders frames,
  // so a chunk's decode order is its display order and no extra table is needed.
  const CODECS = ["avc1.42E028", "avc1.42E01F"];

  // encodeVideo(comp, { bitrate, keyEvery, onProgress }) → Promise of
  //   { chunks: [{ data, key, timestamp, duration }], description, codec, width, height }
  // timestamp and duration are in microseconds; description is the avcC record.
  MS.encodeVideo = async function (comp, { bitrate = 2e6, keyEvery = comp.fps * 2, onProgress } = {}) {
    if (typeof VideoEncoder === "undefined") throw new Error("this browser has no WebCodecs VideoEncoder (try a recent Chrome, Edge, Firefox or Safari, on https or localhost)");
    if (comp.width % 2 || comp.height % 2) throw new Error(`H.264 needs an even width and height; this composition is ${comp.width} × ${comp.height}`);
    let config = null;
    for (const codec of CODECS) {
      const c = { codec, width: comp.width, height: comp.height, bitrate, framerate: comp.fps, avc: { format: "avc" } };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) { config = c; break; } } catch (e) {}
    }
    if (!config) throw new Error(`this browser can't encode H.264 at ${comp.width} × ${comp.height}`);
    const chunks = [];
    let description = null, failure = null;
    const encoder = new VideoEncoder({
      output(chunk, meta) {
        if (meta && meta.decoderConfig && meta.decoderConfig.description) {
          const d = meta.decoderConfig.description;
          description = new Uint8Array(ArrayBuffer.isView(d) ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d.slice(0));
        }
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        chunks.push({ data, key: chunk.type === "key", timestamp: chunk.timestamp, duration: chunk.duration || Math.round(1e6 / comp.fps) });
      },
      error(e) { failure = e; },
    });
    encoder.configure(config);
    const frameUs = 1e6 / comp.fps;
    try {
      for (let n = 0; n < comp.durationInFrames; n++) {
        if (failure) break;
        const frame = MS.renderFrame(comp, n);
        const vf = new VideoFrame(frame.data, { format: "RGBA", codedWidth: frame.width, codedHeight: frame.height, timestamp: Math.round(n * frameUs), duration: Math.round(frameUs) });
        try { encoder.encode(vf, { keyFrame: n % keyEvery === 0 }); } finally { vf.close(); }
        if (onProgress) onProgress(n + 1, comp.durationInFrames);
        // Don't let frames pile up faster than the encoder takes them, and let the page breathe.
        while (!failure && encoder.encodeQueueSize > 4) await new Promise(r => encoder.addEventListener("dequeue", r, { once: true }));
        if (n % 5 === 4) await new Promise(r => setTimeout(r, 0));
      }
      // After an error the browser has already closed the encoder, so only flush a healthy one.
      if (!failure) await encoder.flush();
    } finally {
      if (encoder.state !== "closed") encoder.close();
    }
    if (failure) throw failure;
    if (!description) throw new Error("the encoder didn't give a decoder configuration (avcC)");
    return { chunks, description, codec: config.codec, width: comp.width, height: comp.height };
  };

})(globalThis.MS = globalThis.MS || {});
