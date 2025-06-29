"use client";

import Button from "../components/Button";
import ButtonCircle from "../components/ButtonCircle";
import ButtonWave from "../components/ButtonWave";
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
      <Button debug={debug}>
        Test
      </Button>
      <ButtonCircle debug={debug} activeLabel="Enable the button long text" inactiveLabel="Disable"></ButtonCircle>
      <ButtonWave debug={debug}>
        Enable
      </ButtonWave>
    </>
  );
}
