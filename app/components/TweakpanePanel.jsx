"use client";

import { useEffect, useRef, useState } from "react";

export default function TweakpanePanel({ onParamsChange }) {
  const containerRef = useRef();
  const paneRef = useRef();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isClient) return;

    // Dynamic import to avoid SSR issues
    import("tweakpane").then(({ Pane }) => {
      // Create the pane
      const pane = new Pane({
        container: containerRef.current,
        title: "Button Controls",
      });

      // Add parameters
      const params = {
        intensity: 0.5,
        scale: 10,
        debug: false,
      };

      // Add sliders
      pane.addBinding(params, "intensity", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Intensity",
      });

      pane.addBinding(params, "scale", {
        min: 0,
        max: 50,
        step: 1,
        label: "Scale",
      });

      pane.addBinding(params, "debug", {
        label: "Debug",
      });

      // Listen for changes
      pane.on("change", (ev) => {
        onParamsChange({
          intensity: params.intensity,
          scale: params.scale,
          debug: params.debug,
        });
      });

      // Initial call
      onParamsChange(params);

      paneRef.current = pane;
    });

    return () => {
      if (paneRef.current) {
        paneRef.current.dispose();
      }
    };
  }, [onParamsChange, isClient]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    />
  );
} 