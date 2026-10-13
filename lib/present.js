// lib/present.js — put a frame on the screen. PROVIDED (browser only).
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
})(globalThis.MS = globalThis.MS || {});
