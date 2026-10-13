// lib/mysteries/{{base}}.js — layer {{id}}'s checkpoint picture. PROVIDED.
// TODO(author): one line on the picture and the traps it goes through.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle, same, near } = MS.mysteryKit;
  MS.mystery("{{id}}", {
    draw() {
      // TODO(author): draw a picture (a hidden word works well) with the
      // learner's functions, through this chapter's traps. Return { frame }
      // plus anything check() needs; `record` is stored by checkpoint-data.js.
      const f = MS.createFrame(40, 20);
      return { frame: f };
    },
    check(drawn, data) {
      // TODO(author): one hint per trap that fired, naming the rule, not the fix.
      const hints = [];
      const ok = MS.hashFrame(drawn.frame) === data.mystery;
      return { wrong: ok ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
