---
name: write-layer
description: For course maintainers only. Write or revise a Motion from Scratch layer (chapter, starter code, tests, checkpoint) with the authoring kit. Never use it to help a learner with their own code; that's motion-tutor.
---

# Write a layer

This is maintainer work (see "Maintainers" in AGENTS.md). If the person is taking the course, stop and use the `motion-tutor` skill instead.

1. **Get the kit.** Ask where the private kit folder is (solutions and answers). It must stay outside the repo; never copy its contents into the repo or paste answers into chat logs that get committed.
2. **Read AUTHORING.md** and the previous layer's chapter, starter code and tests, so the new layer builds on them and matches their voice.
3. **Scaffold.** `node tools/new-layer.js NN --kit <kit>` (the layer must already be in `lib/course.js`).
4. **Pin down the behavior first.** Write the solution in `<kit>/solutions/`, then the tests, then the starter code's spec comments. Every function in `src/` only throws `MS.todo`.
5. **Write the chapter**, then the mystery and the three checkpoint questions, with their answers in `<kit>/answers.json`.
6. **Check.** Set `ready: true`, run `node tools/checkpoint-data.js --kit <kit>`, then `node tools/check-layer.js NN --kit <kit>` until it reports ✓ all good. Compare its printed Predict values with the chapter's Answers.
7. **Build and look.** `node tools/build.js`, then open the guide and tests page (`node tools/serve.js`) and look at the layer at desktop and phone width.
8. **Review with fresh eyes** (writing, pages, a first-time learner's walk-through), fix, and re-run step 6 before committing.
