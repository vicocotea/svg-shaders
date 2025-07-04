import DisplacementButton from "./DisplacementButton";

export default function WaveButton({
  children,
  debug,
  onClick,
  style,
  activeLabel,
  inactiveLabel,
  scale = 10,
  intensity = 0.5,
}) {
  return (
    <DisplacementButton
      onClick={onClick}
      style={style}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
      debug={debug}
      scale={scale}
      intensity={intensity}
      fragment={(uv, points, buttonSize, intensity) => {
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
              (uv.x - centerX) * volumeEffect * displacementFactor * direction;
            const displacementY =
              (uv.y - centerY) * volumeEffect * displacementFactor * direction;

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
          const x = Math.max(0, Math.min(1, uv.x + value * totalDisplacementX));
          const y = Math.max(0, Math.min(1, uv.y + value * totalDisplacementY));

          return { x, y };
        } else {
          // En dehors des vagues, retourner la texture originale
          return { x: uv.x, y: uv.y };
        }
      }}
    >
      {children}
    </DisplacementButton>
  );
}
