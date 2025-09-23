import React from "react";
import ReactDOM from "react-dom/client";
import { Inspector } from "react-dev-inspector";
import App from "./App";
import "./assets/globals.css";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Inspector />
    <App />
  </React.StrictMode>
);