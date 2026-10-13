#!/usr/bin/env node
// tools/try.js — run a chapter's "Predict, then run" and "Break it" blocks
// against YOUR code in src/. PROVIDED.
//
//   node tools/try.js 00          list layer 00's blocks
//   node tools/try.js 00 p1       run prediction 1
//   node tools/try.js 00 b2       run break-it experiment 2
//   node tools/try.js --file my-experiment.js   run your own file
//
// To fill in a prediction, copy its block into a file (e.g. scratch.js),
// replace `null` with your guess, and run it with --file.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({ console });
const load = rel => vm.runInContext(fs.readFileSync(path.join(root, rel), "utf8"), context, { filename: rel });
["lib/course.js", "lib/font5x7.js", "lib/check.js", "lib/experiment.js"].forEach(load);
const MS = context.MS;
const ready = MS.COURSE.layers.filter(l => l.ready);
const loadSources = upto => {
  for (const l of ready.filter(l => !upto || l.id <= upto)) {
    try { load(MS.COURSE.files(l).src); }
    catch (e) { console.log(`${MS.COURSE.files(l).src} has an error: ${e.message}`); process.exit(1); }
  }
};

const [a, b] = process.argv.slice(2);
if (a === "--file") {
  if (!b) { console.log("Usage: node tools/try.js --file scratch.js"); process.exit(1); }
  loadSources();
  console.log(MS.runExperiment(fs.readFileSync(path.resolve(b), "utf8")));
  process.exit(0);
}
const layer = ready.find(l => l.id === String(a || "").padStart(2, "0"));
if (!layer) { console.log("Usage: node tools/try.js <layer> [p1|b1 ...]   e.g. node tools/try.js 00 p1"); process.exit(1); }
const blocks = MS.extractBlocks(fs.readFileSync(path.join(root, MS.COURSE.files(layer).doc), "utf8"));
const named = { p: blocks.filter(x => x.kind === "predict"), b: blocks.filter(x => x.kind === "break") };

if (!b) {
  console.log(`Layer ${layer.id} · ${layer.title}`);
  for (const [k, list] of Object.entries(named)) list.forEach((blk, i) => {
    const title = (blk.code.split("\n").find(l => l.startsWith("// ")) || "").replace(/^\/\/\s*/, "");
    console.log(`  ${k}${i + 1}  ${k === "p" ? "predict" : "break it"}  ${title}`);
  });
  console.log(`\nRun one with: node tools/try.js ${layer.id} p1`);
  process.exit(0);
}
const pick = /^([pb])(\d+)$/.exec(b);
const blk = pick && named[pick[1]][+pick[2] - 1];
if (!blk) { console.log(`No block "${b}" in layer ${layer.id}. Run node tools/try.js ${layer.id} to list them.`); process.exit(1); }
loadSources(layer.id);
console.log(blk.code.split("\n").map(l => "  │ " + l).join("\n") + "\n");
console.log(MS.runExperiment(blk.code));
