"use client";

import { useEffect, useId, useRef, useState } from "react";

const canvasDPI = 1.2;

export default function Shader({
  width = 100,
  height = 100,
  debug,
  style,
  fragment,
  children,
  onFilterCreated,
  mousePosition = { x: 0.5, y: 0.5 },
}) {
  const id = useId().replace(/[#:]/g, "-");
  const canvasRef = useRef();
  const feImageRef = useRef();
  const feDisplacementMapRef = useRef();
  const debugRef = useRef();

  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseUsed = useRef(false);
  const [mouseDep, setMouseDep] = useState(0);

  useEffect(() => {
    mouseRef.current.x = mousePosition.x;
    mouseRef.current.y = mousePosition.y;
    console.log("---Mouse updated:", mouseRef.current);
    setMouseDep((prev) => {
      console.log("---mouseDep changing from", prev, "to", prev + 1);
      return prev + 1;
    });
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    if (!feImageRef.current) return;
    
    // Calculer l'offset basé sur la position de la souris (en pixels)
    // Le feImage est 2x plus grand, donc on centre sur la position de la souris
    const offsetX = mousePosition.x - width;
    const offsetY = mousePosition.y - height;
    
    console.log("---Offset:", offsetX, offsetY, "Mouse:", mousePosition, "Size:", width, height);
    feImageRef.current.setAttribute("x", offsetX);
    feImageRef.current.setAttribute("y", offsetY);
  }, [mousePosition.x, mousePosition.y, width, height]);

  // Notify parent component of the filter ID
  useEffect(() => {
    if (onFilterCreated) {
      onFilterCreated(`${id}_filter`);
    }
  }, [id, onFilterCreated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!feImageRef.current) return;
    if (!feDisplacementMapRef.current) return;

    const context = canvas.getContext("2d");

    const mouse = new Proxy(mouseRef.current, {
      get: (target, prop) => {
        mouseUsed.current = true;
        return target[prop];
      },
    });

    console.log("!!!!! Shader recalculating with mouse:", mouseRef.current);
    console.log("!!!!! Width:", width, "Height:", height, "Type:", typeof width, typeof height);
    mouseUsed.current = false;

    // S'assurer que width et height sont des entiers valides
    // Le canvas doit être 2x plus grand pour permettre le déplacement
    const w = Math.floor(width * 2 * canvasDPI);
    const h = Math.floor(height * 2 * canvasDPI);
    
    console.log("!!!!! Canvas dimensions:", w, h, "Data length:", w * h * 4);
    
    // Vérifier que les dimensions sont valides
    if (w <= 0 || h <= 0 || !isFinite(w) || !isFinite(h)) {
      console.error("!!!!! Invalid dimensions:", w, h);
      return;
    }
    
    const data = new Uint8ClampedArray(w * h * 4);
    
    // Vérifier que la longueur des données est correcte
    if (data.length !== w * h * 4) {
      console.error("!!!!! Data length mismatch:", data.length, "expected:", w * h * 4);
      return;
    }

    // Dynamic scale to make it as smooth as possible to ensure the best quality
    // but also meet the requirements of the shader.
    let maxScale = 0;
    const rawValues = [];
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % w;
      const y = ~~(i / 4 / w);
      const pos = fragment(
        {
          x: x / w,
          y: y / h,
        },
        mouse
      );
      const dx = pos.x * w - x;
      const dy = pos.y * h - y;
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      rawValues.push(dx, dy);
    }
    maxScale *= 2;

    let index = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = rawValues[index++] / maxScale + 0.5;
      const g = rawValues[index++] / maxScale + 0.5;
      data[i] = r * 255;
      data[i + 1] = g * 255;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
    console.log("---ImageData length:", data.length, "Expected:", w * h * 4);
    context.putImageData(new ImageData(data, w, h), 0, 0);

    feImageRef.current.setAttribute("href", canvas.toDataURL());
    feDisplacementMapRef.current.setAttribute("scale", maxScale / canvasDPI);
    if (debugRef.current) {
      debugRef.current.textContent = `Displacement Map (scale = ${maxScale.toFixed(
        2
      )})`;
    }
  }, [width, height, fragment, mouseDep, canvasDPI]);

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
        width={0}
        height={0}
        style={{ display: "none" }}
      >
        <defs>
          <filter
            id={`${id}_filter`}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feImage
              id={`${id}_map`}
              width={width * 2}
              height={height * 2}
              x="0"
              y="0"
              ref={feImageRef}
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2={`${id}_map`}
              xChannelSelector="R"
              yChannelSelector="G"
              ref={feDisplacementMapRef}
            />
          </filter>
        </defs>
      </svg>

      {children}
      <canvas
        width={width * 2 * canvasDPI}
        height={height * 2 * canvasDPI}
        ref={canvasRef}
        style={{ display: debug ? "inline-block" : "none", width: width * 2, height: height * 2 }}
      />
    </>
  );
}
