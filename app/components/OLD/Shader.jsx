"use client";

import { useEffect, useRef, useState } from "react";
import BaseShader from "./BaseShader";
import { useShader } from "../hook/useShader";

const radius = 100;
const canvasWidth = radius * 2;
const canvasHeight = radius * 2;

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
}) {
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [mouseDep, setMouseDep] = useState(0);

  const { feImageRef, feDisplacementMapRef, drawFragment } = useShader({
    fragment,
    canvasWidth,
    canvasHeight,
    scale,
  });

  useEffect(() => {
    mouseRef.current.x = mousePosition.x;
    mouseRef.current.y = mousePosition.y;
    setMouseDep((prev) => prev + 1);
  }, [mousePosition.x, mousePosition.y]);

  const renderFilter = (id, canvasRef) => (
    <filter
      id={`${id}_filter`}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      x="-10%"
      y="-10%"
      width="120%"
      height="120%"
    >
      <feFlood
        floodColor="#808000"
        result="flood"
        x={`${-Math.floor(width * 0.2)}px`}
        y={`${-Math.floor(height * 0.2)}px`}
        width={width * 1.4}
        height={height * 1.4}
      />
      <feImage
        id={`${id}_map`}
        width={canvasWidth}
        height={canvasHeight}
        x={mousePosition.x - canvasWidth / 2}
        y={mousePosition.y - canvasHeight / 2}
        ref={feImageRef}
        result="imageMap"
        preserveAspectRatio="none"
      />
      <feMerge result="composed">
        <feMergeNode in="flood" />
        <feMergeNode in="imageMap" />
      </feMerge>
      <feDisplacementMap
        in="SourceGraphic"
        in2="composed"
        xChannelSelector="R"
        yChannelSelector="G"
        ref={feDisplacementMapRef}
        scale={scale}
      />
    </filter>
  );

  const renderDebugFilter = (id, canvasRef) => (
    <filter
      id={`${id}_debug_filter`}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
    >
      <feFlood
        floodColor="#808000"
        result="flood"
        x={`${-Math.floor(width * 0.2)}px`}
        y={`${-Math.floor(height * 0.2)}px`}
        width={width * 1.4}
        height={height * 1.4}
      />
      <feImage
        width={canvasWidth}
        height={canvasHeight}
        x={mousePosition.x - canvasWidth / 2}
        y={mousePosition.y - canvasHeight / 2}
        href={canvasRef.current?.toDataURL()}
        result="imageMap"
        preserveAspectRatio="none"
      />
      <feMerge result="composed">
        <feMergeNode in="flood" />
        <feMergeNode in="imageMap" />
      </feMerge>
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
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      renderFilter={renderFilter}
      renderDebugFilter={renderDebugFilter}
      dependencies={[scale, mouseDep]}
      drawFragment={drawFragment}
    />
  );
}
