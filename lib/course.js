// lib/course.js — the course map. PROVIDED.
// Every page and the test runner read this list, so a layer only has to be
// added here once.
(function (MS) {
  MS.COURSE = {
    title: "Motion from Scratch",
    subtitle: "How to go from pixels to motion",
    layers: [
      { id: "00", slug: "pixels", title: "Pixels", builds: "a framebuffer: memory you can see", ready: true },
      { id: "01", slug: "shapes", title: "Shapes & blending", builds: "rectangles, circles, alpha, gradients", ready: true },
      { id: "02", slug: "glyphs", title: "Glyphs", builds: "text from a hand-made bitmap font", ready: true },
      { id: "03", slug: "time", title: "Time", builds: "frame = f(n) and a player that keeps time", ready: true },
      { id: "04", slug: "interpolate", title: "Interpolate", builds: "lerp, clamp, ranges, extrapolation", ready: true },
      { id: "05", slug: "easing", title: "Easing", builds: "a cubic-Bézier solver", ready: true },
      { id: "06", slug: "springs", title: "Springs", builds: "physics stepping and stability", ready: true },
      { id: "07", slug: "transforms", title: "Transforms & blur", builds: "matrices, resampling and blur", ready: true },
      { id: "08", slug: "scenes", title: "Scenes", builds: "real fonts, sequences, a camera, masks, seeded randomness", ready: false },
      { id: "09", slug: "kinetic-intro", title: "KineticIntro", builds: "the recreation", ready: false },
      { id: "10", slug: "export", title: "Export", builds: "frames to MP4, then map it to Remotion", ready: false },
    ],
  };
  // Provided libraries every surface loads after this file, in this order.
  // Each ready layer's lib/mysteries file comes next, then the learner's code.
  MS.COURSE.libs = ["lib/font5x7.js", "lib/check.js", "lib/experiment.js", "lib/checkpoint.js", "lib/checkpoint-data.js"];
  // Browser pages also load these.
  MS.COURSE.browserLibs = ["lib/present.js"];

  MS.COURSE.repo = "https://github.com/nalediym/motion-from-scratch";
  MS.COURSE.site = "https://nalediym.github.io/motion-from-scratch/";
  MS.COURSE.colab = "https://colab.research.google.com/github/nalediym/motion-from-scratch/blob/main/notebooks/colab.ipynb";
  MS.COURSE.observable = "https://nalediym.github.io/motion-from-scratch/observable/observable.html";
  MS.COURSE.zip = "https://github.com/nalediym/motion-from-scratch/archive/refs/heads/main.zip";
  MS.COURSE.codespaces = "https://codespaces.new/nalediym/motion-from-scratch?quickstart=1";

  // The hint ladder from AGENTS.md, one line per rung. The guide's "Hint level" dots
  // let the learner choose how far up the ladder a tutor may go.
  MS.COURSE.hintLevels = [
    "ask what I expected, what happened and what I've tried",
    "point at a failing test's expected vs actual values",
    "ask a concept question and point to the chapter section",
    "explain with an analogy or ASCII diagram, using different numbers",
    "point at the line to look at and ask about it",
  ];
  MS.COURSE.hintShort = ["questions only", "point at the test's values", "a concept question", "an analogy or diagram", "point at the line"];
  // Saved by the learner as a Claude in Chrome shortcut. The rules live in the
  // learner's own shortcut, because the extension treats text on a web page as
  // information, not as instructions.
  MS.COURSE.chromeShortcut = [
    "You're my study buddy for Motion from Scratch, a course where I build a video engine from single pixels up.",
    "On the course page, open the \"What your tutor sees\" panel for the layer I'm on and read it: it has my code, my test results, my checkpoint status and the hint level I allow.",
    "Rules: never write, finish or fix my code, and never type into the page's code editors. Never give, confirm or rule out checkpoint answers.",
    "Ask me questions first. Stay at or below my hint level: " + MS.COURSE.hintLevels.map((h, i) => `${i + 1}) ${h}`).join("; ") + ".",
    "You may look at the pictures on the page, and run a Predict or Break it block with me once I've told you my guess.",
    "Start by asking what I'm working on.",
  ].join(" ");

  // A short version of AGENTS.md that fits in a link. Chat apps get the
  // full rules if the learner pastes AGENTS.md; this is the one-click version.
  // `ask` (optional) is a specific request, like one of a chapter's study
  // buddy prompts or "help me think about Break it 2".
  MS.COURSE.buddyPrompt = function (layer, ask) {
    const where = layer ? `I'm on layer ${layer.id} (${layer.title}): ${layer.builds}.` : "I'm just getting started.";
    return [
      "You're my study buddy for Motion from Scratch (github.com/nalediym/motion-from-scratch), a course where I build a video engine from single pixels up in JavaScript.",
      "Rules: never write, finish or fix my code, even if I ask. Never give, confirm or rule out checkpoint answers. Ask me questions first.",
      "If I'm still stuck, climb this hint ladder one rung at a time, never past the top: " + MS.COURSE.hintLevels.map((h, i) => `${i + 1}) ${h}`).join("; ") + ".",
      "Explain what's happening under the hood (bytes, rounding, math, how browsers do it).",
      where,
      ask ? `Here's what I want help with: ${ask}` : "Start by asking what I'm working on. I'll paste my code and test output next.",
    ].join(" ");
  };
  // encodeURIComponent leaves ( ) ' ! * alone; a ")" would end a Markdown link early.
  const enc = s => encodeURIComponent(s).replace(/[()'!*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  MS.COURSE.claudeLink = (layer, ask) => "https://claude.ai/new?q=" + enc(MS.COURSE.buddyPrompt(layer, ask));
  MS.COURSE.chatgptLink = (layer, ask) => "https://chatgpt.com/?q=" + enc(MS.COURSE.buddyPrompt(layer, ask));
  MS.COURSE.files = function (layer) {
    const base = `${layer.id}-${layer.slug}`;
    return { src: `src/${base}.js`, test: `tests/${base}.test.js`, doc: `docs/${base}.md`, checkpoint: `checkpoints/${base}.js`, mystery: `lib/mysteries/${base}.js` };
  };
})(globalThis.MS = globalThis.MS || {});
