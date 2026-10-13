// lib/present.js — put frames on the screen, still or playing. PROVIDED (browser only).
//
//   frame.data ──► ImageData ──► canvas ──► compositor ──► GPU ──► display
//
// putImageData copies your bytes straight into the canvas. No blending, no
// scaling: what's in memory is exactly what you get. We make the canvas the
// same size as the frame and let CSS zoom it up with `image-rendering:
// pixelated`, so small frames show their pixels as crisp squares.
(function (MS) {
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

  // A <figure> for one test picture, still or moving, zoomed up to about `fit` CSS pixels wide.
  MS.figure = function (pic, fit = 200) {
    const fig = document.createElement("figure"), cap = document.createElement("figcaption");
    const zoomFor = w => Math.max(1, Math.min(5, Math.floor(fit / w)));
    try {
      if (pic.kind === "animation") {
        const comp = pic.fn(), canvas = document.createElement("canvas"), zoom = zoomFor(comp.width);
        MS.present(MS.renderFrame(comp, 0), canvas, zoom);   // the first frame now; throws if not written yet
        fig.appendChild(canvas);
        MS.play(comp, canvas, zoom, e => { cap.textContent = pic.name + " (stopped: " + e.message + ")"; });
      } else {
        const frame = pic.fn();
        fig.appendChild(MS.present(frame, document.createElement("canvas"), zoomFor(frame.width)));
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
