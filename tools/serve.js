#!/usr/bin/env node
// tools/serve.js — serves the course folder at http://localhost:8000 with no
// installs. Handy in Codespaces, and for pages that can't run from file://
// (like showcase.html).   node tools/serve.js   (or PORT=3000 node tools/serve.js)
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const port = Number(process.env.PORT) || 8000;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".md": "text/markdown", ".png": "image/png", ".svg": "image/svg+xml", ".ipynb": "application/json", ".txt": "text/plain" };

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { res.writeHead(400).end(); return; }
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(root, rel);
  if (!file.startsWith(root + path.sep) || rel.split("/").some(part => part.startsWith("."))) { res.writeHead(404).end("Not found"); return; }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": (types[path.extname(file)] || "application/octet-stream") + "; charset=utf-8", "Cache-Control": "no-store" });
    res.end(body);
  });
}).listen(port, () => console.log(`Course pages: http://localhost:${port}/  (Ctrl+C to stop)`));
