import DisplacementButton from "./DisplacementButton";

export default function RippleButton({
  children,
  debug,
  onClick,
  style,
  activeLabel,
  inactiveLabel
}) {
  return (
    <DisplacementButton
      onClick={onClick}
      style={style}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
      debug={debug}
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

          // Créer une onde avec décroissance basée sur l'ordre des vagues
          const waveRadius = waveSpacing * 5;
          const waveWidth = Math.max(0.01, 1.0 * lifeFactor);
          const waveFrequency = 12;
          const waveAmplitude = 0.15;

          // Calculer l'ordre de la vague basé sur la distance depuis le centre
          const waveOrder = Math.floor((distance - waveRadius) / (Math.PI / waveFrequency));
          const maxWaveOrder = 3; // Nombre maximum de vagues à considérer
          
          // Décroissance d'intensité basée sur l'ordre de la vague
          // La première vague (order = 0) est la plus forte
          const waveDecay = Math.max(0.1, Math.pow(0.6, Math.abs(waveOrder)));
          
          // Créer l'effet d'onde avec des ondulations sinusoïdales
          const waveEffect = Math.sin((distance - waveRadius) * waveFrequency) * 
                            Math.exp(-(Math.abs(distance - waveRadius) * Math.abs(distance - waveRadius)) / (2 * waveWidth * waveWidth)) * 
                            waveAmplitude * 
                            lifeIntensity * 
                            waveDecay;

          if (Math.abs(waveEffect) > 0.001) {
            // Seuil pour éviter les calculs inutiles
            const volumeEffect = Math.abs(waveEffect) * intensity;

            // Direction de la déformation (radiale depuis le centre)
            const angle = Math.atan2(adjustedY, adjustedX);
            const displacementFactor = 0.5 * lifeIntensity;

            // Calculer les déplacements radiaux avec les ondulations
            const displacementX = Math.cos(angle) * 
                                 volumeEffect * 
                                 displacementFactor * 
                                 Math.sign(waveEffect);
            const displacementY = Math.sin(angle) * 
                                 volumeEffect * 
                                 displacementFactor * 
                                 Math.sign(waveEffect);

            totalDisplacementX += displacementX;
            totalDisplacementY += displacementY;
            totalWaveIntensity += volumeEffect;
          }
        });

        // Appliquer la déformation totale seulement à la fin
        if (totalWaveIntensity > 0.001) {
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
