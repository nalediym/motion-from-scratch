#!/usr/bin/env node
// tools/check-layer.js — checks that a layer is complete and consistent. For maintainers.
//
//   node tools/check-layer.js 03 --kit path/to/kit    one layer
//   node tools/check-layer.js --all --kit path/to/kit every ready layer
//
// Without --kit it checks what's in the repo: the chapter's shape, starter
// code that gives nothing away, and tests that all say "not written yet".
// With the private kit it also runs the solution: every test passes, every
// Predict and Break it block runs (and prints the values to compare with the
// chapter's Answers), and the mystery and answers match their fingerprints.
const fs = require("fs");
const path = require("path");
const { root, sandbox, readKit, arg } = require("./course-vm");

let failures = 0, warnings = 0;
const ok = msg => console.log("  ✓ " + msg);
const bad = msg => { failures++; console.log("  ✗ " + msg); };
const warn = msg => { warnings++; console.log("  ! " + msg); };
const info = msg => console.log("    " + msg);
const readRepo = rel => fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), "utf8") : null;

function checkLayer(MS, layer, kit) {
  console.log(`\nLayer ${layer.id} · ${layer.title}${layer.ready ? "" : "  (not marked ready in lib/course.js)"}`);
  const f = MS.COURSE.files(layer);
  const doc = readRepo(f.doc), src = readRepo(f.src), test = readRepo(f.test), mystery = readRepo(f.mystery);
  const parts = [["chapter", f.doc, doc], ["starter code", f.src, src], ["tests", f.test, test], ["mystery", f.mystery, mystery]];
  parts.forEach(([name, file, text]) => { if (text === null) bad(`missing ${name} (${file})`); });
  if (parts.some(p => p[2] === null)) return;

  // 1. Nothing left to fill in
  const left = parts.flatMap(([, file, text]) => text.split("\n").map((l, i) => [file, i + 1, l]).filter(x => x[2].includes("TODO(author)")));
  left.length ? bad(`${left.length} TODO(author) left, first at ${left[0][0]}:${left[0][1]}`) : ok("no TODO(author) left");

  // 2. Starter code: every function only throws MS.todo with its own name
  const fns = [...src.matchAll(/function (\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n  \}/g)].map(m => ({ name: m[1], body: m[3].trim() }));
  const leaky = fns.filter(fn => fn.body !== `throw MS.todo("${fn.name}");`);
  leaky.length ? bad(`starter code: ${leaky.map(x => x.name).join(", ")} should contain only throw MS.todo("<name>")`) : ok(`starter code: ${fns.length} function(s), each only throws MS.todo`);
  const exported = ((/Object\.assign\(MS, \{([^}]*)\}\)/.exec(src) || [, ""])[1]).split(",").map(s => s.trim().split(":")[0].trim()).filter(Boolean);
  const unexported = fns.filter(fn => !exported.includes(fn.name)).map(x => x.name);
  unexported.length ? bad(`starter code: not exported: ${unexported.join(", ")}`) : ok("starter code: every function is exported");
  src.includes(`docs/${layer.id}-${layer.slug}.md`) ? ok("starter code points at its chapter") : warn(`starter code's header should mention docs/${layer.id}-${layer.slug}.md`);

  // 3. The chapter's shape
  const title = `# Layer ${layer.id} · ${layer.title}`;
  doc.startsWith(title + "\n") ? ok("title matches lib/course.js") : bad(`first line should be "${title}"`);
  /^_[^_\n]+_$/m.test(doc) ? ok("one-line lede") : bad("no one-line lede (_like this_)");
  const listed = [...((/^\*\*You'll write:\*\*(.*)$/m.exec(doc) || [, ""])[1]).matchAll(/`([A-Za-z_]\w*)`/g)].map(x => x[1]);
  const notListed = fns.map(x => x.name).filter(n => !listed.includes(n)), notInCode = listed.filter(n => !fns.some(x => x.name === n));
  (notListed.length || notInCode.length)
    ? bad(`"You'll write" doesn't match the starter code${notListed.length ? `; add ${notListed.join(", ")}` : ""}${notInCode.length ? `; not in the code: ${notInCode.join(", ")}` : ""}`)
    : ok(`"You'll write" lists all ${listed.length} function(s)`);
  /^\*\*Check it:\*\*/m.test(doc) ? ok("Check it line") : bad("no **Check it:** line");
  if (layer.id !== "00") /^\*\*Builds on:\*\*/m.test(doc) ? ok("Builds on line") : bad("no **Builds on:** line");
  const want = ["Under the hood", "Your turn", "Predict, then run", "Break it", "Checkpoint", "In the real world", "Going further (optional)"];
  const h2 = [...doc.matchAll(/^## (.+)$/gm)].map(x => x[1].trim());
  JSON.stringify(h2) === JSON.stringify(want) ? ok("sections in the standard order") : bad(`sections should be: ${want.join(" / ")}; found: ${h2.join(" / ")}`);
  const callouts = (doc.match(/^> \*\*Study buddy:\*\* "/gm) || []).length;
  callouts ? ok(`${callouts} study-buddy callout(s)`) : bad("no study-buddy callout");
  if (callouts && !/^> \*\*Study buddy:\*\* ".*" \[Ask Claude\]/m.test(doc)) warn("callouts aren't linked yet: run node tools/build.js");
  const blocks = kind => [...doc.matchAll(new RegExp("```js " + kind + "\\n([\\s\\S]*?)```", "g"))].map(x => x[1]);
  const predicts = blocks("predict"), experiments = blocks("experiment"), cps = blocks("checkpoint");
  predicts.length === 3 ? ok("3 Predict blocks") : bad(`${predicts.length} Predict block(s), want 3`);
  predicts.forEach((b, i) => { if (!/const myGuess = null;/.test(b) || !/MS\.reveal\(/.test(b)) bad(`Predict ${i + 1} needs "const myGuess = null;" and MS.reveal(...)`); });
  /<details><summary>Answers<\/summary>/.test(doc) ? ok("Answers block") : bad("no <details><summary>Answers</summary> after the Predict blocks");
  experiments.length === 3 ? ok("3 Break it experiments") : bad(`${experiments.length} Break it experiment(s), want 3`);
  experiments.forEach((b, i) => { if (!/TODO\(break-it\), in src\//.test(b)) bad(`Break it ${i + 1} needs a "// TODO(break-it), in src/... → fn:" line`); });
  if (cps.length !== 1) bad(`${cps.length} checkpoint block(s), want 1`);
  else {
    new RegExp(`MS\\.answers\\("${layer.id}"`).test(cps[0]) ? ok("checkpoint block") : bad(`the checkpoint block must call MS.answers("${layer.id}", ...)`);
    ["q1", "q2", "q3"].forEach(q => { if (!new RegExp(`\\b${q}: null,`).test(cps[0])) bad(`the checkpoint block needs "${q}: null,"`); });
  }

  // 4. Tests with the starter code: all "not written yet", none crashing
  const sb = sandbox();
  for (const l of MS.COURSE.layers.filter(l => l.id <= layer.id)) { const s = MS.COURSE.files(l).src; if (readRepo(s) !== null) sb.load(s); }
  sb.load(f.test);
  const stubRun = sb.MS.runTests(layer.id), n = stubRun.length;
  n ? ok(`${n} tests`) : bad("no tests");
  const notTodo = stubRun.filter(r => r.status !== "todo");
  notTodo.length ? bad(`with the starter code these should say "not written yet": ${notTodo.map(r => `"${r.name}" (${r.status}: ${r.message})`).join("; ")}`) : ok(`with the starter code every test says "not written yet"`);
  const pics = sb.MS.visuals.filter(v => v.layer === layer.id).length;
  pics ? ok(`${pics} picture(s)`) : warn("no pictures (MS.visual or MS.animation)");
  const phrase = layer.id === "00" ? `All ${n} tests pass` : `When all ${n} tests pass`;
  doc.includes(phrase) ? ok(`checkpoint section says "${phrase}"`) : bad(`the checkpoint section should say "${phrase}"`);
  if (layer.ready) {
    const guide = readRepo("guide.html") || "";
    guide.includes(`id="layer-${layer.id}"`) ? ok("in guide.html") : warn("not in guide.html yet: run node tools/build.js");
  }

  // 5. With the kit: the solution passes, blocks run, fingerprints match
  if (!kit) { warn("no --kit: skipped the solution checks"); return; }
  const k = sandbox();
  for (const l of MS.COURSE.layers.filter(l => l.id <= layer.id)) {
    const file = kit.solution(`${l.id}-${l.slug}`);
    if (!fs.existsSync(file)) { bad(`the kit has no solution for layer ${l.id} (${file})`); return; }
    k.load(file);
  }
  k.load(f.test);
  const failing = k.MS.runTests(layer.id).filter(r => r.status !== "pass");
  failing.length ? bad(`the solution fails: ${failing.map(r => `"${r.name}": ${r.message}`).join("; ")}`) : ok(`the solution passes all ${n} tests`);
  for (const v of k.MS.visuals.filter(v => v.layer === layer.id)) {
    try {
      if (k.MS.moves(v)) { const c = v.fn(); k.MS.renderFrame(c, 0); k.MS.renderFrame(c, c.durationInFrames - 1); } else v.fn();
    } catch (e) { bad(`picture "${v.name}" throws: ${e.message}`); }
  }
  info("Predict values with the solution (check them against the chapter's Answers):");
  predicts.forEach((b, i) => {
    let actual = "(MS.reveal was never called)";
    const real = k.MS.reveal;
    k.MS.reveal = (label, guess, value) => { actual = `${label} → ${k.MS.formatValue(value)}`; };
    const out = k.MS.runExperiment(b);
    k.MS.reveal = real;
    const err = out.split("\n").find(l => /^(Error|⏳)/.test(l));
    if (err) bad(`Predict ${i + 1}: ${err}`);
    info(`  ${i + 1}. ${actual}`);
  });
  experiments.forEach((b, i) => {
    const err = k.MS.runExperiment(b).split("\n").find(l => /^(Error|⏳)/.test(l));
    if (err) bad(`Break it ${i + 1}: ${err}`);
  });
  ok("Predict and Break it blocks run with the solution");
  const data = (k.MS.CHECKPOINT_DATA || {})[layer.id], mys = k.MS.CHECKPOINT_MYSTERIES[layer.id];
  if (!mys) { bad("no mystery registered (lib/mysteries)"); return; }
  if (!data) { bad("no fingerprints yet: run node tools/checkpoint-data.js --kit <kit>"); return; }
  try {
    const drawn = mys.draw(), res = mys.check(drawn, data);
    res.wrong === 0 && k.MS.hashFrame(drawn.frame) === data.mystery ? ok("the mystery picture matches its fingerprint") : bad("the solution's mystery picture doesn't match: rerun tools/checkpoint-data.js");
  } catch (e) { bad(`the mystery throws with the solution: ${e.message}`); }
  const answers = kit.answers[layer.id];
  if (!answers) { bad(`answers.json has no answers for layer ${layer.id}`); return; }
  const qs = Object.keys(data.questions);
  const right = qs.filter(q => answers[q] !== null && answers[q] !== undefined && k.MS.hashAnswer(layer.id, q, answers[q]) === data.questions[q]);
  right.length === 3 && qs.length === 3 ? ok("the answers match their fingerprints") : bad("answers.json and the fingerprints disagree: rerun tools/checkpoint-data.js");
  // An answer printed in the chapter is a spoiler. Small numbers are everywhere, so only flag distinctive ones.
  const prose = doc.replace(/\([^)\s]*https?:[^)]*\)/g, "");
  for (const [q, v] of Object.entries(answers)) {
    const s = JSON.stringify(v);
    const distinctive = typeof v === "number" ? (Math.abs(v) >= 100 || !Number.isInteger(v)) : true;
    const found = typeof v === "number" ? new RegExp(`(^|[^\\d.])${s.replace(/\./g, "\\.")}(?![\\d])`).test(prose) : prose.includes(s) || prose.includes(s.replace(/,/g, ", "));
    if (distinctive && found) warn(`the answer to ${q} (${s}) appears in the chapter; make sure it isn't a spoiler`);
  }
}

const { MS } = sandbox();
const kit = readKit(arg("--kit"));
const ids = process.argv.includes("--all") ? MS.COURSE.layers.filter(l => l.ready).map(l => l.id) : [String(process.argv[2] || "").padStart(2, "0")];
const layers = ids.map(id => MS.COURSE.layers.find(l => l.id === id));
if (!layers.length || layers.some(l => !l)) { console.log("Usage: node tools/check-layer.js <id>|--all [--kit <folder>]"); process.exit(1); }
for (const l of layers) checkLayer(MS, l, kit);
console.log(`\n${failures ? `✗ ${failures} problem(s)` : "✓ all good"}${warnings ? `, ${warnings} warning(s)` : ""}`);
process.exit(failures ? 1 : 0);
