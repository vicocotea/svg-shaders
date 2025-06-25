import { useState, useCallback, useRef, useEffect } from "react";
import { animate } from "motion";

export function useAnimatedValue(initialValue = 0, options = {}) {
  const [value, setValue] = useState(initialValue);
  const animationRef = useRef(null);
  
  const animateTo = useCallback((targetValue, customOptions = {}) => {
    // Arrêter l'animation en cours si elle existe
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Créer une nouvelle animation avec motion
    animationRef.current = animate(
      (progress) => {
        setValue(progress);
      },
      {
        from: value,
        to: targetValue,
        duration: 1,
        easing: "easeOutElastic",
        ...options,
        ...customOptions,
      }
    );
  }, [value, options]);

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  return [value, animateTo];
}