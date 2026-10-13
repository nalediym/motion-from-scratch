// lib/mysteries/01-shapes.js — layer 01's checkpoint picture. PROVIDED.
// Layer 01: a word made of touching half-transparent squares, painted on
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const { shuffle, same, near } = MS.mysteryKit;
  MS.mystery("01", {
    draw() {
      const word = "BLEND", C = 3, M = 4;
      const W = M * 2 + (word.length * 6 - 1) * C, H = M * 2 + 7 * C;
      const layer = MS.createFrame(W, H);              // transparent: trap for the divide-by-alpha rule
      let cells = 0;
      [...word].forEach((ch, i) => MS.FONT_5x7[ch].forEach((row, r) => [...row].forEach((cell, c) => {
        if (cell !== "#") return;
        cells++;
        MS.fillRect(layer, M + (i * 6 + c) * C, M + r * C, C, C, [0, 140, 255, 128]);   // neighbors share edges
      })));
      const card = MS.createFrame(W, H);
      MS.fillVerticalGradient(card, MS.hex("#1A2740"), MS.hex("#0B0D12"));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const p = MS.getPixel(layer, x, y);
        if (p[3]) MS.blendPixel(card, x, y, p);
      }
      return { frame: card, layer, cells, C };
    },
    check({ frame, layer, cells, C }, data) {
      let inked = 0, seams = 0, darkened = 0;
      for (let y = 0; y < layer.height; y++) for (let x = 0; x < layer.width; x++) {
        const p = MS.getPixel(layer, x, y);
        if (!p[3]) continue;
        inked++;
        if (p[3] > 130) seams++;
        else if (!near(p.slice(0, 3), [0, 140, 255], 2)) darkened++;
      }
      const matches = MS.hashFrame(frame) === data.mystery;
      const hints = [];
      if (seams) hints.push(`${seams} pixel(s) were painted twice where two squares touch, leaving darker seams. A rectangle's right and bottom edges should be exclusive.`);
      if (inked < cells * C * C && !seams) hints.push(`The squares came out smaller than ${C} × ${C}. Check how fillRect rounds its edges.`);
      if (darkened) hints.push(`${darkened} pixel(s) of ink came out darker than the color painted. See-through color painted onto an empty pixel should keep its color; look at the divide-by-outAlpha step in blendPixel.`);
      if (!matches && !hints.length) hints.push("The letters are right but the background card isn't. Check fillVerticalGradient: each row samples t = (y + 0.5) / height.");
      return { wrong: matches ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
