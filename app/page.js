"use client";

import { useState } from "react";

import WaveButton from "./components/WaveButton";
import RippleButton from "./components/RippleButton";
import SimpleButton from "./components/SimpleButton";
import ZoomButton from "./components/ZoomButton";
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
      >
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-orange">Simple Button</h1>
        </div>
      </SimpleButton>

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
{/* 
      <ZoomButton
        debug={params.debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
        intensity={params.intensity}
        scale={params.scale}
      ></ZoomButton> */}
    </>
  );
}
