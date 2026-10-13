#!/usr/bin/env node
// tools/link-prompts.js — makes every chapter's "Study buddy prompts" clickable.
// For maintainers. Rewrites each bullet in that section so it ends with
// "Ask Claude" and "Ask ChatGPT" links carrying the prompt plus the tutor
// rules. Safe to run repeatedly:  node tools/link-prompts.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, "lib/course.js"), "utf8"), ctx);
const C = ctx.MS.COURSE;

let changed = 0;
for (const l of C.layers.filter(l => l.ready)) {
  const file = path.join(root, C.files(l).doc);
  const md = fs.readFileSync(file, "utf8");
  const start = md.indexOf("## Study buddy prompts");
  if (start < 0) continue;
  const end = md.indexOf("\n## ", start + 5);
  const section = md.slice(start, end < 0 ? undefined : end);
  const linked = section.replace(/^- "(.+?)"(?: \[Ask Claude\]\([^)]*\) · \[Ask ChatGPT\]\([^)]*\))?$/gm, (_, prompt) => {
    const ask = prompt.replace(/^I'm on layer \d+ of Motion from Scratch\.\s*/, "");
    return `- "${prompt}" [Ask Claude](${C.claudeLink(l, ask)}) · [Ask ChatGPT](${C.chatgptLink(l, ask)})`;
  });
  if (linked !== section) {
    fs.writeFileSync(file, md.slice(0, start) + linked + (end < 0 ? "" : md.slice(end)));
    changed++;
  }
  console.log(`${C.files(l).doc}: ${(linked.match(/\[Ask Claude\]/g) || []).length} prompts linked`);
}
console.log(changed ? `${changed} file(s) updated` : "already up to date");
