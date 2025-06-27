"use client";

import { useEffect, useId, useRef, useState } from "react";

const canvasDPI = 1;

export default function Shader({
  width = 100,
  height = 100,
  debug,
  style,
  scale = 0,
  fragment,
  children,
  onFilterCreated,
  mousePosition = { x: 0.5, y: 0.5 },
  points = [],
}) {
  const id = useId().replace(/[#:]/g, "-");
  const canvasRef = useRef();
  const feImageRef = useRef();
  const feDisplacementMapRef = useRef();

  const canvasWidth = width;
  const canvasHeight = height;

  // Notify parent component of the filter ID
  useEffect(() => {
    if (onFilterCreated) {
      onFilterCreated(`${id}_filter`);
    }
  }, [id, onFilterCreated]);

  useEffect(() => {
    drawFragment();
  }, [scale, width, height, points]);

  function drawFragment() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!feImageRef.current) return;
    if (!feDisplacementMapRef.current) return;

    const context = canvas.getContext("2d");
    const w = Math.floor(canvasWidth * canvasDPI);
    const h = Math.floor(canvasHeight * canvasDPI);

    const data = new Uint8ClampedArray(w * h * 4);

    // Dynamic scale to make it as smooth as possible to ensure the best quality
    // but also meet the requirements of the shader.
    let maxScale = 0;
    const rawValues = [];
    
    // Première passe : calculer les déplacements et trouver maxScale
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const uvX = x / w;
        const uvY = y / h;
        
        const pos = fragment({
          x: uvX,
          y: uvY,
        });
        
        const dx = pos.x * w - x;
        const dy = pos.y * h - y;
        
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        rawValues.push(dx, dy);
      }
    }
    
    // Éviter la division par zéro et assurer une échelle minimale
    maxScale = Math.max(maxScale, 1.0);
    
    // Deuxième passe : normaliser et écrire les données
    let index = 0;
    for (let i = 0; i < data.length; i += 4) {
      const dx = rawValues[index++];
      const dy = rawValues[index++];
      
      const r = (dx / maxScale + 0.5);
      const g = (dy / maxScale + 0.5);
      
      // Clamper les valeurs entre 0 et 1 pour éviter les artefacts
      data[i] = Math.max(0, Math.min(255, r * 255));
      data[i + 1] = Math.max(0, Math.min(255, g * 255));
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
    
    context.putImageData(new ImageData(data, w, h), 0, 0);

    feImageRef.current.setAttribute("href", canvas.toDataURL());
    // feDisplacementMapRef.current.setAttribute("scale", scale);//maxScale / canvasDPI);
  }

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
        width={0}
        height={0}
        // style={{ display: "none" }}
      >
        <defs>
          <filter
            id={`${id}_filter`}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            // x="-10%"
            // y="-10%"
            // width="120%"
            // height="120%"
          >
            {/* <feFlood
              floodColor="#808000"
              result="flood"
              x={`${-Math.floor(width * 0.2)}px`}
              y={`${-Math.floor(height * 0.2)}px`}
              width={width * 1.4}
              height={height * 1.4}
            /> */}
            <feImage
              id={`${id}_map`}
              width={canvasWidth}
              height={canvasHeight}
              x={-20}
              y={-20}
              //   x={mousePosition.x - canvasWidth / 2}
              //   y={mousePosition.y - canvasHeight / 2}
              ref={feImageRef}
              result="imageMap"
              preserveAspectRatio="none"
            />
            {/* 
            <feMerge result="composed">
              <feMergeNode in="flood" />
              <feMergeNode in="imageMap" />
            </feMerge> */}

            <feDisplacementMap
              in="SourceGraphic"
              in2="imageMap"
              xChannelSelector="R"
              yChannelSelector="G"
              ref={feDisplacementMapRef}
              scale={5}
            />
          </filter>
        </defs>
      </svg>

      {/* Debug: Afficher le composite */}
      {debug && (
        <svg
          width={width}
          height={height}
          filterUnits="userSpaceOnUse"
          style={{ border: "1px solid red", margin: "10px" }}
        >
          <defs>
            <filter
              id={`${id}_debug_filter`}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
            >
              <feImage
                width={canvasWidth}
                height={canvasHeight}
                x="0"
                y="0"
                href={canvasRef.current?.toDataURL()}
                result="imageMap"
                preserveAspectRatio="none"
              />
            </filter>
          </defs>
          <rect
            width={canvasWidth}
            height={canvasHeight}
            filter={`url(#${id}_debug_filter)`}
            style={{ fill: "transparent" }}
          />
        </svg>
      )}
      <canvas
        width={canvasWidth * canvasDPI}
        height={canvasHeight * canvasDPI}
        ref={canvasRef}
        style={{
          display: debug ? "inline-block" : "none",
          width: canvasWidth,
          height: canvasHeight,
        }}
      />
      {children}
    </>
  );
}
