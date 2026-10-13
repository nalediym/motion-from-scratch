// lib/notebook.js — run one layer's tests inside a notebook. PROVIDED.
// Used by the Jupyter (Deno) and Observable notebooks, where your code runs
// in the same JavaScript session as the tests.
(function (MS) {
  // Load a layer's test file text, replacing any earlier copy of that
  // layer's tests (so re-running a cell doesn't duplicate them).
  MS.loadTests = function (layerId, testSource) {
    MS.tests = MS.tests.filter(t => t.layer !== layerId);
    MS.visuals = MS.visuals.filter(v => v.layer !== layerId);
    (0, eval)(testSource);
  };

  // Run a layer and return { results, passed, total, pictures, html }.
  // pictures: [{ name, png (base64) | null, error }]
  MS.runLayerReport = function (layerId) {
    const results = MS.runTests(layerId);
    const passed = results.filter(r => r.status === "pass").length;
    const pictures = MS.visuals.filter(v => v.layer === layerId).map(v => {
      try {
        const frame = v.fn();
        const k = Math.max(1, Math.min(6, Math.floor(240 / frame.width)));
        return { name: v.name, png: MS.toBase64(MS.encodePNG(MS.zoomFrame(frame, k))) };
      } catch (e) { return { name: v.name, png: null, error: (e.todo ? "Waiting on: " : "Error: ") + e.message }; }
    });
    const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const color = { pass: "#1d8a5b", fail: "#c93636", todo: "#7d889b" };
    const mark = { pass: "✓", fail: "✗", todo: "·" };
    const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">
<p style="margin:0 0 6px"><strong>Layer ${layerId}: ${passed} / ${results.length} passing</strong></p>
<ul style="list-style:none;padding:0;margin:0 0 10px">${MS.quietTodos(results).map(r => `<li><span style="color:${color[r.status]};font-weight:700;display:inline-block;width:1.2em">${mark[r.status]}</span>${esc(r.name)}${r.message ? `<br><code style="color:${color[r.status]};margin-left:1.2em">${esc(r.message)}</code>` : ""}</li>`).join("")}</ul>
<div style="display:flex;flex-wrap:wrap;gap:14px">${pictures.map(p => `<figure style="margin:0;max-width:260px">${p.png ? `<img alt="${esc(p.name)}" src="data:image/png;base64,${p.png}" style="max-width:100%;image-rendering:pixelated;border:1px solid #c7d5e3">` : ""}<figcaption style="font-size:12px;color:#556275">${esc(p.name)}${p.error ? `<br>${esc(p.error)}` : ""}</figcaption></figure>`).join("")}</div></div>`;
    return { results, passed, total: results.length, pictures, html };
  };
})(globalThis.MS = globalThis.MS || {});
