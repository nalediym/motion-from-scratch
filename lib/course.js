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
  MS.COURSE.files = function (layer) {
    const base = `${layer.id}-${layer.slug}`;
    return { src: `src/${base}.js`, test: `tests/${base}.test.js`, doc: `docs/${base}.md` };
  };
})(globalThis.MS = globalThis.MS || {});
