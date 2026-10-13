#!/usr/bin/env node
// tools/build-checkpoints.js — writes checkpoints/NN-*.js from each chapter's
// ```js checkpoint block. For maintainers:  node tools/build-checkpoints.js
// (The chapter is the single source; learners edit the generated file.)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, "lib/course.js"), "utf8"), ctx);
const C = ctx.MS.COURSE;
fs.mkdirSync(path.join(root, "checkpoints"), { recursive: true });
for (const l of C.layers.filter(l => l.ready)) {
  const f = C.files(l);
  const m = /```js checkpoint\n([\s\S]*?)```/.exec(fs.readFileSync(path.join(root, f.doc), "utf8"));
  if (!m) { console.log(`${f.doc}: no checkpoint block`); continue; }
  fs.writeFileSync(path.join(root, f.checkpoint), m[1].replace(/^(\/\/ [^\n]*\n)/, `$1// Check with: node tests/run.js ${l.id}\n`));
  console.log(`${f.checkpoint} written`);
}
