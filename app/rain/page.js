"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
// import { useAnimatedValue } from "../hook/animated-value";
import { motion, useMotionValue, useSpring, animate } from "motion/react";
import sampleImage from "../sample.jpg";

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
  const debugRef = useRef();
  const buttonRef = useRef();

  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseUsed = useRef(false);
  const [mouseDep, setMouseDep] = useState(0);
  const dropRef = useRef([]);

  useEffect(() => {
    const clientWidth = window.innerWidth;
    const clientHeight = window.innerHeight;

    dropRef.current.forEach((drop) => {
      drop.style.top = `${Math.random() * clientHeight}px`;
      drop.style.left = `${Math.random() * clientWidth}px`;
    });
  }, []);

  useEffect(() => {
    const handlePointerMove = (e) => {
      // console.log("handlePointerMove", e);

      // Obtenir la position du bouton
      const button = buttonRef.current;
      if (!button) return;
      
      const buttonRect = button.getBoundingClientRect();
      
      // Coordonnées normalisées (0-1) relatives au bouton
      const mouseX = Math.max(0, Math.min(1, (e.clientX - buttonRect.left) / buttonRect.width));
      const mouseY = Math.max(0, Math.min(1, (e.clientY - buttonRect.top) / buttonRect.height));

      // Ajuster les coordonnées pour tenir compte du facteur d'échelle
      // Le bouton fait 100x100 mais le canvas fait 200x200 (facteur 2)
      const scaleFactor = width / 100; // width est la taille du canvas, 100 est la taille du bouton
      
      mouseRef.current = {
        x: mouseX * scaleFactor,
        y: mouseY * scaleFactor,
      };

      if (mouseUsed.current) {
        setMouseDep((d) => d + 1);
      }

      // dropRef.current.forEach((drop) => {
      //   drop.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      // });
    };

    const handlePointerLeave = () => {
      // Réinitialiser à la position centrale quand la souris quitte la fenêtre
      const scaleFactor = width / 100;
      mouseRef.current = { x: 0.5 * scaleFactor, y: 0.5 * scaleFactor };
      setMouseDep((d) => d + 1);
    };

    document.documentElement.addEventListener("pointermove", handlePointerMove);
    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    return () => {
      document.documentElement.removeEventListener(
        "pointermove",
        handlePointerMove
      );
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
    };
  }, [width]);

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
    // context.fillStyle = "rgb(255, 0, 0)"; // couleur du texte

    // for(let i = 0; i < 20; i++) {
    //   context.fillStyle = `rgb(${255 - i * 10}, ${i * 10}, 0)`; // couleur du texte
    //   context.fillText("Bonjour !", 0, 50 + i * 2);
    // }

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
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
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

      <button
        ref={buttonRef}
        style={{
          position: "relative",
          color: "white",
          padding: 0,
          fontSize: "1rem",
          fontWeight: "bold",
          cursor: "pointer",
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          width: "100px",
          height: "100px",
          filter: `url(#${id}_filter)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            borderRadius: "1rem",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            borderRadius: "16px",
            backgroundColor: "black",
          }}
        ></div>

        <div
          style={{
            position: "absolute",
            borderRadius: "1rem",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            borderRadius: "1rem",
            backgroundColor: "red",
          }}
        ></div>
        <span
          style={{
            position: "relative",
          }}
        >
          Click me
        </span>
      </button>

      {/* {Array.from({ length: 1 }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) {
              dropRef.current.push(el);
            }
          }}
          className="drop"
          style={{
            width: "100px",
            height: "100px",
            overflow: "hidden",
            position: "fixed",
            pointerEvents: "none",
            top: "-50px",
            left: "-50px",
            backdropFilter: `url(#${id}_filter)`,
            ...style,
          }}
        ></div>
      ))} */}

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

  const motionValue = useMotionValue(0);
  const [isDown, setIsDown] = useState(false);
  const springValue = useSpring(motionValue, {
    stiffness: 150,
    damping: 8,
    mass: 0.8,
    restDelta: 0.01,
  });
  const [animatedValue, setAnimatedValue] = useState(0);

  // Suivre la valeur animée
  useEffect(() => {
    return springValue.onChange(setAnimatedValue);
  }, [springValue]);

  // Ajouter un event listener pour les clics sur la page
  useEffect(() => {
    if (!buttonRef.current) return;

    const handlePointerDown = () => {
      // Animer vers -1 au pointerdown avec le spring rapide
      setIsDown(true);
      motionValue.set(-1);
    };

    const handlePointerUp = () => {
      // Revenir à 0 au pointerup avec le spring élastique
      setIsDown(false);
      motionValue.set(0);
    };

    buttonRef.current.addEventListener("pointerdown", handlePointerDown);
    buttonRef.current.addEventListener("pointerup", handlePointerUp);

    return () => {
      buttonRef.current.removeEventListener("pointerdown", handlePointerDown);
      buttonRef.current.removeEventListener("pointerup", handlePointerUp);
    };
  }, [motionValue]);

  return (
    <>
      <Shader
        width={200}
        height={200}
        debug={debug}
        fragment={(uv, mouse) => {
          // mouse.x et mouse.y sont déjà normalisées (0-1) relatives au bouton
          const centerX = 0.5;
          const centerY = 0.5;
          const distance = Math.sqrt(
            (uv.x - centerX) ** 2 + (uv.y - centerY) ** 2
          );

          // Create spherical volume effect that attracts pixels towards center
          // Use a cosine-based function to create a more natural spherical distortion
          const normalizedDistance = Math.min(distance / radius, 1);
          const sphericalFactor = Math.cos(normalizedDistance * Math.PI * 0.5);
          const volumeEffect = Math.max(0, sphericalFactor) * intensity;

          const displacementFactor = 1; // Réduit pour éviter le débordement

          const value = animatedValue;
          // Change the sign to attract towards center instead of pushing away
          const displacementX =
            (uv.x - centerX) * volumeEffect * displacementFactor;
          const displacementY =
            (uv.y - centerY) * volumeEffect * displacementFactor;

          const x = Math.max(0, Math.min(1, uv.x + value * displacementX));
          const y = Math.max(0, Math.min(1, uv.y + value * displacementY));

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

function ButtonRadial({ children, debug, onClick, style, ...props }) {
  const [radius, setRadius] = useState(0.5);
  const [intensity, setIntensity] = useState(0.5);

  const motionValue = useMotionValue(0);
  const [isDown, setIsDown] = useState(false);
  const springValue = useSpring(motionValue, {
    stiffness: 150,
    damping: 8,
    mass: 0.8,
    restDelta: 0.01,
  });
  const [animatedValue, setAnimatedValue] = useState(0);
  const buttonRef = useRef();

  // Suivre la valeur animée
  useEffect(() => {
    return springValue.onChange(setAnimatedValue);
  }, [springValue]);

  // Ajouter un event listener pour les clics sur la page
  useEffect(() => {
    if (!buttonRef.current) return;

    const handlePointerDown = () => {
      // Animer vers -1 au pointerdown avec le spring rapide
      setIsDown(true);
      motionValue.set(-1);
    };

    const handlePointerUp = () => {
      // Revenir à 0 au pointerup avec le spring élastique
      setIsDown(false);
      motionValue.set(0);
    };

    buttonRef.current.addEventListener("pointerdown", handlePointerDown);
    buttonRef.current.addEventListener("pointerup", handlePointerUp);

    return () => {
      buttonRef.current.removeEventListener("pointerdown", handlePointerDown);
      buttonRef.current.removeEventListener("pointerup", handlePointerUp);
    };
  }, [motionValue]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      console.log("Button clicked!");
    }
  };

  return (
    <>
      <Shader
        width={200}
        height={200}
        debug={debug}
        fragment={(uv, mouse) => {
          // mouse.x et mouse.y sont déjà normalisées (0-1) relatives au bouton
          const centerX = 0.5;
          const centerY = 0.5;
          const distance = Math.sqrt(
            (uv.x - centerX) ** 2 + (uv.y - centerY) ** 2
          );

          // Create spherical volume effect that attracts pixels towards center
          // Use a cosine-based function to create a more natural spherical distortion
          const normalizedDistance = Math.min(distance / radius, 1);
          const sphericalFactor = Math.cos(normalizedDistance * Math.PI * 0.5);
          const volumeEffect = Math.max(0, sphericalFactor) * intensity;

          const displacementFactor = 1; // Réduit pour éviter le débordement

          const value = animatedValue;
          // Change the sign to attract towards center instead of pushing away
          const displacementX =
            (uv.x - centerX) * volumeEffect * displacementFactor;
          const displacementY =
            (uv.y - centerY) * volumeEffect * displacementFactor;

          const x = Math.max(0, Math.min(1, uv.x + value * displacementX));
          const y = Math.max(0, Math.min(1, uv.y + value * displacementY));

          return texture(x, y);
        }}
      >
        <button
          ref={buttonRef}
          onClick={handleClick}
          style={{
            position: "relative",
            color: "white",
            padding: "12px 24px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            borderRadius: "8px",
            minWidth: "120px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...style,
          }}
          {...props}
        >
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              borderRadius: "8px",
              backgroundColor: "#3b82f6",
              transition: "background-color 0.2s ease",
            }}
          ></div>
          <span
            style={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {children || "Click me"}
          </span>
        </button>
      </Shader>
    </>
  );
}

export default function Page() {
  const [selectedShader, setShader] = useState("RadialGradient");
  const [showDebug, setShowDebug] = useState(true);

  // Other ideas: raindrops, snowflakes, black hole, glitch, CRT, scanlines, etc...
  const SelectedShader = {
    RadialGradient,
    ButtonRadial,
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
          <option value="ButtonRadial">Shader: Button Radial</option>
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
      <SelectedShader debug={showDebug}></SelectedShader>

      <div style={{ marginTop: 40, lineHeight: 1.6 }}>
        <h2>Lorem Ipsum - Texte de démonstration</h2>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>

        <p>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae
          ab illo inventore veritatis et quasi architecto beatae vitae dicta
          sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
          aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos
          qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui
          dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed
          quia non numquam eius modi tempora incidunt ut labore et dolore magnam
          aliquam quaerat voluptatem.
        </p>

        <p>
          Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
          suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis
          autem vel eum iure reprehenderit qui in ea voluptate velit esse quam
          nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo
          voluptas nulla pariatur? At vero eos et accusamus et iusto odio
          dignissimos ducimus qui blanditiis praesentium voluptatum deleniti
          atque corrupti quos dolores et quas molestias excepturi sint occaecati
          cupiditate non provident, similique sunt in culpa qui officia deserunt
          mollitia animi, id est laborum et dolorum fuga.
        </p>

        <p>
          Et harum quidem rerum facilis est et expedita distinctio. Nam libero
          tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo
          minus id quod maxime placeat facere possimus, omnis voluptas assumenda
          est, omnis dolor repellendus. Temporibus autem quibusdam et aut
          officiis debitis aut rerum necessitatibus saepe eveniet ut et
          voluptates repudiandae sint et molestiae non recusandae. Itaque earum
          rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus
          maiores alias consequatur aut perferendis doloribus asperiores
          repellat.
        </p>

        <p>
          On the other hand, we denounce with righteous indignation and dislike
          men who are so beguiled and demoralized by the charms of pleasure of
          the moment, so blinded by desire, that they cannot foresee the pain
          and trouble that are bound to ensue; and equal blame belongs to those
          who fail in their duty through weakness of will, which is the same as
          saying through shrinking from toil and pain. These cases are perfectly
          simple and easy to distinguish. In a free hour, when our power of
          choice is untrammelled and when nothing prevents our being able to do
          what we like best, every pleasure is to be welcomed and every pain
          avoided.
        </p>

        <p>
          But in certain circumstances and owing to the claims of duty or the
          obligations of business it will frequently occur that pleasures have
          to be repudiated and annoyances accepted. The wise man therefore
          always holds in these matters to this principle of selection: he
          rejects pleasures to secure other greater pleasures, or else he
          endures pains to avoid worse pains. The standard chunk of Lorem Ipsum
          used since the 1500s is reproduced below for those interested.
          Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by
          Cicero are also reproduced in their exact original form, accompanied
          by English versions from the 1914 translation by H. Rackham.
        </p>

        <p>
          There are many variations of passages of Lorem Ipsum available, but
          the majority have suffered alteration in some form, by injected
          humour, or randomised words which don't look even slightly believable.
          If you are going to use a passage of Lorem Ipsum, you need to be sure
          there isn't anything embarrassing hidden in the middle of text. All
          the Lorem Ipsum generators on the Internet tend to repeat predefined
          chunks as necessary, making this the first true generator on the
          Internet. It uses a dictionary of over 200 Latin words, combined with
          a handful of model sentence structures, to generate Lorem Ipsum which
          looks reasonable.
        </p>

        <p>
          The generated Lorem Ipsum is therefore always free from repetition,
          injected humour, or non-characteristic words etc. Contrary to popular
          belief, Lorem Ipsum is not simply random text. It has roots in a piece
          of classical Latin literature from 45 BC, making it over 2000 years
          old. Richard McClintock, a Latin professor at Hampden-Sydney College
          in Virginia, looked up one of the more obscure Latin words,
          consectetur, from a Lorem Ipsum passage, and going through the cites
          of the word in classical literature, discovered the undoubtable
          source.
        </p>

        <p>
          Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus
          Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written
          in 45 BC. This book is a treatise on the theory of ethics, very
          popular during the Renaissance. The first line of Lorem Ipsum, "Lorem
          ipsum dolor sit amet..", comes from a line in section 1.10.32. The
          standard chunk of Lorem Ipsum used since the 1500s is reproduced below
          for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus
          Bonorum et Malorum" by Cicero are also reproduced in their exact
          original form, accompanied by English versions from the 1914
          translation by H. Rackham.
        </p>

        <p>
          It is a long established fact that a reader will be distracted by the
          readable content of a page when looking at its layout. The point of
          using Lorem Ipsum is that it has a more-or-less normal distribution of
          letters, as opposed to using 'Content here, content here', making it
          look like readable English. Many desktop publishing packages and web
          page editors now use Lorem Ipsum as their default model text, and a
          search for 'lorem ipsum' will uncover many web sites still in their
          infancy. Various versions have evolved over the years, sometimes by
          accident, sometimes on purpose (injected humour and the like).
        </p>

        <p>
          Where does it come from? Contrary to popular belief, Lorem Ipsum is
          not simply random text. It has roots in a piece of classical Latin
          literature from 45 BC, making it over 2000 years old. Richard
          McClintock, a Latin professor at Hampden-Sydney College in Virginia,
          looked up one of the more obscure Latin words, consectetur, from a
          Lorem Ipsum passage, and going through the cites of the word in
          classical literature, discovered the undoubtable source. Lorem Ipsum
          comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et
          Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC.
        </p>
      </div>
    </>
  );
}
