#!/usr/bin/env node
// tools/pictures.js — save a layer's test pictures as PNG files. PROVIDED.
//
//   node tools/pictures.js 01      → out/01-1.png, out/01-2.png, ...
//
// Handy anywhere there's no browser: the Colab notebook, a terminal, or an
// AI study buddy that can look at images.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const layerArg = (process.argv[2] || "").padStart(2, "0");
const context = vm.createContext({ console, Buffer });
const load = rel => vm.runInContext(fs.readFileSync(path.join(root, rel), "utf8"), context, { filename: rel });
["lib/course.js", "lib/font5x7.js", "lib/check.js", "lib/png.js"].forEach(load);
const MS = context.MS;
const layer = MS.COURSE.layers.find(l => l.id === layerArg && l.ready);
if (!layer) { console.log(`Usage: node tools/pictures.js <layer>, e.g. 01`); process.exit(1); }

for (const l of MS.COURSE.layers.filter(l => l.ready && l.id <= layer.id)) {
  try { load(MS.COURSE.files(l).src); }
  catch (e) { console.log(`${MS.COURSE.files(l).src} has an error: ${e.message}`); process.exit(1); }
}
load(MS.COURSE.files(layer).test);

const outDir = path.join(root, "out");
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.startsWith(layer.id + "-")) fs.unlinkSync(path.join(outDir, f));
MS.visuals.filter(v => v.layer === layer.id).forEach((v, i) => {
  const file = `out/${layer.id}-${i + 1}.png`;
  try {
    const frame = v.fn();
    const k = Math.max(1, Math.min(6, Math.floor(240 / frame.width)));
    fs.writeFileSync(path.join(root, file), MS.encodePNG(MS.zoomFrame(frame, k)));
    console.log(`${file}  ${v.name}`);
  } catch (e) {
    console.log(`(skipped) ${v.name}: ${e.todo ? "waiting on " : ""}${e.message}`);
  }
});
