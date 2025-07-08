import DisplacementShader from "./DisplacementShader";
import { useState } from "react";

export default function SimpleButton({
  children,
  debug,
  onClick,
  style,
  activeLabel,
  inactiveLabel,
  scale = 10,
  intensity = 0.5,
}) {
  const [filterId, setFilterId] = useState("");
  return (
    <>
      <DisplacementShader
        width={60}
        height={30}
        debug={debug}
        scale={scale}
        intensity={intensity}
        fragment={(uv, points, buttonSize, intensity) => {
          // Simple ripple effect
          let totalDisplacementX = 0;
          let totalDisplacementY = 0;

          let normX = uv.x; //Math.floor(uv.x * 5) / 5;
          let normY = uv.y; //Math.floor(uv.y * 5) / 5;

          // normX *= normX;
          // normY *= normY;

          // normX *= 10;
          // normY *= 10;

          // let zoom = 1 + normX + normY;
          // zoom = Math.min(zoom, 10);
          let zoomX = 1 + normX * 10;
          let zoomY = 1 + normY * 10;

          const x = uv.x * -zoomX;
          const y = uv.y * -zoomY;

          return { x, y };
        }}
        onFilterCreated={setFilterId}
      ></DisplacementShader>

      <button
        style={{
          filter: filterId ? `url(#${filterId})` : "none",
          ...style,
        }}
      >
        Test
      </button>
    </>
  );
}
