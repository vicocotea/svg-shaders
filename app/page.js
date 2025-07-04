"use client";

import { useState } from "react";

import WaveButton from "./components/WaveButton";
import RippleButton from "./components/RippleButton";
import SimpleButton from "./components/SimpleButton";
import TweakpanePanel from "./components/TweakpanePanel";

import { useEffect } from "react";

export default function Page() {
  const [params, setParams] = useState({ intensity: 0.5, scale: 10, debug: false });

  useEffect(() => {
    console.log("params", params);
  }, [params]);

  return (
    <>
      <TweakpanePanel onParamsChange={setParams} />

      <SimpleButton
        debug={params.debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
        intensity={params.intensity}
        scale={params.scale}
      ></SimpleButton>

      <WaveButton
        debug={params.debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
        intensity={params.intensity}
        scale={params.scale}
      ></WaveButton>

      <RippleButton
        debug={params.debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
        intensity={params.intensity}
        scale={params.scale}
      ></RippleButton>
    </>
  );
}
