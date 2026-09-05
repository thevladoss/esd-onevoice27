import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";
import { LightsProvider } from "./state/lights";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LightsProvider>
      <App />
    </LightsProvider>
  </StrictMode>,
);
