import { useEffect, useRef, useState, useCallback } from "react";
import { useMotionValue, useSpring } from "motion/react";
import Shader from "./Shader";
import { texture } from "../utils/shader";

export default function ButtonRadial({
  children,
  debug,
  onClick,
  style,
  ...props
}) {
  const [radius, setRadius] = useState(0.5);
  const [intensity, setIntensity] = useState(0.5);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [buttonSize, setButtonSize] = useState({ width: 200, height: 200 });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 150,
    damping: 8,
    mass: 0.8,
    restDelta: 0.01,
  });
  const [animatedValue, setAnimatedValue] = useState(0);
  const buttonRef = useRef();
  const [filterId, setFilterId] = useState("");

  // Suivre la valeur animée
  useEffect(() => {
    return springValue.onChange(setAnimatedValue);
  }, [springValue]);

  // Mesurer la taille réelle du bouton
  useEffect(() => {
    if (!buttonRef.current) return;

    const updateSize = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const newWidth = Math.max(1, Math.floor(rect.width));
      const newHeight = Math.max(1, Math.floor(rect.height));

      console.log("Button size updated:", newWidth, newHeight);

      setButtonSize({
        width: newWidth,
        height: newHeight,
      });
    };

    updateSize();

    // Utiliser ResizeObserver pour une mesure plus précise
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(buttonRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Gérer les événements de pointeur
  const handlePointerDown = useCallback(
    (e) => {
      if (!buttonRef.current) return;

      // Calculer la position relative au bouton
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left; // / rect.width;
      const y = e.clientY - rect.top; // / rect.height;

      console.log("Mouse position (normalized):", x, y);
      // Mettre à jour la position de la souris (normalisée 0-1)
      setMousePosition({
        //   x: Math.max(0, Math.min(1, x)),
        //   y: Math.max(0, Math.min(1, y))
        x,
        y,
      });

      motionValue.set(-1);
    },
    [motionValue]
  );

  const handlePointerUp = useCallback(() => {
    motionValue.set(0);
  }, [motionValue]);

  useEffect(() => {
    if (!buttonRef.current) return;

    buttonRef.current.addEventListener("pointerdown", handlePointerDown);
    buttonRef.current.addEventListener("pointerup", handlePointerUp);

    return () => {
      buttonRef.current.removeEventListener("pointerdown", handlePointerDown);
      buttonRef.current.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerDown, handlePointerUp]);

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
        width={buttonSize.width}
        height={buttonSize.height}
        debug={debug}
        mousePosition={mousePosition} // Passer la position de la souris
        fragment={(uv, mouse) => {
          // Garder le centre à 0.5 pour la logique de base
          const centerX = 0.5;
          const centerY = 0.5;

          // Compenser l'aspect ratio pour garder un effet circulaire
          const aspectRatio = buttonSize.width / buttonSize.height;
          const adjustedX = (uv.x - centerX) * aspectRatio;
          const adjustedY = uv.y - centerY;

          const distance = Math.sqrt(adjustedX ** 2 + adjustedY ** 2);

          // Create spherical volume effect that attracts pixels towards center
          // Use a cosine-based function to create a more natural spherical distortion
          const normalizedDistance = Math.min(distance / radius, 1);
          const sphericalFactor = Math.cos(normalizedDistance * Math.PI * 0.5);
          const volumeEffect = Math.max(0, sphericalFactor) * intensity;

          const displacementFactor = 1; // Réduit pour éviter le débordement

          const value = animatedValue;
          // Change the sign to attract towards center instead of pushing away
          const displacementX =
            (centerX - uv.x) * volumeEffect * displacementFactor;
          const displacementY =
            (centerY - uv.y) * volumeEffect * displacementFactor;

          const x = Math.max(0, Math.min(1, uv.x + value * displacementX));
          const y = Math.max(0, Math.min(1, uv.y + value * displacementY));

          return texture(x, y);
        }}
        onFilterCreated={setFilterId}
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
            backgroundColor: "red",
            borderRadius: "8px",
            minWidth: "120px",
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: filterId ? `url(#${filterId})` : "none",
            ...style,
          }}
          {...props}
        >
          {children || "Click me"}
        </button>
      </Shader>
    </>
  );
}
