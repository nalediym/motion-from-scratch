// lib/loader.js — loads the course scripts in a page, in order. PROVIDED.
// Works when you open the .html file straight from disk (file://): plain
// <script> tags are allowed there, while JavaScript modules are not.
(function (MS) {
  function loadScript(src) {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = src + "?v=" + Date.now(); // always load your latest edits
      s.onload = () => resolve({ src, ok: true });
      s.onerror = () => resolve({ src, ok: false });
      document.head.appendChild(s);
    });
  }
  // Loads every ready layer's src, then its tests. Collects script errors so
  // a typo in your file shows up on the page instead of only in the console.
  MS.loadCourse = async function () {
    const errors = [];
    const onError = e => errors.push({ file: (e.filename || "").replace(/^.*\/(src|tests|lib|checkpoints)\//, "$1/").replace(/\?v=\d+$/, ""), message: e.message, line: e.lineno });
    window.addEventListener("error", onError);
    const ready = MS.COURSE.layers.filter(l => l.ready);
    for (const l of ready) await loadScript(MS.COURSE.files(l).src);
    for (const l of ready) await loadScript(MS.COURSE.files(l).test);
    for (const l of ready) await loadScript(MS.COURSE.files(l).checkpoint);
    window.removeEventListener("error", onError);
    return { ready, errors };
  };
})(globalThis.MS = globalThis.MS || {});
