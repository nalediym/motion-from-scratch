// tests/{{base}}.test.js — PROVIDED. Read a failing test to see what's expected.
(function (MS) {
  const L = "{{id}}";

  // One idea per test. The name is what a learner reads when it fails.
  MS.test(L, "TODO(author): todoName does the main thing", t => {
    t.eq(MS.todoName(), 0, "what was checked");
  });

  // A picture for tests.html and the guide (returns a frame). For something
  // that moves, use MS.animation(L, name, () => composition) instead.
  MS.visual(L, "TODO(author): what the picture shows", () => {
    const f = MS.createFrame(40, 20);
    return f;
  });
})(globalThis.MS = globalThis.MS || {});
