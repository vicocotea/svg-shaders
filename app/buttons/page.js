"use client";

import WaveButton from "../components/WaveButton";
import RippleButton from "../components/RippleButton";
import SimpleButton from "../components/SimpleButton";
import { useState } from "react";

export default function Page() {
  const [debug, setDebug] = useState(true);
  return (
    <>
      <input
        type="checkbox"
        id="debug"
        checked={debug}
        onChange={() => {
          setDebug(document.getElementById("debug").checked);
        }}
      />
      
      <SimpleButton
        debug={debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
      ></SimpleButton>

      <WaveButton
        debug={debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
      ></WaveButton>

      <RippleButton
        debug={debug}
        activeLabel="Enable"
        inactiveLabel="Disable"
      ></RippleButton>
    </>
  );
}
