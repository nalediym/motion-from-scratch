#!/usr/bin/env node
// tools/build.js — regenerates everything made from docs/: study-buddy links,
// checkpoint answer files, guide.html and the notebooks. For maintainers.
//   node tools/build.js
const { execFileSync } = require("child_process");
const path = require("path");
for (const step of ["link-prompts", "build-checkpoints", "build-guide", "build-notebooks"]) {
  execFileSync(process.execPath, [path.join(__dirname, step + ".js")], { stdio: "inherit" });
}
