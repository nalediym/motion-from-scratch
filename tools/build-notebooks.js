#!/usr/bin/env node
// tools/build-notebooks.js — generates the three notebooks from docs/, src/
// stubs and tests/, so they never drift from the repo. For maintainers:
//   node tools/build-notebooks.js
//
//   notebooks/colab.ipynb          Google Colab (Python kernel; runs Node for tests)
//   notebooks/jupyter-deno.ipynb   Jupyter / VS Code with the Deno kernel
//   notebooks/observable.html      Observable Notebook Kit (notebooks 2.0)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const ctx = vm.createContext({});
vm.runInContext(read("lib/course.js"), ctx);
const C = ctx.MS.COURSE;
const ready = C.layers.filter(l => l.ready);
fs.mkdirSync(path.join(root, "notebooks"), { recursive: true });

// chapter text, adjusted for notebooks: headings shift down one level, and
// links to repo files point at GitHub.
function chapter(l) {
  let md = read(C.files(l).doc);
  md = md.replace(/^(#{1,3}) /gm, (_, h) => "#" + h + " ");
  md = md.replace(/\]\((?!https?:)([^)]+)\)/g, (_, u) => `](${C.repo}/blob/main/docs/${u})`);
  return md;
}
const buddyLinks = l => `**Stuck?** Ask a study buddy that gives hints, not answers: [open Claude](${C.claudeLink(l)}) · [open ChatGPT](${C.chatgptLink(l)})`;
// Split a chapter into Markdown pieces and runnable blocks (```js predict / ```js experiment).
function segments(l) {
  const md = chapter(l);
  const out = [];
  const re = /```js (predict|experiment)\n([\s\S]*?)```\n?/g;
  const n = { predict: 0, break: 0 };
  let last = 0, m;
  while ((m = re.exec(md))) {
    out.push({ md: md.slice(last, m.index) });
    const kind = m[1] === "predict" ? "predict" : "break";
    const code = m[2].replace(/\n$/, "");
    const title = (code.split("\n").find(x => x.startsWith("// ")) || "").replace(/^\/\/\s*/, "");
    out.push({ kind, n: ++n[kind], code, title });
    last = re.lastIndex;
  }
  out.push({ md: md.slice(last) });
  return out.filter(s => !("md" in s) || s.md.trim());
}
// Put the learner's code cells right before "Predict, then run", so running
// the notebook top to bottom builds the code before the experiments use it.
function withCodeCells(l, pushMd, pushBlock, pushCode) {
  let inserted = false;
  for (const s of segments(l)) {
    if ("md" in s && !inserted && s.md.includes("### Predict, then run")) {
      const at = s.md.indexOf("### Predict, then run");
      if (s.md.slice(0, at).trim()) pushMd(s.md.slice(0, at));
      pushCode();
      inserted = true;
      pushMd(s.md.slice(at));
    } else if ("md" in s) pushMd(s.md);
    else pushBlock(s);
  }
  if (!inserted) pushCode();
}
const blockIntro = (l, s) => `**${s.kind === "predict" ? `Predict ${s.n}` : `Break it ${s.n}`}** · ${s.kind === "predict" ? "replace `null` with your guess, then run the cell." : "run it, make the TODO change in your code, then run it again."} Stuck? [Ask Claude](${C.claudeLink(l, C.blockAsk(s.kind, s.title))}) · [Ask ChatGPT](${C.chatgptLink(l, C.blockAsk(s.kind, s.title))})`;
const lines = s => s.split("\n").map((x, i, a) => (i < a.length - 1 ? x + "\n" : x)).filter((x, i, a) => !(i === a.length - 1 && x === ""));
const md = text => ({ cell_type: "markdown", metadata: {}, source: lines(text) });
const code = (text, extra = {}) => ({ cell_type: "code", metadata: extra, execution_count: null, outputs: [], source: lines(text) });
const writeNb = (file, cells, metadata) => {
  cells = cells.map((c, i) => ({ id: `mfs-${String(i).padStart(3, "0")}`, ...c }));
  fs.writeFileSync(path.join(root, file), JSON.stringify({ cells, metadata, nbformat: 4, nbformat_minor: 5 }, null, 1) + "\n");
  console.log(`${file}: ${cells.length} cells`);
};

// ---------------------------------------------------------------- Colab
{
  const cells = [
    md(`# ${C.title}\n\n_${C.subtitle}._ Build a video engine from a single pixel up to a rebuilt motion-graphics intro, one layer at a time.\n\n## How to use this notebook\n\n1. **Save your own copy first:** File → Save a copy in Drive. Your code lives in this notebook, so the copy is how you keep your progress.\n2. **Run the setup cell** below once per session. It downloads the course and checks that Node is available (Colab includes it).\n3. **For each layer:** read the chapter, write your code in the cell that starts with \`%%writefile\`, run it, then run the test cell and the pictures cell.\n4. **New session?** Run setup again, then re-run your \`%%writefile\` cells (Runtime → Run before) so your earlier layers are back on disk.\n\nThe course map, interactive guide and repo: [${C.site}](${C.site}) · [${C.repo}](${C.repo})\n\n${buddyLinks(null)}`),
    code(`#@title Setup: run once per session\nimport os, subprocess, glob\nif not os.path.exists("motion-from-scratch") and not os.getcwd().endswith("motion-from-scratch"):\n    subprocess.run(["git", "clone", "-q", "${C.repo}"], check=True)\nif not os.getcwd().endswith("motion-from-scratch"):\n    os.chdir("motion-from-scratch")\nnode = subprocess.run(["node", "--version"], capture_output=True, text=True)\nif node.returncode != 0:\n    print("Installing Node...")\n    subprocess.run("apt-get -qq update && apt-get -qq install -y nodejs > /dev/null", shell=True)\n    node = subprocess.run(["node", "--version"], capture_output=True, text=True)\nprint("Course ready. Node", node.stdout.strip())\n\nfrom IPython.display import Image, display\ndef run_js(code):
    """Run a Predict / Break it block against your code in src/."""
    open("scratch.js", "w").write(code)
    out = subprocess.run(["node", "tools/try.js", "--file", "scratch.js"], capture_output=True, text=True)
    print(out.stdout or out.stderr)

def pictures(layer):\n    """Render a layer's test pictures with your code and show them."""\n    out = subprocess.run(["node", "tools/pictures.js", layer], capture_output=True, text=True)\n    print(out.stdout or out.stderr)\n    for p in sorted(glob.glob(f"out/{layer}-*.png")):\n        display(Image(p))`),
  ];
  for (const l of ready) {
    const f = C.files(l);
    withCodeCells(l,
      text => cells.push(md(text)),
      s => { cells.push(md(blockIntro(l, s))); cells.push(code(`run_js(r"""\n${s.code}\n""")`)); },
      () => {
        cells.push(md(`### ✏️ Your code for layer ${l.id}\n\nEdit the cell below, then run it. The first line saves it as \`${f.src}\`. Then run the tests and pictures under it.\n\n${buddyLinks(l)}`));
        cells.push(code(`%%writefile ${f.src}\n${read(f.src)}`));
        cells.push(code(`# Tests for layer ${l.id}: run after saving your code above\n!node tests/run.js ${l.id}`));
        cells.push(code(`# Pictures drawn by your code\npictures("${l.id}")`));
      });
  }
  cells.push(md(`## What's next\n\nLayers 03–10 are on the way: time, interpolation, easing, springs, the hand-off to canvas, scenes, the KineticIntro rebuild, and MP4 export. Watch [the repo](${C.repo}) for updates.`));
  writeNb("notebooks/colab.ipynb", cells, {
    colab: { provenance: [], toc_visible: true },
    kernelspec: { name: "python3", display_name: "Python 3" },
    language_info: { name: "python" },
  });
}

// ---------------------------------------------------------------- Jupyter + Deno
{
  const cells = [
    md(`# ${C.title}\n\n_${C.subtitle}._ This notebook runs JavaScript directly, with the **Deno** kernel.\n\n## Set up once\n\n1. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/), then register its Jupyter kernel: \`deno jupyter --install\`\n2. Get the course: \`git clone ${C.repo}\`\n3. Open \`notebooks/jupyter-deno.ipynb\` in VS Code (with the Jupyter extension) or JupyterLab, and pick the **Deno** kernel.\n\n## How to use it\n\nRun the setup cell. Then for each layer: read the chapter, write your code in the code cell, run it, and run the check cell under it. Your code lives in this notebook; save it as you go.\n\n${buddyLinks(null)}`),
    code(`// Setup: loads the course helpers. Run once per session.\nconst base = Deno.cwd().endsWith("notebooks") ? ".." : ".";\nfor (const f of ["lib/course.js", "lib/font5x7.js", "lib/check.js", "lib/png.js", "lib/notebook.js", "lib/experiment.js"]) {\n  (0, eval)(await Deno.readTextFile(\`\${base}/\${f}\`));\n}\nasync function check(layerId) {\n  const layer = MS.COURSE.layers.find(l => l.id === layerId);\n  MS.loadTests(layerId, await Deno.readTextFile(\`\${base}/\${MS.COURSE.files(layer).test}\`));\n  const r = MS.runLayerReport(layerId);\n  return Deno.jupyter.display({ "text/html": r.html, "text/plain": \`\${r.passed} / \${r.total} passing\` }, { raw: true });\n}\n"Course helpers loaded"`),
  ];
  for (const l of ready) {
    withCodeCells(l,
      text => cells.push(md(text)),
      s => { cells.push(md(blockIntro(l, s))); cells.push(code(`{ // the braces let you re-run this cell\n${s.code}\n}`)); },
      () => {
        cells.push(md(`### ✏️ Your code for layer ${l.id}\n\nThis cell is your \`${C.files(l).src}\`. Write the functions, run the cell, then run the check below it.\n\n${buddyLinks(l)}`));
        cells.push(code(read(C.files(l).src)));
        cells.push(code(`await check("${l.id}")`));
      });
  }
  writeNb("notebooks/jupyter-deno.ipynb", cells, {
    kernelspec: { name: "deno", display_name: "Deno", language: "typescript" },
    language_info: { name: "typescript", file_extension: ".ts", mimetype: "text/x.typescript", pygments_lexer: "typescript", codemirror_mode: "typescript", nb_converter: "script", version: "5.x" },
  });
}

// ---------------------------------------------------------------- Observable Notebook Kit
{
  const indent = s => s.replace(/<\/script/gi, "<\\/script").split("\n").map(x => (x ? "    " + x : x)).join("\n");
  const cell = (type, body, attrs = "") => `  <script type="${type}"${attrs}>\n${indent(body)}\n  </script>`;
  const libs = ["lib/course.js", "lib/font5x7.js", "lib/check.js", "lib/png.js", "lib/notebook.js", "lib/experiment.js"].map(read).join("\n");
  const parts = [
    cell("text/markdown", `# ${C.title}\n\n_${C.subtitle}._ Build a video engine from a single pixel up, one layer at a time.\n\n**On the web this notebook is read-and-run:** you can read every chapter and see the tests run on the starter code. To write your own code, use one of these:\n\n- **Edit locally with live reload:** download [observable.html](${C.repo}/blob/main/notebooks/observable.html), then run \`npx -p @observablehq/notebook-kit notebooks preview --root .\` in its folder and edit the file in any text editor.\n- **Observable Desktop** (macOS): open the same file and edit cells directly.\n- **No install at all:** use [the interactive guide](${C.site}guide.html) or [the Colab notebook](${C.colab}).\n\n${buddyLinks(null)}`),
    cell("module", `${libs}\nconst base = globalThis.MS;\nconst MS = globalThis.MS;`, " hidden"),
  ];
  let prev = "base";
  for (const l of ready) {
    const name = `layer${l.id}`;
    const tests = read(C.files(l).test);
    withCodeCells(l,
      text => parts.push(cell("text/markdown", text)),
      s => {
        parts.push(cell("text/markdown", blockIntro(l, s)));
        const body = s.code.split("\n").map(x => "    " + x).join("\n");
        parts.push(cell("module", `${name}; // uses your code above\n{\n  const out = document.createElement("pre");\n  out.textContent = MS.runExperimentFn(() => {\n${body}\n  });\n  display(out);\n}`));
      },
      () => {
        parts.push(cell("text/markdown", `### ✏️ Your code for layer ${l.id}\n\nThis cell is your \`${C.files(l).src}\`. When editing locally, change it and everything below re-runs by itself.\n\n${buddyLinks(l)}`));
        parts.push(cell("module", `${prev}; // run after the layer before\n${read(C.files(l).src)}\nconst ${name} = true;`, " pinned"));
        parts.push(cell("module", `${name};\nconst report${l.id} = (() => {\n  const MS = globalThis.MS;\n  MS.tests = MS.tests.filter(t => t.layer !== "${l.id}");\n  MS.visuals = MS.visuals.filter(v => v.layer !== "${l.id}");\n${tests}\n  return MS.runLayerReport("${l.id}");\n})();\nconst el${l.id} = document.createElement("div");\nel${l.id}.innerHTML = report${l.id}.html;\ndisplay(el${l.id});`));
      });
    prev = name;
  }
  const html = `<!doctype html>\n<notebook theme="light-dark(cotton, slate)">\n  <title>${C.title}</title>\n${parts.join("\n")}\n</notebook>\n`;
  fs.writeFileSync(path.join(root, "notebooks/observable.html"), html);
  console.log(`notebooks/observable.html: ${parts.length} cells`);
}
