import { useEffect, useRef, useState, useCallback } from "react";
import { useMotionValue, useSpring } from "motion/react";
import Shader from "./Shader";
import { texture } from "../utils/shader";

export default function Button({ children, debug, onClick, style, ...props }) {
  const [radius, setRadius] = useState(0.5);
  const [intensity, setIntensity] = useState(0.5);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [buttonSize, setButtonSize] = useState({ width: 200, height: 200 });

  const buttonRef = useRef();
  const [filterId, setFilterId] = useState("");

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 150,
    damping: 8,
    mass: 0.8,
    restDelta: 0.01,
  });
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const unsubscribe = springValue.onChange((value) => {
      setScale(value * 20);
    });

    // Nettoyer l'abonnement
    return unsubscribe;
  }, [springValue]);

  // Mesurer la taille réelle du bouton
  useEffect(() => {
    if (!buttonRef.current) return;

    const updateSize = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const newWidth = Math.max(1, Math.round(rect.width));
      const newHeight = Math.max(1, Math.round(rect.height));

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
      motionValue.set(1);
    },
    [motionValue]
  );

  const handlePointerUp = useCallback(() => {
    motionValue.set(0);
  }, [motionValue]);

  const handlePointerMove = useCallback((e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  }, []);

  useEffect(() => {
    if (!buttonRef.current) return;

    buttonRef.current.addEventListener("pointerdown", handlePointerDown);
    buttonRef.current.addEventListener("pointermove", handlePointerMove);
    buttonRef.current.addEventListener("pointerup", handlePointerUp);
    buttonRef.current.addEventListener("pointercancel", handlePointerUp);
    buttonRef.current.addEventListener("pointerleave", handlePointerUp);

    return () => {
      buttonRef.current.removeEventListener("pointerdown", handlePointerDown);
      buttonRef.current.removeEventListener("pointermove", handlePointerMove);
      buttonRef.current.removeEventListener("pointerup", handlePointerUp);
      buttonRef.current.removeEventListener("pointercancel", handlePointerUp);
      buttonRef.current.removeEventListener("pointerleave", handlePointerUp);
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
    <div>
      <Shader
        width={buttonSize.width}
        height={buttonSize.height}
        debug={debug}
        scale={scale}
        mousePosition={mousePosition} // Passer la position de la souris
        fragment={(uv) => {
          // Garder le centre à 0.5 pour la logique de base
          const centerX = 0.5;//mouse.x / buttonSize.width;
          const centerY = 0.5;//mouse.y / buttonSize.height;

          // Compenser l'aspect ratio pour garder un effet circulaire
          const aspectRatio = 1;//buttonSize.width / buttonSize.height;
          const adjustedX = (uv.x - centerX) * aspectRatio;
          const adjustedY = uv.y - centerY;

          const distance = Math.sqrt(adjustedX ** 2 + adjustedY ** 2);

          // Normaliser le rayon par rapport à la taille du canvas pour avoir une taille fixe
          const normalizedRadius = radius// / (buttonSize.height / 100);

          // Create spherical volume effect that attracts pixels towards center
          // Only apply effect within the defined radius to prevent overflow
          if (distance <= normalizedRadius) {
            const normalizedDistance = distance / normalizedRadius;
            const sphericalFactor = Math.cos(
              normalizedDistance * Math.PI * 0.5
            );
            const volumeEffect = Math.max(0, sphericalFactor) * intensity;

            const displacementFactor = 1; // Réduit pour éviter le débordement

            const value = -1; //animatedValue;
            // Change the sign to attract towards center instead of pushing away
            const displacementX =
              (centerX - uv.x) * volumeEffect * displacementFactor;
            const displacementY =
              (centerY - uv.y) * volumeEffect * displacementFactor;

            const x = Math.max(0, Math.min(1, uv.x + value * displacementX));
            const y = Math.max(0, Math.min(1, uv.y + value * displacementY));

            return texture(x, y);
          } else {
            // Outside the radius, return original texture without distortion
            return texture(uv.x, uv.y);
          }
        }}
        onFilterCreated={setFilterId}
      ></Shader>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="button"
        style={{
          filter: filterId ? `url(#${filterId})` : "none",
          ...style,
        }}
        {...props}
      >
        {children || "Click me"}
      </button>
    </div>
  );
}
