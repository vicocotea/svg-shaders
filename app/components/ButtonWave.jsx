import { useEffect, useRef, useState, useCallback } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { texture } from "../utils/shader";
import ShaderImage from "./ShaderImage";
import WaveShader from "./WaveShader";

export default function ButtonCircle({
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

  const buttonRef = useRef();
  const [filterId, setFilterId] = useState("");
  const [points, setPoints] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // Animation des points avec leur life
  useEffect(() => {
    if (points.length === 0) return;

    let animationId;

    const animatePoints = () => {
      setPoints(
        (prevPoints) =>
          prevPoints
            .map((point) => ({
              ...point,
              life: Math.min(100, point.life + 1), // Décrémenter life
            }))
            .filter((point) => point.life < 100) // Supprimer les points avec life <= 0
      );

      animationId = requestAnimationFrame(animatePoints);
    };

    animationId = requestAnimationFrame(animatePoints);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [points.length]);

  // Mesurer la taille réelle du bouton
  useEffect(() => {
    if (!buttonRef.current) return;

    const updateSize = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const newWidth = Math.max(1, Math.round(rect.width)) + 40;
      const newHeight = Math.max(1, Math.round(rect.height)) + 40;

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
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normaliser les coordonnées UV (0-1)
      const uvX = (x + 20) / (rect.width + 40);
      const uvY = (y + 20) / (rect.height + 40);

      setPoints([...points, { x: uvX, y: uvY, life: 0 }]);
      setIsActive(!isActive);
    },
    [points]
  );

  const handlePointerUp = useCallback(() => {
    // motionValue.set(0);
  }, []);

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

  //   useEffect(() => {
  //     console.log("points", points);
  //   }, [points]);

  return (
    <div>
      <WaveShader
        width={buttonSize.width}
        height={buttonSize.height}
        debug={debug}
        scale={0}
        mousePosition={mousePosition}
        points={points}
        onFilterCreated={setFilterId}
      ></WaveShader>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`button ${isActive ? "toggle" : ""}`}
        style={{
          filter: filterId ? `url(#${filterId})` : "none",
          ...style,
        }}
        {...props}
      >
        {children || "Click me"}
        {points.map((point, index) => (
          <span key={index} className="button-point" style={{
            left: point.x * buttonSize.width - 20 - 5,
            top: point.y * buttonSize.height - 20 - 5,
            transform: `scale(${point.life / 3.75})`,
            opacity: 1 - point.life / 100,
          }}></span>
        ))}
      </button>
    </div>
  );
}
