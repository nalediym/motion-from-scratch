// lib/check.js — a tiny test library. PROVIDED.
// The same tests run in Node (`node tests/run.js`) and in the browser
// (open tests.html). Everything you build draws into plain arrays, so no
// screen is needed to check it.
(function (MS) {
  MS.tests = [];
  MS.visuals = [];

  // Stubs in src/ do `throw MS.todo("setPixel")` until you write them.
  MS.todo = function (name) {
    const e = new Error(`${name}() is not written yet`);
    e.todo = true;
    return e;
  };

  MS.test = function (layer, name, fn) { MS.tests.push({ layer, name, fn }); };

  // A visual is a picture the browser test page shows next to the results.
  // fn returns a frame ({ width, height, data }).
  MS.visual = function (layer, name, fn) { MS.visuals.push({ layer, name, fn }); };
  // An animation is a picture that moves (from layer 03 on). fn returns a
  // composition; pages play it, and notebooks and terminals show a filmstrip.
  MS.animation = function (layer, name, fn) { MS.visuals.push({ layer, name, fn, kind: "animation" }); };

  // A strip of `count` frames, evenly spaced from first to last, side by side.
  // Uses your renderFrame (layer 03); copies bytes directly so it can't go wrong itself.
  MS.filmstrip = function (comp, count = 6, gap = 2) {
    const n = Math.min(count, comp.durationInFrames), W = comp.width, H = comp.height;
    const strip = { width: n * W + (n - 1) * gap, height: H, data: new Uint8ClampedArray((n * W + (n - 1) * gap) * H * 4) };
    for (let k = 0; k < n; k++) {
      const f = MS.renderFrame(comp, n === 1 ? 0 : Math.round(k * (comp.durationInFrames - 1) / (n - 1)));
      for (let y = 0; y < H; y++) strip.data.set(f.data.subarray(y * W * 4, (y + 1) * W * 4), (y * strip.width + k * (W + gap)) * 4);
    }
    return strip;
  };

  // A canvas for the browser's 2D drawing API (layer 07 uses it for real
  // fonts), or null where there isn't one, like Node.
  MS.createCanvas = (w, h) => typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h)
    : typeof document !== "undefined" ? Object.assign(document.createElement("canvas"), { width: w, height: h }) : null;

  class CheckError extends Error {}
  const show = v => {
    if (v instanceof Uint8ClampedArray || Array.isArray(v)) return `[${Array.from(v).join(", ")}]`;
    return typeof v === "string" ? JSON.stringify(v) : String(v);
  };

  const t = {
    ok(cond, msg) { if (!cond) throw new CheckError(msg || "expected something to be true"); },
    eq(actual, expected, msg) {
      if (actual !== expected) throw new CheckError(`${msg ? msg + ": " : ""}expected ${show(expected)}, got ${show(actual)}`);
    },
    close(actual, expected, eps = 1e-6, msg) {
      if (typeof actual !== "number" || Number.isNaN(actual) || Math.abs(actual - expected) > eps)
        throw new CheckError(`${msg ? msg + ": " : ""}expected about ${expected} (±${eps}), got ${show(actual)}`);
    },
    deep(actual, expected, msg) {
      const a = actual == null ? actual : Array.from(actual), e = expected == null ? expected : Array.from(expected);
      const same = a === e || (Array.isArray(a) && Array.isArray(e) && a.length === e.length && a.every((v, i) => v === e[i]));
      if (!same) throw new CheckError(`${msg ? msg + ": " : ""}expected ${show(expected)}, got ${show(actual)}`);
    },
    pixel(frame, x, y, expected, msg, tol = 0) {
      const i = (y * frame.width + x) * 4, d = frame.data;
      const got = [d[i], d[i + 1], d[i + 2], d[i + 3]];
      const ok = expected.every((v, k) => Math.abs(got[k] - v) <= tol);
      if (!ok) throw new CheckError(`${msg ? msg + ": " : ""}pixel (${x}, ${y}) should be ${show(expected)}${tol ? ` (±${tol})` : ""}, got ${show(got)}`);
    },
    throws(fn, msg) {
      let threw = false;
      try { fn(); } catch (e) { if (e.todo) throw e; threw = true; }
      if (!threw) throw new CheckError(msg || "expected this to throw an error");
    },
  };

  // For display: consecutive "not written yet" results usually share one
  // message ("createFrame() is not written yet"), so keep only the first.
  MS.quietTodos = results => {
    let prev = null;
    return results.map(r => {
      const repeat = r.status === "todo" && r.message === prev;
      prev = r.status === "todo" ? r.message : null;
      return repeat ? Object.assign({}, r, { message: "" }) : r;
    });
  };

  MS.runTests = function (layerId) {
    return MS.tests.filter(x => !layerId || x.layer === layerId).map(x => {
      try { x.fn(t); return { layer: x.layer, name: x.name, status: "pass" }; }
      catch (e) {
        if (e && e.todo) return { layer: x.layer, name: x.name, status: "todo", message: e.message };
        const msg = e instanceof CheckError ? e.message : `${e && e.name ? e.name : "Error"}: ${e && e.message ? e.message : e}`;
        return { layer: x.layer, name: x.name, status: "fail", message: msg };
      }
    });
  };
})(globalThis.MS = globalThis.MS || {});
