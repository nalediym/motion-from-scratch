# Writing a layer

For maintainers adding or revising a layer. Learners don't need this file.

## The private kit

Solutions and checkpoint answers never go in this repo. Keep them in a folder outside it:

```text
kit/
  solutions/00-pixels.js   a working solution per layer, written like src/ code
  solutions/01-shapes.js
  ...
  answers.json             { "00": { "q1": 172, ... }, "01": { ... } }
```

Every tool that needs it takes `--kit path/to/kit`. The repo only ever holds fingerprints of the answers (`lib/checkpoint-data.js`).

## What a layer is

| File | What it holds |
|---|---|
| `lib/course.js` | The layer's entry: id, slug, title, one-line summary, `ready` |
| `docs/NN-name.md` | The chapter. Single source for the guide, notebooks and checkpoint files |
| `src/NN-name.js` | Starter code: a spec comment and `throw MS.todo("name")` per function |
| `tests/NN-name.test.js` | Tests, plus pictures (`MS.visual`) and moving pictures (`MS.animation`) |
| `lib/mysteries/NN-name.js` | The checkpoint's mystery picture |
| `kit/solutions/NN-name.js` | The private solution |

## Workflow

```bash
node tools/new-layer.js 03 --kit ../kit        # files from tools/templates/
# write the solution, tests and starter code; then the chapter, mystery and questions
# set ready: true in lib/course.js
node tools/checkpoint-data.js --kit ../kit     # fingerprints
node tools/check-layer.js 03 --kit ../kit      # repeat until ✓ all good
node tools/build.js                            # guide, notebooks, checkpoint files, study-buddy links
```

Write the solution and tests first: they pin down exactly what the starter code's comments must say. `check-layer` prints every Predict block's value with the solution, so you can check the Answers against the machine.

## The chapter

Sections, in this order (the checker enforces it): Under the hood, Your turn, Predict, then run, Break it, Checkpoint, In the real world, Going further (optional).

- **Voice.** Warm, plain and short. Explain what happens underneath: bytes, rounding, the math, what the browser does. One idea per subsection, with an ASCII diagram where a picture helps.
- **Never the answer.** "Your turn" asks questions that lead to an idea, never steps that translate into code. Examples use numbers different from the tests and the checkpoint.
- **Link the originals.** The first mention of anything a standard or paper defines links to it (ECMAScript, the HTML or CSS spec, the original paper).
- **Study buddy callouts.** `> **Study buddy:** "..."` where a tutor would help most. They become links when you build. A callout can't attach code, so don't write "here's my code".
- **Predict.** Three blocks, each `const myGuess = null;` plus `MS.reveal(label, myGuess, actual)`. Pick results that surprise; explain them in the Answers.
- **Break it.** Three experiments. Each starts with its title comment, then `// TODO(break-it), in src/NN-name.js → fn:` and the one change to make.
- **Checkpoint.** Layer 00 explains checkpoints in full; later layers say "When all N tests pass, the checkpoint unlocks (layer 00 explains how it works). Its traps: …". Three questions the chapter prepares for but never answers.
- **Terminal-only lines** (`**Check it:**`, "In a terminal, `node tools/try.js NN` lists the blocks.") are dropped from the guide and notebooks automatically.

## Starter code and tests

- A spec comment says exactly what comes back, edge cases included. It describes *what*, never *how*.
- Every function body is only `throw MS.todo("name")`, and every function is exported with `Object.assign(MS, { … })`.
- One idea per test, named so a failing test teaches. With the starter code every test must say "not written yet" (so never call learner functions at load time).
- Pictures: `MS.visual(L, name, () => frame)`; something that moves: `MS.animation(L, name, () => composition)`. Pages play animations with the learner's own `frameAt`; notebooks show a filmstrip.

## The mystery

`draw()` runs the learner's functions on scrambled commands full of the chapter's traps and returns `{ frame }`; `check(drawn, data)` returns one hint per trap that fired, naming the rule and never the fix. A hidden word that only appears when every rule is right works well. Keep it deterministic (use the seeded `shuffle`). Anything else `check()` needs goes in `record`, which `checkpoint-data.js` stores.

## Provided libraries

`MS.COURSE.libs` in `lib/course.js` lists the libraries every surface loads (terminal, guide, notebooks, pages, showcase); `MS.COURSE.browserLibs` adds browser-only ones. To add one, add it to the list and run `node tools/build.js`.

## Before it ships

1. `node tools/check-layer.js --all --kit ../kit` is all ✓.
2. Review with fresh eyes, each lens separately: the writing (redundancy, spoilers, voice), the pages at desktop and phone width, light and dark, and a first-time learner's walk through the layer.
3. `node tests/run.js` on the starter code says "not written yet" everywhere and exits non-zero.
4. Commit. CI checks the generated files are up to date, then publishes the site.
