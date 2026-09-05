import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { LightsProvider } from "./state/lights";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Граница снаружи провайдера: огоньки считаются в инициализаторе useReducer,
        и поломка данных там же уносит весь корень. */}
    <ErrorBoundary>
      <LightsProvider>
        <App />
      </LightsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
