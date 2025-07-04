"use client";

import { useEffect, useId, useRef } from "react";

const canvasDPI = 1;

export default function BaseShader({
  width = 100,
  height = 100,
  debug,
  children,
  onFilterCreated,
  canvasWidth,
  canvasHeight,
  renderFilter,
  renderDebugFilter,
  dependencies = [],
  drawFragment,
}) {
  const id = useId().replace(/[#:]/g, "-");
  const canvasRef = useRef();

  // Notify parent component of the filter ID
  useEffect(() => {
    if (onFilterCreated) {
      onFilterCreated(`${id}_filter`);
    }
  }, [id, onFilterCreated]);

  // Trigger fragment drawing when dependencies change
  useEffect(() => {
    if (drawFragment) {
      drawFragment(canvasRef.current, id);
    }
  }, dependencies);

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
          {renderFilter(id, canvasRef)}
        </defs>
      </svg>

      {/* Debug: Afficher le composite */}
      {debug && (
        <svg
          width={width}
          height={height}
          filterUnits="userSpaceOnUse"
        >
          <defs>
            {renderDebugFilter(id, canvasRef)}
          </defs>
          <rect
            width={canvasWidth || width}
            height={canvasHeight || height}
            filter={`url(#${id}_debug_filter)`}
            style={{ fill: "transparent" }}
          />
        </svg>
      )}
      
      <canvas
        width={(canvasWidth || width) * canvasDPI}
        height={(canvasHeight || height) * canvasDPI}
        ref={canvasRef}
        style={{
          display: "none",
          width: canvasWidth || width,
          height: canvasHeight || height,
        }}
      />
      {children}
    </>
  );
} 