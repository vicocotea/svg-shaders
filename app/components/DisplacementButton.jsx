import { useEffect, useRef, useState, useCallback } from "react";
import DisplacementShader from "./DisplacementShader";
import { texture } from "../utils/shader";
import { useAnimatedPoints } from "../hook/useAnimatedNumber";

export default function DisplacementButton({
  children,
  debug,
  onClick,
  style,
  activeLabel,
  inactiveLabel,
  fragment,
  scale = 10,
  intensity = 0.5,
  ...props
}) {
  const [buttonSize, setButtonSize] = useState({ width: 200, height: 200 });

  const buttonRef = useRef();
  const [filterId, setFilterId] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Utiliser le hook pour animer les points
  const [points, addPoint] = useAnimatedPoints([], 1000);

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

      addPoint({
        x: uvX,
        y: uvY,
        life: 0,
        color: isActive ? "#000000" : "#0077cc",
      });
      setIsActive(!isActive);
    },
    [points]
  );

  useEffect(() => {
    if (!buttonRef.current) return;
    buttonRef.current.addEventListener("pointerdown", handlePointerDown);

    return () => {
      buttonRef.current.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [handlePointerDown]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      console.log("Button clicked!");
    }
  };

  return (
    <div>
      <DisplacementShader
        width={buttonSize.width}
        height={buttonSize.height}
        debug={debug}
        scale={scale}
        points={points}
        buttonSize={buttonSize}
        intensity={intensity}
        fragment={fragment}
        onFilterCreated={setFilterId}
      ></DisplacementShader>
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
        {points.map((point, index) => (
          <span
            key={index}
            className="button-point"
            style={{
              left: point.x * buttonSize.width - 20 - 5,
              top: point.y * buttonSize.height - 20 - 5,
              transform: `scale(${point.life / 3.75})`,
              opacity: 1 - Math.max(0, point.life - 50) / 50,
              backgroundColor: point.color,
            }}
          ></span>
        ))}
        {children && <span className="button-text">{children}</span>}
        {!children && (
          <span className="button-text-container">
            <span className="button-text" style={{ opacity: isActive ? 0 : 1 }}>
              {activeLabel}
            </span>
            <span className="button-text" style={{ opacity: isActive ? 1 : 0 }}>
              {inactiveLabel}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
