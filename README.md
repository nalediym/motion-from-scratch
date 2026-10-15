# Motion from Scratch

**How to go from pixels to motion.** Build a video engine yourself, starting from a single pixel, adding one idea per layer, until you've rebuilt a real motion-graphics intro and exported it as an MP4.

No libraries. No install. Just a browser, a text editor, and (if you like) an AI study buddy that asks questions instead of handing you answers.

```text
  10  Export          frames → MP4, then map it all to Remotion
  09  KineticIntro    the recreation
  08  Scenes          real fonts, sequences, a camera, layers, masks
  07  Transforms      matrices, resampling and blur, by hand
  06  Springs         physics stepping and stability
  05  Easing          a cubic-Bézier solver
  04  Interpolate     lerp, clamp, ranges, extrapolation
  03  Time            frame = f(n), a player that keeps time
  02  Glyphs          text from a hand-made bitmap font
  01  Shapes          rectangles, circles, alpha, gradients
  00  Pixels          a framebuffer: memory you can see
      ▲ each layer is built only from the layers below it
```

The final project is a from-scratch rebuild of `KineticIntro` from [Claude Motion Studio](https://github.com/MoussaabBadla/claude-motion-studio): three words punching through the screen, then a logo lockup with a light sweep.

## How to get started

Pick one way to work. Every option has the same chapters, starter code and tests.

| Way | Good for | Start |
|---|---|---|
| **Interactive guide** | Fastest; nothing to install. Code saves in your browser | [Open the guide](https://nalediym.github.io/motion-from-scratch/guide.html) |
| **GitHub Codespaces** | A cloud VS Code with a terminal, Node and Claude Code set up; your work lives in git | [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/nalediym/motion-from-scratch?quickstart=1) |
| **Google Colab** | A notebook in your Google Drive | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nalediym/motion-from-scratch/blob/main/notebooks/colab.ipynb) |
| **Your own editor** | Working with Claude Code or Codex as a study buddy | `git clone https://github.com/nalediym/motion-from-scratch` |
| **Jupyter / VS Code** | A local JavaScript notebook (Deno kernel) | [`notebooks/jupyter-deno.ipynb`](notebooks/jupyter-deno.ipynb) |
| **Observable** | Read and run online; edit locally | [Observable view](https://nalediym.github.io/motion-from-scratch/observable/observable.html) · [`notebooks/observable.html`](notebooks/observable.html) |

**Working in your own editor:**

1. Open `index.html` in your browser. It's the course map, and it shows your progress.
2. Read `docs/00-pixels.md`, then fill in `src/00-pixels.js`.
3. Check your work: open `tests.html`, or run `node tests/run.js` in a terminal.

You don't need Node to take the course; the browser runs everything. Node lets you (and an AI study buddy) run the same tests from a terminal. Run `node tools/pictures.js 01` to save a layer's pictures as PNG files, or `node tools/serve.js` to open the pages at `http://localhost:8000`.

## How each layer works

Each chapter explains what's happening underneath, with diagrams. Along the way, **Predict, then run** blocks ask you to type a guess and tell you if you were right, and **Break it** experiments have you change your code on purpose and explain what happens. Tests print expected vs actual values, and pictures appear as your code works. There are no solutions in this repo. The tests are the judge, like Nand2Tetris.

In a terminal, `node tools/try.js 00` lists a layer's Predict and Break it blocks and `node tools/try.js 00 p1` runs one; to type a guess, paste the block into `scratch.js` and run `node tools/try.js --file scratch.js`.

**Every layer ends with a checkpoint.** When all of a layer's tests pass, its checkpoint unlocks: your own code draws a *mystery picture* through deliberate traps (get every rule right and a hidden word appears; get one wrong and it tells you which rule to look at), and you answer three questions in `checkpoints/NN-*.js`. The answers are stored only as fingerprints, so the repo can't spoil them. A layer is **★ complete** when the picture and all three answers are right.

**Save and show your work.** In the guide, **Save progress** copies a private link with your code and answers, to open on another device, and **Share my engine** opens a page that runs your engine and shows what it draws, with a link to send anyone. Nothing is uploaded: the work rides in the link itself. In Codespaces or a fork, your work lives in git instead.

## Study buddy

Stuck? Ask an AI, and it won't do the work for you.

- **Claude Code or Codex:** open this folder in the agent. `CLAUDE.md` and `AGENTS.md` tell it to ask questions first, climb a hint ladder one step at a time, and never write your solution. It can run the tests to see exactly where you are.
- **Claude.ai or ChatGPT in one click:** each chapter has *Study buddy* callouts placed where they help, and the guide's workbench has **Ask Claude · Ask ChatGPT** links that also send your code and test results. They open a new chat with the tutor rules filled in. You need to be signed in. (The links use an unofficial URL format, so they could change.)
- **Claude in Chrome:** save the course's tutor text as a `/tutor` shortcut ([setup on the course home](https://nalediym.github.io/motion-from-scratch/#chrome)). On the guide it reads the layer's *What your tutor sees* panel, so there's nothing to paste, and the *Hint level* dots set how far it may go.
- **Any other chat:** paste the contents of `AGENTS.md` as your first message, then your question and your code.

## Layout

```text
docs/          the chapters
src/           your code (one file per layer)
checkpoints/   your checkpoint answers (one file per layer)
tests/         the tests, plus run.js for the terminal
lib/           provided helpers: font, test library, PNG writer, page loader, styles
notebooks/     Colab, Jupyter (Deno) and Observable versions of the course
tools/         try.js, pictures.js and serve.js for you; the scripts that build the site
scratch.js     your playground for Predict and Break it blocks
index.html     course map, ways to start, and progress
guide.html     the interactive guide
tests.html     results and pictures
showcase.html  the page Share my engine opens
```

**Maintainers:** chapters live only in `docs/`. After editing docs, stubs or tests, run `node tools/build.js` and commit the results; CI checks they're up to date, then publishes the site. Solutions and checkpoint answers are never committed here.

## Credits

- Inspired by [Nand2Tetris](https://www.nand2tetris.org/) by Noam Nisan and Shimon Schocken: build each layer from the one below it.
- The final project rebuilds KineticIntro from [Claude Motion Studio](https://github.com/MoussaabBadla/claude-motion-studio) by Moussaab Badla (MIT).
- Real-world comparisons draw on [Remotion](https://www.remotion.dev/).

## License

Code (everything except `docs/`) is [MIT](LICENSE). The chapters in `docs/` are [CC BY 4.0](docs/LICENSE): reuse and remix them with credit to Naledi and a link to this repo.
