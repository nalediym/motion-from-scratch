# Motion from Scratch

**How to go from pixels to motion.** Build a video engine yourself, starting from a single pixel, adding one idea per layer, until you've rebuilt a real motion-graphics intro and exported it as an MP4.

No libraries. No install. Just a browser, a text editor, and (if you like) an AI study buddy that asks questions instead of handing you answers.

```text
  10  Export          frames → MP4, then map it all to Remotion
  09  KineticIntro    the recreation
  08  Scenes          sequences, camera, masks, seeded randomness
  07  Canvas          transforms + blur by hand, then real fonts
  06  Springs         physics stepping and stability
  05  Easing          a cubic-Bézier solver
  04  Interpolate     lerp, clamp, ranges, extrapolation
  03  Time            frame = f(n), a player that keeps time
  02  Glyphs          text from a hand-made bitmap font        ◄ available now
  01  Shapes          rectangles, circles, alpha, gradients    ◄ available now
  00  Pixels          a framebuffer: memory you can see        ◄ available now
      ▲ each layer is built only from the layers below it
```

The final project is a from-scratch rebuild of `KineticIntro` from [Claude Motion Studio](https://github.com/MoussaabBadla/claude-motion-studio): three words punching through the screen, then a logo lockup with a light sweep.

> **Status:** layers 00–02 are ready. Layers 03–10 are being written.

## How to get started

Pick one way to work. Every option has the same chapters, starter code and tests.

| Way | Good for | Start |
|---|---|---|
| **Interactive guide** | Fastest; nothing to install. Code saves in your browser | [Open the guide](https://nalediym.github.io/motion-from-scratch/guide.html) |
| **Google Colab** | A notebook in your Google Drive | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nalediym/motion-from-scratch/blob/main/notebooks/colab.ipynb) |
| **Your own editor** | Working with Claude Code or Codex as a study buddy | `git clone https://github.com/nalediym/motion-from-scratch` or [download the ZIP](https://github.com/nalediym/motion-from-scratch/archive/refs/heads/main.zip) |
| **Jupyter / VS Code** | A local JavaScript notebook (Deno kernel) | [`notebooks/jupyter-deno.ipynb`](notebooks/jupyter-deno.ipynb) |
| **Observable** | Read and run online; edit locally | [Observable view](https://nalediym.github.io/motion-from-scratch/observable/observable.html) · [`notebooks/observable.html`](notebooks/observable.html) |

**Working in your own editor:**

1. Open `index.html` in your browser. It's the course map, and it shows your progress.
2. Read `docs/00-pixels.md`, then fill in `src/00-pixels.js`.
3. Check your work: open `tests.html`, or run `node tests/run.js` in a terminal.

You don't need Node to take the course; the browser runs everything. Node lets you (and an AI study buddy) run the same tests from a terminal. Run `node tools/pictures.js 01` to save a layer's pictures as PNG files.

**Jupyter / VS Code setup:** install [Deno](https://docs.deno.com/runtime/getting_started/installation/), run `deno jupyter --install`, then open `notebooks/jupyter-deno.ipynb` and pick the Deno kernel.

**Editing the Observable notebook:** download `notebooks/observable.html`, then in its folder run `npx -p @observablehq/notebook-kit notebooks preview --root .` and edit the file in any editor; the page reloads as you save. [Observable Desktop](https://observablehq.com/notebook-kit/desktop) (macOS) can open it too.

**You're done with a layer** when every test passes and you can answer its checkpoint questions without looking. You're done with the course when layer 10 exports your KineticIntro as an MP4.

## How each layer works

| Step | Where |
|---|---|
| Read the idea, with diagrams of what's happening underneath | `docs/NN-name.md` |
| Write the functions. Each comment is the spec | `src/NN-name.js` |
| Check: tests print expected vs actual, and pictures appear as your code works | `tests.html` or `node tests/run.js NN` |
| Predict, then run: guess what the machine will do before you check | in each chapter |
| Break it: undo something on purpose and explain the result | in each chapter |

There are no solutions in this repo. The tests are the judge, like Nand2Tetris.

## Study buddy

Stuck? Ask an AI, and it won't do the work for you.

- **Claude Code or Codex:** open this folder in the agent. `CLAUDE.md` and `AGENTS.md` tell it to ask questions first, climb a hint ladder one step at a time, and never write your solution. It can run the tests to see exactly where you are.
- **Claude.ai or ChatGPT in one click:** the course home and every workbench in the guide have links that open a new chat with short tutor rules filled in. You need to be signed in. (These links use a URL format the chat apps support but don't officially document.)
- **Any other chat:** paste the contents of `AGENTS.md` as your first message, then your question and your code.

Good first prompts:

- "I'm on layer 00. Don't give me code. Ask me questions until I can explain why the pixel index is (y × width + x) × 4."
- "Here's my function. Don't fix it. Give me one input where it's wrong."
- "Give me a predict-then-run question about what I just wrote."

## Layout

```text
docs/       the chapters
src/        your code (one file per layer)
tests/      the tests, plus run.js for the terminal
lib/        provided helpers: font, test library, PNG writer, page loader, styles
notebooks/  Colab, Jupyter (Deno) and Observable versions of the course
tools/      pictures.js for learners; build scripts for maintainers
index.html  course map, ways to start, and progress
guide.html  the interactive guide
tests.html  results and pictures
```

**Maintainers:** chapters live only in `docs/`. After editing docs, stubs or tests, run `node tools/build-guide.js && node tools/build-notebooks.js` and commit the results. CI checks they're up to date, then publishes the site to GitHub Pages.

## Credits

- Inspired by [Nand2Tetris](https://www.nand2tetris.org/) by Noam Nisan and Shimon Schocken: build each layer from the one below it.
- The final project rebuilds KineticIntro from [Claude Motion Studio](https://github.com/MoussaabBadla/claude-motion-studio) by Moussaab Badla (MIT).
- Real-world comparisons draw on [Remotion](https://www.remotion.dev/).

## License

Code (everything except `docs/`) is [MIT](LICENSE). The chapters in `docs/` are [CC BY 4.0](docs/LICENSE): reuse and remix them with credit to Naledi and a link to this repo.
