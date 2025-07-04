"use client";

import Button from "../components/Button";
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
      <Button debug={debug} activeLabel="Enable" inactiveLabel="Disable"></Button>
    </>
  );
}
