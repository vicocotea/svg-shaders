import { useRef, useCallback } from "react";

const canvasDPI = 1;

export function useShader(options = {}) {
  const { fragment, canvasWidth, canvasHeight, points = [], buttonSize = { width: 200, height: 200 }, intensity = 0.5 } = options;

  const feImageRef = useRef();
  const feDisplacementMapRef = useRef();

  const drawFragment = useCallback(
    (canvas, id) => {
      if (!canvas || !feImageRef.current || !feDisplacementMapRef.current)
        return;

      const context = canvas.getContext("2d");
      const w = Math.floor(canvasWidth * canvasDPI);
      const h = Math.floor(canvasHeight * canvasDPI);

      const data = new Uint8ClampedArray(w * h * 4);

      // Dynamic scale calculation
      let maxScale = 0;
      const rawValues = [];

      // First pass: calculate displacements and find maxScale
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const uvX = x / w;
          const uvY = y / h;

          const pos = fragment({
            x: uvX,
            y: uvY,
          }, points, buttonSize, intensity);

          const dx = pos.x * w - x;
          const dy = pos.y * h - y;

          maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
          rawValues.push(dx, dy);
        }
      }

      // Avoid division by zero and ensure minimum scale
      maxScale = Math.max(maxScale, 1.0);

      // Second pass: normalize and write data
      let index = 0;
      for (let i = 0; i < data.length; i += 4) {
        const dx = rawValues[index++];
        const dy = rawValues[index++];

        const r = dx / maxScale + 0.5;
        const g = dy / maxScale + 0.5;

        // Clamp values between 0 and 1 to avoid artifacts
        data[i] = Math.max(0, Math.min(255, r * 255));
        data[i + 1] = Math.max(0, Math.min(255, g * 255));
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      context.putImageData(new ImageData(data, w, h), 0, 0);
      feImageRef.current.setAttribute("href", canvas.toDataURL());
    },
    [fragment, canvasWidth, canvasHeight, points, buttonSize, intensity]
  );

  return {
    feImageRef,
    feDisplacementMapRef,
    drawFragment,
  };
}
