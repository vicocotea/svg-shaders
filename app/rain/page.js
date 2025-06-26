"use client";

import ButtonRadial from "../components/ButtonRadial";
import { useState } from "react";

export default function Page() {
  const [debug, setDebug] = useState(false);
  return (
    <>
      <input type="checkbox" id="debug" onChange={() => {
        setDebug(document.getElementById("debug").checked);
      }} />
      <ButtonRadial debug={debug}></ButtonRadial>
      <ButtonRadial debug={debug}>Découvrir</ButtonRadial>
      <ButtonRadial debug={debug}>
        aonzeap jajz ljalj azl jazlj eazlj ealz <br />
        lelzrej zeljf qlejf lqej fqlej fzkej z<br />
        eljrn elrjenr
      </ButtonRadial>
    </>
  );
}
