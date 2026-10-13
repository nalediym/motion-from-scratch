// tools/chapter-text.js — a chapter's Markdown for the guide and notebooks.
// They have their own Run buttons and test cells, so the lines that only
// make sense in a terminal are dropped. Used by build-guide.js and
// build-notebooks.js.
module.exports = md => md
  .replace(/^\*\*Check it:\*\*.*\n/m, "")
  .replace(/ In a terminal, `node tools\/try\.js \d\d` lists the blocks\./g, "");
