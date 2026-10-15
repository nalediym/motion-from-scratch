// lib/present.js — put frames on the screen, still or playing. PROVIDED (browser only).
//
//   frame.data ──► ImageData ──► canvas ──► compositor ──► GPU ──► display
//
// putImageData copies your bytes straight into the canvas. No blending, no
// scaling: what's in memory is exactly what you get. We make the canvas the
// same size as the frame and let CSS zoom it up with `image-rendering:
// pixelated`, so small frames show their pixels as crisp squares.
(function (MS) {
  // KineticIntro's font, Inter, comes from the page's Google Fonts link. A
  // canvas silently uses a fallback font until the real one has loaded, so
  // this starts loading it now; pages wait on it before drawing text again.
  MS.fontsReady = typeof document !== "undefined" && document.fonts
    ? Promise.all(["500 20px Inter", "900 20px Inter"].map(f => document.fonts.load(f))).catch(() => {})
    : Promise.resolve();

  MS.present = function (frame, canvas, zoom = 1) {
    canvas.width = frame.width;
    canvas.height = frame.height;
    const image = new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height);
    canvas.getContext("2d").putImageData(image, 0, 0);
    canvas.style.width = frame.width * zoom + "px";
    canvas.style.imageRendering = "pixelated";
    return canvas;
  };

  // Play a composition on a canvas, looping. Your frameAt (layer 03) picks
  // the frame for the time that has passed and your renderFrame draws it.
  // Draws only while the canvas is on screen; stops once it leaves the page.
  MS.play = function (comp, canvas, zoom = 1, onError) {
    let start = null, last = -1, visible = true, stopped = false;
    if (typeof IntersectionObserver === "function") {
      visible = false;
      new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; }).observe(canvas);
    }
    const tick = now => {
      if (stopped || (last >= 0 && !canvas.isConnected)) return;
      if (start === null) start = now;
      if (visible || last < 0) {
        try {
          const n = MS.frameAt(now - start, comp.fps, comp.durationInFrames);
          if (n !== last) { MS.present(MS.renderFrame(comp, n), canvas, zoom); last = n; }
        } catch (e) { stopped = true; if (onError) onError(e); return; }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return { stop() { stopped = true; } };
  };

  // The Export MP4 button under an export picture (layer 10): the browser encodes
  // the frames, your mp4() wraps them in a file, and the page plays it back.
  function exportControls(getComp, name) {
    const box = document.createElement("div"), button = document.createElement("button"), status = document.createElement("span");
    box.className = "export";
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0";
    button.type = "button";
    button.textContent = "Export MP4";
    status.style.cssText = "font-size:0.85em";
    button.addEventListener("click", async () => {
      button.disabled = true;
      box.querySelectorAll("video, a").forEach(el => el.remove());
      try {
        await MS.fontsReady;   // so the video's text uses the real font, not a fallback
        const video = await MS.encodeVideo(getComp(), { onProgress: (i, n) => { status.textContent = `Encoding frame ${i} of ${n}…`; } });
        status.textContent = "Writing the file with your mp4()…";
        const bytes = MS.mp4(video.chunks, { width: video.width, height: video.height, description: video.description });
        const url = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
        const player = Object.assign(document.createElement("video"), { src: url, controls: true, loop: true, muted: true, playsInline: true });
        player.style.cssText = "display:block;max-width:100%;max-height:360px;flex-basis:100%";
        player.addEventListener("error", () => { status.textContent += " The browser couldn't play it: look at your boxes again."; });
        const link = Object.assign(document.createElement("a"), { href: url, download: name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 40) + ".mp4" });
        link.textContent = `Download (${Math.round(bytes.length / 1024)} KB)`;
        status.textContent = `${video.chunks.length} frames, ${video.codec}.`;
        box.append(link, player);
        player.play().catch(() => {});
      } catch (e) {
        status.textContent = (e && e.todo ? "Waiting on: " : "Couldn't export: ") + (e && e.message ? e.message : e);
      } finally {
        button.disabled = false;
      }
    });
    box.append(button, status);
    return box;
  }

  // A <figure> for one test picture, still or moving, zoomed up to about `fit` CSS pixels wide.
  MS.figure = function (pic, fit = 200) {
    const fig = document.createElement("figure"), cap = document.createElement("figcaption");
    const zoomFor = w => Math.max(1, Math.min(5, Math.floor(fit / w)));
    try {
      if (MS.moves(pic)) {
        let comp = pic.fn();
        const canvas = document.createElement("canvas"), zoom = zoomFor(comp.width);
        const stopped = e => { cap.textContent = pic.name + " (stopped: " + e.message + ")"; };
        MS.present(MS.renderFrame(comp, 0), canvas, zoom);   // the first frame now; throws if not written yet
        fig.appendChild(canvas);
        let player = MS.play(comp, canvas, zoom, stopped);
        // A composition may have made its text sprites before the real fonts arrived: make it again once they're in.
        if (document.fonts && !document.fonts.check("900 20px Inter"))
          MS.fontsReady.then(() => { try { const again = pic.fn(); player.stop(); comp = again; player = MS.play(comp, canvas, zoom, stopped); } catch (e) {} });
        if (pic.kind === "export") fig.appendChild(exportControls(() => comp, pic.name));
      } else {
        const frame = pic.fn(), canvas = MS.present(frame, document.createElement("canvas"), zoomFor(frame.width));
        fig.appendChild(canvas);
        // Real fonts (layer 08 on) may still be loading: draw it again once they're in.
        MS.fontsReady.then(() => { try { const again = pic.fn(); MS.present(again, canvas, zoomFor(again.width)); } catch (e) {} });
      }
      cap.textContent = pic.name;
    } catch (e) {
      const strong = document.createElement("strong");
      strong.textContent = pic.name;
      cap.append(strong, document.createElement("br"), (e.todo ? "Waiting on: " : "Error: ") + e.message);
    }
    fig.appendChild(cap);
    return fig;
  };
})(globalThis.MS = globalThis.MS || {});
