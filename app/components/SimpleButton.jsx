import DisplacementButton from "./DisplacementButton";

export default function SimpleButton({
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
        // Simple ripple effect
        let totalDisplacementX = 0;
        let totalDisplacementY = 0;

        points.forEach((point) => {
          const centerX = point.x;
          const centerY = point.y;

          // // Calculate distance from current pixel to point
          // const dx = uv.x - centerX;
          // const dy = uv.y - centerY;
          // const distance = Math.sqrt(dx * dx + dy * dy);
          // Compenser l'aspect ratio pour garder un effet circulaire
          const aspectRatio = buttonSize.width / buttonSize.height;
          const adjustedX = (uv.x - centerX) * aspectRatio;
          const adjustedY = uv.y - centerY;

          const distance = Math.sqrt(adjustedX ** 2 + adjustedY ** 2);

          // Create a simple ripple effect
          const rippleRadius = 0.01 + 2 * (point.life / 100);
          const rippleStrength = Math.max(0, 1 - point.life / 100);
          
          if (distance < rippleRadius && rippleStrength > 0.01) {
            const rippleEffect = rippleStrength * intensity * 0.1;
            
            // Push pixels outward from the center
            const normalizedDistance = distance / rippleRadius;
            const pushFactor = (1 - normalizedDistance) * rippleEffect;
            
            totalDisplacementX += adjustedX * pushFactor;
            totalDisplacementY += adjustedY * pushFactor;
          }
        });

        // Apply displacement
        const x = Math.max(0, Math.min(1, uv.x + totalDisplacementX));
        const y = Math.max(0, Math.min(1, uv.y + totalDisplacementY));

        return { x, y };
      }}
    >
      {children}
    </DisplacementButton>
  );
} 