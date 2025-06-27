"use client";

import { useEffect, useState } from "react";
import BaseShader from "./BaseShader";
import { useShader } from "../hook/useShader";

export default function WaveShader({
  width = 100,
  height = 100,
  debug,
  style,
  amplitude = 20,
  frequency = 0.02,
  speed = 0.001,
  children,
  onFilterCreated,
}) {
  const [time, setTime] = useState(0);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + speed);
    }, 16);
    return () => clearInterval(interval);
  }, [speed]);

  const { feImageRef, feDisplacementMapRef, drawFragment } = useShader({
    fragment: ({ x, y }) => ({
      x: x + Math.sin(y * frequency + time) * amplitude / width,
      y: y,
    }),
    canvasWidth: width,
    canvasHeight: height,
  });

  const renderFilter = (id, canvasRef) => (
    <filter
      id={`${id}_filter`}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
    >
      <feImage
        id={`${id}_map`}
        width={width}
        height={height}
        x="0"
        y="0"
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
        scale={amplitude}
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
      children={children}
      onFilterCreated={onFilterCreated}
      canvasWidth={width}
      canvasHeight={height}
      renderFilter={renderFilter}
      renderDebugFilter={renderDebugFilter}
      dependencies={[time, amplitude, frequency]}
      drawFragment={drawFragment}
    />
  );
} 