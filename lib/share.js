// lib/share.js — packs a learner's work into a link and back. PROVIDED.
// Used by the guide's progress and showcase links and by showcase.html.
// The work rides in the URL fragment (after #), which browsers never send to
// a server: JSON → deflate (when the browser supports CompressionStream) →
// base64url. The first letter says which: "z" compressed, "j" plain JSON.
(function (MS) {
  const toB64u = bytes => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const fromB64u = text => {
    const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  };
  const through = (bytes, stream) =>
    new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer().then(b => new Uint8Array(b));

  MS.share = {
    async pack(obj) {
      const json = new TextEncoder().encode(JSON.stringify(obj));
      if (typeof CompressionStream === "function") return "z" + toB64u(await through(json, new CompressionStream("deflate-raw")));
      return "j" + toB64u(json);
    },
    async unpack(text) {
      const kind = text[0];
      if (kind !== "z" && kind !== "j") throw new Error("this isn't a Motion from Scratch link.");
      if (kind === "z" && typeof DecompressionStream !== "function") throw new Error("this browser can't open compressed links. Try a recent Chrome, Firefox, Safari or Edge.");
      try {
        const bytes = fromB64u(text.slice(1));
        return JSON.parse(new TextDecoder().decode(kind === "z" ? await through(bytes, new DecompressionStream("deflate-raw")) : bytes));
      } catch (e) {
        throw new Error("the link looks damaged or cut off. Try copying it again.");
      }
    },
  };
})(globalThis.MS = globalThis.MS || {});
