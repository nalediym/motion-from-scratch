// lib/mysteries/03-time.js — layer 03's checkpoint picture. PROVIDED.
// Six panels from a 12-frame film, each picked by your timing functions at a
// tricky moment, plus a timecode caption. Every rule right spells a word.
// draw() runs the learner's functions; check() says which rule went wrong,
// never how to fix it. See lib/checkpoint.js for how a checkpoint runs.
(function (MS) {
  const FILM = "T?#MIN??#GXI";   // frame n shows FILM[n]
  const FPS = 12;
  // How each panel picks its frame. The right answers spell the word.
  const PANELS = [
    { why: "83.2 ms in (frame 1 starts at 83.33 ms)", pick: () => MS.frameAt(83.2, FPS, 12) },
    { why: "416.6 ms in (frame 5 starts at 416.67 ms)", pick: () => MS.frameAt(416.6, FPS, 12) },
    { why: "1.25 s into the 1-second loop", pick: () => MS.frameAt(1250, FPS, 12) },
    { why: "5 s into a clip that doesn't loop", pick: () => MS.frameAt(5000, FPS, 12, false) },
    { why: "0.375 s, converted to frames", pick: () => MS.secondsToFrames(0.375, FPS) },
    { why: "3.75 s into the loop", pick: () => MS.frameAt(3750, FPS, 12) },
  ];
  const PW = 9, PH = 11, GAP = 2, M = 3;

  MS.mystery("03", {
    draw() {
      const film = MS.createComposition({
        width: PW, height: PH, fps: FPS, durationInFrames: 12,
        render(frame, n) { MS.clearFrame(frame, [26, 39, 64]); MS.drawText(frame, FILM[n], 2, 2, 1, [255, 255, 255]); },
      });
      const W = M * 2 + PANELS.length * PW + (PANELS.length - 1) * GAP, H = M + PH + M + 7 + M;
      const sheet = MS.createFrame(W, H);
      MS.clearFrame(sheet, [11, 13, 18]);
      const picked = [], failed = [];
      PANELS.forEach((p, i) => {
        let panel = null;
        try { picked[i] = p.pick(); panel = MS.renderFrame(film, picked[i]); }
        catch (e) { failed[i] = e.message; }
        const x0 = M + i * (PW + GAP);
        for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
          const k = ((M + y) * W + x0 + x) * 4;
          if (panel) sheet.data.set(panel.data.subarray((y * PW + x) * 4, (y * PW + x) * 4 + 4), k);
          else sheet.data.set((x === y || x === PW - 1 - y) ? [255, 92, 138, 255] : [40, 10, 20, 255], k);   // a red X: this panel couldn't be drawn
        }
      });
      let caption = "";
      try { caption = MS.timecode(18, FPS); MS.drawText(sheet, caption, W / 2, M + PH + M, 1, [138, 147, 166], { align: "center" }); }
      catch (e) { failed.caption = e.message; }
      return { frame: sheet, picked, failed, caption };
    },
    check({ frame, picked, failed, caption }, data) {
      const hints = [];
      const want = [0, 4, 3, 11, 5, 9];
      failed.forEach((msg, i) => { if (msg) hints.push(`Panel ${i + 1} (${PANELS[i].why}) couldn't be drawn: ${msg}`); });
      if (picked[0] === 1 || picked[1] === 5) hints.push("Panel 1 or 2 shows the frame after the right one. A frame is on screen only once it has fully started: count the frames that have started, don't round.");
      if (picked[2] !== undefined && picked[2] !== 3) hints.push(`Panel 3 should be a quarter of the way through the clip's second time around. Past the last frame, a looping player starts again from 0.`);
      if (picked[3] !== undefined && picked[3] !== 11) hints.push("Panel 4 should hold the last frame: with loop = false, a player that runs past the end stays on frame durationInFrames − 1.");
      if (picked[4] !== undefined && picked[4] !== 5) hints.push("Panel 5 is a frame off. 0.375 s at 12 fps is 4.5 frames, and secondsToFrames rounds to the nearest whole frame (halves go up).");
      if (picked[5] !== undefined && picked[5] !== 9 && picked[2] === 3) hints.push("Panel 6 is wrong although panel 3 is right: the loop has to work for any number of times around.");
      const ghost = (() => { try { const f = MS.createComposition({ width: 4, height: 1, fps: 1, durationInFrames: 4, render: (fr, n) => MS.setPixel(fr, n, 0, [255, 255, 255]) }); MS.renderFrame(f, 1); return MS.renderFrame(f, 2).data[7] > 0; } catch (e) { return false; } })();
      if (ghost) hints.push("Letters are piling up on top of each other: each call to renderFrame should start from a new, empty frame.");
      if (!failed.caption && caption !== "00:00:01:06") hints.push(`The caption reads "${caption}". Every timecode field has two digits, and the last one counts frames within the current second.`);
      const matches = MS.hashFrame(frame) === data.mystery && want.every((v, i) => picked[i] === v);
      return { wrong: matches ? 0 : 1, hints };
    },
  });
})(globalThis.MS = globalThis.MS || {});
