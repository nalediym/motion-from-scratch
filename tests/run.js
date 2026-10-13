#!/usr/bin/env node
// tests/run.js — run the course tests (and checkpoints) in a terminal. PROVIDED.
//
//   node tests/run.js        every layer that's ready
//   node tests/run.js 01     just layer 01
//
// Needs only Node (no npm install). Your AI study buddy can run this too.
// When a layer's tests all pass, its checkpoint unlocks right here: the
// mystery picture is drawn in your terminal and your answers are checked.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const context = vm.createContext({ console });
const load = rel => {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return false;
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: rel });
  return true;
};

for (const f of ["lib/course.js", "lib/font5x7.js", "lib/check.js", "lib/experiment.js", "lib/checkpoint.js", "lib/checkpoint-data.js"]) load(f);
const MS = context.MS;
const wanted = process.argv[2];
const layers = MS.COURSE.layers.filter(l => l.ready && (!wanted || l.id === wanted.padStart(2, "0")));
if (!layers.length) { console.log(`No ready layer matches "${wanted}".`); process.exit(1); }

// Load every ready layer's source (later layers build on earlier ones),
// then the tests and checkpoint answers for the layers we were asked about.
for (const l of MS.COURSE.layers.filter(l => l.ready)) {
  try { load(MS.COURSE.files(l).src); }
  catch (e) { console.log(`\n✗ ${MS.COURSE.files(l).src} has an error before any test could run:\n  ${e.message}\n`); process.exit(1); }
}
for (const l of layers) {
  load(MS.COURSE.files(l).test);
  try { load(MS.COURSE.files(l).checkpoint); }
  catch (e) { console.log(`\n✗ ${MS.COURSE.files(l).checkpoint} has an error: ${e.message}\n`); }
}

const icon = { pass: "✓", fail: "✗", todo: "·" };
let failed = 0, todo = 0, passed = 0, complete = 0, nextUp = null;
for (const l of layers) {
  const results = MS.runTests(l.id);
  const p = results.filter(r => r.status === "pass").length;
  console.log(`\nLayer ${l.id} · ${l.title}  (${p}/${results.length} tests)`);
  for (const r of results) {
    console.log(`  ${icon[r.status]} ${r.name}${r.message ? `\n      ${r.message}` : ""}`);
    if (r.status === "pass") passed++; else if (r.status === "todo") todo++; else failed++;
  }
  const cp = MS.runCheckpoint(l.id, results);
  if (cp.available) console.log("\n" + MS.checkpointText(cp, MS.COURSE.files(l).checkpoint));
  const done = cp.available ? cp.complete : p === results.length;
  if (done) complete++;
  if (!nextUp && !done) nextUp = { layer: l, tests: p === results.length };
}
console.log(`\n${passed} passed · ${failed} failing · ${todo} not written yet · ${complete}/${layers.length} layer(s) complete`);
if (nextUp && !nextUp.tests) console.log(`Next up: layer ${nextUp.layer.id} (${nextUp.layer.title}). Read ${MS.COURSE.files(nextUp.layer).doc}`);
else if (nextUp) console.log(`Next up: the layer ${nextUp.layer.id} checkpoint. Answer the questions in ${MS.COURSE.files(nextUp.layer).checkpoint}, then run this again.`);
else console.log("Every layer here is complete. Open tests.html to see your pictures.");
process.exit(failed || todo || nextUp ? 1 : 0);
