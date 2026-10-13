#!/usr/bin/env node
// tools/link-prompts.js — makes every study-buddy callout in the chapters clickable.
// For maintainers. Write a callout as a line  > **Study buddy:** "prompt"
// where it belongs in a chapter; this rewrites it so it ends with
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
  const linked = md.replace(/^> \*\*Study buddy:\*\* "(.+?)"(?: \[Ask Claude\]\([^)]*\) · \[Ask ChatGPT\]\([^)]*\))?$/gm,
    (_, prompt) => `> **Study buddy:** "${prompt}" [Ask Claude](${C.claudeLink(l, prompt)}) · [Ask ChatGPT](${C.chatgptLink(l, prompt)})`);
  if (linked !== md) { fs.writeFileSync(file, linked); changed++; }
  console.log(`${C.files(l).doc}: ${(linked.match(/\[Ask Claude\]/g) || []).length} prompts linked`);
}
console.log(changed ? `${changed} file(s) updated` : "already up to date");
