"use client";

import Button from "../components/Button";
import ButtonCircle from "../components/ButtonCircle";
import { useState } from "react";

export default function Page() {
  const [debug, setDebug] = useState(true);
  return (
    <>
      <input
        type="checkbox"
        id="debug"
        onChange={() => {
          setDebug(document.getElementById("debug").checked);
        }}
      />
      {/* <Button debug={debug}></Button>
      <Button debug={debug}>Découvrir</Button>
      <Button debug={debug}>
        Découvrir
        <br />
        Découvrir
        <br />
        Découvrir
      </Button> */}
      <Button debug={debug}>
        aonzeap jajz ljalj azl jazlj eazlj ealz <br />
        lelzrej zeljf qlejf lqej fqlej fzkej z<br />
        eljrn elrjenr
      </Button>
      <ButtonCircle debug={debug}>
        aonzeap jajz ljalj azl jazlj
      </ButtonCircle>
    </>
  );
}
