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
      { id: "03", slug: "time", title: "Time", builds: "frame = f(n) and a player that keeps time", ready: false },
      { id: "04", slug: "interpolate", title: "Interpolate", builds: "lerp, clamp, ranges, extrapolation", ready: false },
      { id: "05", slug: "easing", title: "Easing", builds: "a cubic-Bézier solver", ready: false },
      { id: "06", slug: "springs", title: "Springs", builds: "physics stepping and stability", ready: false },
      { id: "07", slug: "canvas", title: "Hand-off to canvas", builds: "transforms, blur, then real fonts on canvas", ready: false },
      { id: "08", slug: "scenes", title: "Scenes", builds: "sequences, a camera, masks, seeded randomness", ready: false },
      { id: "09", slug: "kinetic-intro", title: "KineticIntro", builds: "the recreation", ready: false },
      { id: "10", slug: "export", title: "Export", builds: "frames to MP4, then map it to Remotion", ready: false },
    ],
  };
  MS.COURSE.repo = "https://github.com/nalediym/motion-from-scratch";
  MS.COURSE.site = "https://nalediym.github.io/motion-from-scratch/";
  MS.COURSE.colab = "https://colab.research.google.com/github/nalediym/motion-from-scratch/blob/main/notebooks/colab.ipynb";
  MS.COURSE.observable = "https://nalediym.github.io/motion-from-scratch/observable/observable.html";
  MS.COURSE.zip = "https://github.com/nalediym/motion-from-scratch/archive/refs/heads/main.zip";

  // A short version of AGENTS.md that fits in a link. Chat apps get the
  // full rules if the learner pastes AGENTS.md; this is the one-click version.
  // `ask` (optional) is a specific request, like one of a chapter's study
  // buddy prompts or "help me think about Break it 2".
  MS.COURSE.buddyPrompt = function (layer, ask) {
    const where = layer ? `I'm on layer ${layer.id} (${layer.title}): ${layer.builds}.` : "I'm just getting started.";
    return [
      "You're my study buddy for Motion from Scratch (github.com/nalediym/motion-from-scratch), a course where I build a video engine from single pixels up in JavaScript.",
      "Rules: never write, finish or fix my code, even if I ask. Ask me questions first.",
      "If I'm still stuck, give one hint at a time: point at the test's expected vs actual values, then ask a concept question, then explain with an analogy or ASCII diagram using different numbers, then point at the line to look at. Never go further than that.",
      "Explain what's happening under the hood (bytes, rounding, math, how browsers do it).",
      where,
      ask ? `Here's what I want help with: ${ask}` : "Start by asking what I'm working on. I'll paste my code and test output next.",
    ].join(" ");
  };
  // encodeURIComponent leaves ( ) ' ! * alone; a ")" would end a Markdown link early.
  const enc = s => encodeURIComponent(s).replace(/[()'!*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  MS.COURSE.claudeLink = (layer, ask) => "https://claude.ai/new?q=" + enc(MS.COURSE.buddyPrompt(layer, ask));
  MS.COURSE.chatgptLink = (layer, ask) => "https://chatgpt.com/?q=" + enc(MS.COURSE.buddyPrompt(layer, ask));
  // The study-buddy request for a Predict or Break it block.
  MS.COURSE.blockAsk = (kind, title) => kind === "predict"
    ? `I'm doing this prediction: "${title}". Don't tell me the answer. Ask me how I'm reasoning about it, and help me check my thinking.`
    : `I'm doing this break-it experiment: "${title}". Don't tell me what will happen. Ask me what I observed before and after the change, and help me explain why.`;

  MS.COURSE.files = function (layer) {
    const base = `${layer.id}-${layer.slug}`;
    return { src: `src/${base}.js`, test: `tests/${base}.test.js`, doc: `docs/${base}.md`, checkpoint: `checkpoints/${base}.js` };
  };
})(globalThis.MS = globalThis.MS || {});
