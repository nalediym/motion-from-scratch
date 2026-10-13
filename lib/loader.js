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
    for (const f of [...MS.COURSE.libs, ...MS.COURSE.browserLibs]) await loadScript(f);
    for (const l of ready) await loadScript(MS.COURSE.files(l).mystery);
    for (const l of ready) await loadScript(MS.COURSE.files(l).src);
    for (const l of ready) await loadScript(MS.COURSE.files(l).test);
    for (const l of ready) await loadScript(MS.COURSE.files(l).checkpoint);
    window.removeEventListener("error", onError);
    return { ready, errors };
  };

  // On the website, src/ holds only the starter code, while work done in the
  // guide is saved in this browser. For each layer whose file is untouched
  // (every test "not written yet"), load the guide's saved code and answers.
  // Returns the ids of the layers that came from the guide.
  MS.useGuideWork = function (ready) {
    const saved = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const run = code => { try { new Function(code)(); } catch (e) { /* the guide shows the error */ } };
    // Decide first, before loading anything changes the results.
    const untouched = ready.filter(l => saved("mfs-src-" + l.id) && MS.runTests(l.id).every(r => r.status === "todo"));
    for (const l of untouched) run(saved("mfs-src-" + l.id));
    for (const l of untouched) { const a = saved("mfs-cp-" + l.id); if (a) run(a); }
    return untouched.filter(l => MS.runTests(l.id).some(r => r.status !== "todo")).map(l => l.id);
  };
})(globalThis.MS = globalThis.MS || {});
