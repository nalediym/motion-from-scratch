#!/usr/bin/env node
// tools/new-layer.js — sets up a new layer from the templates. For maintainers.
//
//   node tools/new-layer.js 03 [--kit path/to/kit]
//
// The layer must already be listed in lib/course.js (id, slug, title, builds).
// Creates, from tools/templates/:
//   docs/NN-name.md            the chapter
//   src/NN-name.js             the starter code
//   tests/NN-name.test.js      the tests
//   lib/mysteries/NN-name.js   the checkpoint picture
//   <kit>/solutions/NN-name.js the private solution (with --kit)
// It never overwrites a file. Every TODO(author) must go before the layer
// ships: node tools/check-layer.js NN finds the ones left.
const fs = require("fs");
const path = require("path");
const { root, sandbox, readKit, arg } = require("./course-vm");

const id = (process.argv[2] || "").padStart(2, "0");
const { MS } = sandbox();
const layers = MS.COURSE.layers;
const layer = layers.find(l => l.id === id);
if (!layer || !/^\d\d$/.test(id)) { console.log("Usage: node tools/new-layer.js <id> [--kit <folder>]   (the id must be listed in lib/course.js)"); process.exit(1); }

const base = `${layer.id}-${layer.slug}`;
const earlier = layers.filter(l => l.id < id);
const fill = text => text
  .replace(/\{\{id\}\}/g, layer.id).replace(/\{\{slug\}\}/g, layer.slug).replace(/\{\{title\}\}/g, layer.title)
  .replace(/\{\{builds\}\}/g, layer.builds).replace(/\{\{base\}\}/g, base)
  .replace(/\{\{buildsOn\}\}/g, earlier.length ? (earlier.length === 1 ? "layer 00" : `layers 00–${earlier[earlier.length - 1].id}`) : "nothing yet");

const files = MS.COURSE.files(layer);
const plan = [
  ["chapter.md", files.doc], ["stub.js", files.src], ["test.js", files.test], ["mystery.js", files.mystery],
];
const kit = readKit(arg("--kit"));
if (kit) plan.push(["solution.js", kit.solution(base)]);

for (const [template, out] of plan) {
  const target = path.isAbsolute(out) ? out : path.join(root, out);
  if (fs.existsSync(target)) { console.log(`  kept     ${out} (already exists)`); continue; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, fill(fs.readFileSync(path.join(__dirname, "templates", template), "utf8")));
  console.log(`  created  ${out}`);
}
if (kit && !kit.answers[layer.id]) {
  kit.answers[layer.id] = { q1: null, q2: null, q3: null };
  fs.writeFileSync(kit.answersFile, JSON.stringify(kit.answers, null, 0));
  console.log(`  added    layer ${layer.id} to ${kit.answersFile} (fill in the three answers)`);
}
console.log(`
Next:
  1. Write the chapter, starter code, tests and mystery. Replace every TODO(author).${kit ? "\n     Write the solution in the kit, and the three answers in answers.json." : ""}
  2. Set ready: true for layer ${layer.id} in lib/course.js.
  3. node tools/checkpoint-data.js --kit <kit>   (fingerprints for the checkpoint)
  4. node tools/check-layer.js ${layer.id} --kit <kit>   (until it's all ✓)
  5. node tools/build.js, then commit.
See AUTHORING.md for the details.`);
