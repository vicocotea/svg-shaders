"use client";

import BaseShader from "./BaseShader";
import { useShader } from "../hook/useShader";

export default function ShaderImage({
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
  const { feImageRef, feDisplacementMapRef, drawFragment } = useShader({
    fragment,
    canvasWidth: width,
    canvasHeight: height,
    scale,
    points,
  });

  const renderFilter = (id, canvasRef) => (
    <filter
      id={`${id}_filter`}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      x={-20}
      y={-20}
      width={width}
      height={height}
    >
      <feImage
        id={`${id}_map`}
        width={width}
        height={height}
        // x={-20}
        // y={-20}
        ref={feImageRef}
        result="imageMap"
        preserveAspectRatio="none"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="imageMap"
        xChannelSelector="R"
        yChannelSelector="G"
        ref={feDisplacementMapRef}
        scale={5}
      />
    </filter>
  );

  const renderDebugFilter = (id, canvasRef) => (
    <filter
      id={`${id}_debug_filter`}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
    >
      <feImage
        width={width}
        height={height}
        x="0"
        y="0"
        href={canvasRef.current?.toDataURL()}
        result="imageMap"
        preserveAspectRatio="none"
      />
    </filter>
  );

  return (
    <BaseShader
      width={width}
      height={height}
      debug={debug}
      style={style}
      fragment={fragment}
      children={children}
      onFilterCreated={onFilterCreated}
      canvasWidth={width}
      canvasHeight={height}
      renderFilter={renderFilter}
      renderDebugFilter={renderDebugFilter}
      dependencies={[scale, width, height, points]}
      drawFragment={drawFragment}
    />
  );
}
