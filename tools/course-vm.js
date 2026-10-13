// tools/course-vm.js — loads the course into a Node sandbox. Used by the
// maintainer tools (checkpoint-data.js, check-layer.js).
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");

// A fresh sandbox with the provided libraries (and every ready layer's
// mystery) loaded. `load(file)` runs another file in it.
function sandbox() {
  const context = vm.createContext({ console, Buffer });
  const load = file => vm.runInContext(fs.readFileSync(path.isAbsolute(file) ? file : path.join(root, file), "utf8"), context, { filename: file });
  load("lib/course.js");
  const MS = context.MS;
  [...MS.COURSE.libs, "lib/png.js"].forEach(load);
  for (const l of MS.COURSE.layers) if (fs.existsSync(path.join(root, MS.COURSE.files(l).mystery))) load(MS.COURSE.files(l).mystery);
  return { context, load, MS };
}

// The private kit: a folder with solutions/NN-name.js (one per layer) and
// answers.json. It never goes in the repo.
function readKit(dir) {
  if (!dir) return null;
  const abs = path.resolve(dir);
  const answersFile = path.join(abs, "answers.json");
  return {
    dir: abs,
    solution: base => path.join(abs, "solutions", base + ".js"),
    answers: fs.existsSync(answersFile) ? JSON.parse(fs.readFileSync(answersFile, "utf8")) : {},
    answersFile,
  };
}

const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };

module.exports = { root, sandbox, readKit, arg };
