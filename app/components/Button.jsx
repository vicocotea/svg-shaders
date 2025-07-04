import { useEffect, useRef, useState, useCallback } from "react";
import DisplacementShader from "./DisplacementShader";
import { texture } from "../utils/shader";
import { useAnimatedPoints } from "../hook/useAnimatedNumber";

export default function Button({
  children,
  debug,
  onClick,
  style,
  activeLabel,
  inactiveLabel,
  ...props
}) {
  const [radius, setRadius] = useState(0.5);
  const [intensity, setIntensity] = useState(0.5);
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
        scale={0}
        points={points}
        fragment={(uv) => {
          let totalDisplacementX = 0;
          let totalDisplacementY = 0;
          let totalWaveIntensity = 0;

          points.forEach((point) => {
            // Les coordonnées du point sont déjà normalisées (0-1)
            const centerX = point.x;
            const centerY = point.y;

            // Compenser l'aspect ratio pour garder un effet circulaire
            const aspectRatio = buttonSize.width / buttonSize.height;
            const adjustedX = (uv.x - centerX) * aspectRatio;
            const adjustedY = uv.y - centerY;

            const distance = Math.sqrt(adjustedX ** 2 + adjustedY ** 2);

            // Utiliser point.life au lieu de scale pour faire grandir les vagues
            const baseWaveSpacing = 0.3;
            const lifeFactor = Math.max(0, Math.min(1, point.life / 100)); // Normaliser life (0-100 -> 0.1-2)
            const waveSpacing = baseWaveSpacing * lifeFactor;

            // Améliorer le calcul de lifeIntensity pour éviter les discontinuités
            const lifeIntensity = 1 - point.life / 100;

            // Créer une seule vague par point
            const waveRadius = waveSpacing * 5;
            const waveDistance = Math.abs(distance - waveRadius);
            const waveWidth = Math.max(0.01, 0.5 * lifeFactor); // Éviter la division par zéro

            // Fonction smoothée pour la vague (gaussienne)
            const waveEffect = Math.exp(
              -(waveDistance * waveDistance) / (2 * waveWidth * waveWidth)
            );

            if (waveEffect > 0.001) {
              // Seuil plus bas pour plus de continuité
              // Seuil pour éviter les calculs inutiles
              const normalizedDistance = Math.max(
                0,
                Math.min(1, waveDistance / waveWidth)
              );
              const smoothFactor = Math.cos(normalizedDistance * Math.PI * 0.5);
              const volumeEffect =
                Math.max(0, smoothFactor) *
                intensity *
                waveEffect *
                lifeIntensity;

              // Direction de la déformation (vers l'extérieur pour les vagues)
              const direction = distance > waveRadius ? 1 : -1;
              const displacementFactor = 0.5 * lifeIntensity;

              // Lisser les déplacements pour éviter les artefacts
              const displacementX =
                (uv.x - centerX) *
                volumeEffect *
                displacementFactor *
                direction;
              const displacementY =
                (uv.y - centerY) *
                volumeEffect *
                displacementFactor *
                direction;

              totalDisplacementX += displacementX;
              totalDisplacementY += displacementY;
              totalWaveIntensity += waveEffect * intensity;
            }
          });

          // Appliquer la déformation totale seulement à la fin
          if (totalWaveIntensity > 0.001) {
            // Seuil plus bas
            const value = -1;
            // Lisser les coordonnées finales pour éviter les artefacts
            const x = Math.max(
              0,
              Math.min(1, uv.x + value * totalDisplacementX)
            );
            const y = Math.max(
              0,
              Math.min(1, uv.y + value * totalDisplacementY)
            );

            return texture(x, y);
          } else {
            // En dehors des vagues, retourner la texture originale
            return texture(uv.x, uv.y);
          }
        }}
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
