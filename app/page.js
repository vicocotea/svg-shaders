"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

import sampleImage from "./sample.jpg";
import Shader from "./components/Shader";

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

export default function Page() {
  const [selectedShader, setShader] = useState("MagicCarpet");
  const [showDebug, setShowDebug] = useState(true);

  // Other ideas: raindrops, snowflakes, black hole, glitch, CRT, scanlines, etc...
  const SelectedShader = {
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
