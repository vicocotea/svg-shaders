"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

import sampleImage from "./sample.jpg";

// TODO: We can add more custom functions here to adjust the actual color
// in a declarative way (i.e. by leveraging the `type` field here). The implementation
// can be based on the <feColorMatrix> filter primitive and others.
function texture(x, y) {
  return {
    type: "t",
    x,
    y,
  };
}

// Making this higher will improve the quality (resolution) of the displacement
// map but decrease performance.
const canvasDPI = 1.2;

function Shader({
  width = 100,
  height = 100,
  debug,
  style,
  fragment,
  children,
}) {
  const id = useId().replace(/[#:]/g, "-");
  const canvasRef = useRef();
  const feImageRef = useRef();
  const feDisplacementMapRef = useRef();
  const containerRef = useRef();
  const debugRef = useRef();

  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseUsed = useRef(false);
  const [mouseDep, setMouseDep] = useState(0);
  const [containerPosition, setContainerPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e) => {
      console.log("handlePointerMove", e);
      const rect = container.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;

      mouseRef.current = {
        x: mouseX,
        y: mouseY,
      };

      // Make container follow mouse position
      setContainerPosition({
        x: e.clientX - width / 2,
        y: e.clientY - height / 2,
      });

      if (mouseUsed.current) {
        setMouseDep((d) => d + 1);
      }
    };

    document.documentElement.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.documentElement.removeEventListener(
        "pointermove",
        handlePointerMove
      );
    };
  }, [width, height]);

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

    mouseUsed.current = false;

    const w = width * canvasDPI;
    const h = height * canvasDPI;
    const data = new Uint8ClampedArray(w * h * 4);

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
    context.putImageData(new ImageData(data, w, h), 0, 0);

    // // Définir le style du texte
    // context.font = "40px Arial"; // taille et police
    // context.fontWeight = "bold";
    // context.fillStyle = "black"; // couleur du texte

    // // Écrire le texte
    // context.fillText("Bonjour !", 50, 50);
    // context.fillText("Bonjour !", 50, 100);
    // context.fillText("Bonjour !", 50, 150);
    // context.fillText("Bonjour !", 50, 200);
    // context.fillText("Bonjour !", 50, 250);
    // context.fillText("Bonjour !", 50, 300);
    // context.fillText("Bonjour !", 50, 350);
    // context.fillText("Bonjour !", 50, 400);
    // context.fillText("Bonjour !", 50, 450);
    // context.fillText("Bonjour !", 50, 500);
    // context.fillText("Bonjour !", 50, 550);
    // context.fillText('Bonjour Canvas !', 50, 100);

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
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <feImage
              id={`${id}_map`}
              width={width}
              height={height}
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
      <a href="https://www.google.com" className="button">
        Google
      </a>
      <div
        ref={containerRef}
        style={{
          width,
          height,
          overflow: "hidden",
          position: "fixed",
          pointerEvents: "none",
          top: 0,
          left: 0,
          backdropFilter: `url(#${id}_filter)`,
          transform: `translate(${containerPosition.x}px, ${containerPosition.y}px)`,
          ...style,
        }}
      ></div>
      {children}
      {debug ? (
        <p
          style={{ marginBottom: "0.2em", fontVariantNumeric: "tabular-nums" }}
        >
          <small ref={debugRef}>Displacement Map</small>
        </p>
      ) : null}
      <canvas
        width={width * canvasDPI}
        height={height * canvasDPI}
        ref={canvasRef}
        style={{ display: debug ? "inline-block" : "none", width, height }}
      />
    </>
  );
}

function MagicCarpet({ children, debug }) {
  const [rotation, setRotation] = useState(36);
  const [wave, setWave] = useState(0.6);

  return (
    <>
      <Shader
        width={240}
        height={240}
        debug={debug}
        fragment={(uv, mouse) => {
          // Rotate X degrees around the center
          const angle = (rotation * Math.PI) / 180;

          // Apply wave effect based on mouse position
          const offsetX = Math.sin((uv.y + mouse.y) * wave * 5) * 0.1;
          const offsetY = Math.sin((uv.x + mouse.x) * wave * 5) * 0.1;

          const x =
            (uv.x - 0.5 + offsetX) * Math.cos(angle) -
            (uv.y - 0.5 + offsetY) * Math.sin(angle);
          const y =
            (uv.x - 0.5 + offsetX) * Math.sin(angle) +
            (uv.y - 0.5 + offsetY) * Math.cos(angle);
          return texture(x + 0.5, y + 0.5);
        }}
      >
        {children}
      </Shader>
      <br />
      <fieldset>
        <legend>Rotation</legend>
        <input
          type="range"
          value={rotation}
          min={0}
          max={360}
          onChange={(e) => setRotation(e.target.value)}
        />
      </fieldset>
      <fieldset>
        <legend>Wave</legend>
        <input
          type="range"
          value={wave}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) => setWave(e.target.value)}
        />
      </fieldset>
    </>
  );
}

function Pixelate({ children, debug }) {
  const [size, setSize] = useState(20);

  return (
    <>
      <Shader
        width={240}
        height={240}
        debug={debug}
        fragment={(uv) => {
          // Round to the nearest multiple of `size`
          const x = Math.round(uv.x * size) / size;
          const y = Math.round(uv.y * size) / size;
          return texture(x, y);
        }}
      >
        {children}
      </Shader>
      <br />
      <fieldset>
        <legend>Size</legend>
        <input
          type="range"
          value={size}
          min={15}
          max={100}
          onChange={(e) => setSize(e.target.value)}
        />
      </fieldset>
    </>
  );
}

function Noise({ children, debug }) {
  const [size, setSize] = useState(20);

  return (
    <>
      <Shader
        width={240}
        height={240}
        debug={debug}
        fragment={(uv, mouse) => {
          // Apply a random offset to each pixel
          // If it's close to the mouse, the offset is smaller
          const dist = ((uv.x - mouse.x) ** 2 + (uv.y - mouse.y) ** 2) ** 0.5;
          const factor = size * (dist <= 0.1 ? 0 : (dist - 0.1) ** 2);

          const x = uv.x + ((Math.random() - 0.5) * factor) / 100;
          const y = uv.y + ((Math.random() - 0.5) * factor) / 100;
          return texture(x, y);
        }}
      >
        {children}
      </Shader>
      <br />
      <fieldset>
        <legend>Size</legend>
        <input
          type="range"
          value={size}
          min={5}
          max={30}
          onChange={(e) => setSize(e.target.value)}
        />
      </fieldset>
    </>
  );
}

function Fractal({ children, debug }) {
  const [size, setSize] = useState(5);

  return (
    <>
      <Shader
        width={240}
        height={240}
        debug={debug}
        fragment={(uv) => {
          const x = (uv.x * size) % 1;
          const y = (uv.y * size) % 1;
          return texture(x, y);
        }}
      >
        {children}
      </Shader>
      <br />
      <fieldset>
        <legend>Size</legend>
        <input
          type="range"
          value={size}
          min={1}
          max={8}
          onChange={(e) => setSize(e.target.value)}
        />
      </fieldset>
    </>
  );
}

function Spiral({ children, debug }) {
  const [size, setSize] = useState(10);

  return (
    <>
      <Shader
        width={240}
        height={240}
        debug={debug}
        fragment={(uv) => {
          const x = uv.x - 0.5;
          const y = uv.y - 0.5;
          const r = Math.sqrt(x ** 2 + y ** 2);
          const theta = Math.atan2(y, x);
          const angle = theta + (r * size) / 10;
          const nx = Math.cos(angle) * r + 0.5;
          const ny = Math.sin(angle) * r + 0.5;
          return texture(nx, ny);
        }}
      >
        {children}
      </Shader>
      <br />
      <fieldset>
        <legend>Size</legend>
        <input
          type="range"
          value={size}
          min={0}
          max={200}
          onChange={(e) => setSize(e.target.value)}
        />
      </fieldset>
    </>
  );
}

function RadialGradient({ children, debug }) {
  const [radius, setRadius] = useState(0.5);
  const [intensity, setIntensity] = useState(0.5);

  return (
    <>
      <Shader
        width={240}
        height={240}
        debug={debug}
        fragment={(uv, mouse) => {
          // Calculate distance from center
          const centerX = 0.5;
          const centerY = 0.5;
          const distance = Math.sqrt(
            (uv.x - centerX) ** 2 + (uv.y - centerY) ** 2
          );

          // Create spherical volume effect
          // Use a cosine-based function to create a more natural spherical distortion
          const normalizedDistance = Math.min(distance / radius, 1);
          const sphericalFactor = Math.cos(normalizedDistance * Math.PI * 0.5);
          const volumeEffect = Math.max(0, sphericalFactor) * intensity;

          const displacementFactor = 1;

          const displacementX =
            -(uv.x - centerX) * volumeEffect * displacementFactor;
          const displacementY =
            -(uv.y - centerY) * volumeEffect * displacementFactor;

          const x = uv.x + displacementX;
          const y = uv.y + displacementY;

          return texture(x, y);
        }}
      >
        {children}
      </Shader>
      <br />
      <fieldset>
        <legend>Radius</legend>
        <input
          type="range"
          value={radius}
          min={0.1}
          max={0.8}
          step={0.01}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
        />
      </fieldset>
      <fieldset>
        <legend>Intensity</legend>
        <input
          type="range"
          value={intensity}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
        />
      </fieldset>
    </>
  );
}

export default function Page() {
  const [selectedShader, setShader] = useState("RadialGradient");
  const [showDebug, setShowDebug] = useState(true);

  // Other ideas: raindrops, snowflakes, black hole, glitch, CRT, scanlines, etc...
  const SelectedShader = {
    RadialGradient,
    MagicCarpet,
    Pixelate,
    Noise,
    Fractal,
    Spiral,
  }[selectedShader];

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 20,
          fontSize: ".85em",
        }}
      >
        <select onChange={(e) => setShader(e.target.value)}>
          <option value="RadialGradient">Shader: Radial Gradient</option>
          <option value="MagicCarpet">Shader: Magic Carpet</option>
          <option value="Noise">Shader: Noise</option>
          <option value="Pixelate">Shader: Pixelate</option>
          <option value="Fractal">Shader: Fractal</option>
          <option value="Spiral">Shader: Spiral</option>
        </select>
        <label
          style={{
            display: "flex",
            gap: 5,
            alignItems: "center",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
          />
          <span>Debug</span>
        </label>
      </div>
      <SelectedShader debug={showDebug}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "yellow",
            borderRadius: 30,
            width: 210,
            height: 210,
            padding: 20,
            margin: 10,
            border: "1px solid #ccc",
            boxShadow: "0 5px 10px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <Image
              src={sampleImage}
              alt="Sample"
              width={40}
              height={40}
              style={{
                borderRadius: 50,
              }}
            />
            <h1 style={{ fontSize: "1.5em" }}>Hello!</h1>
          </div>
          <input type="range" />
          <input
            type="text"
            placeholder="Type here"
            style={{
              width: "100%",
              fontSize: "1em",
              height: "2em",
            }}
          />
          <marquee style={{ margin: 0 }}>
            This site uses cookies. Opt-out if you wish.
          </marquee>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <button>Accept</button>
            <button>Decline</button>
          </div>
        </div>
      </SelectedShader>
    </>
  );
}
