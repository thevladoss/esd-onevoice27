/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/esd-onevoice27/",
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              // Карта тянет d3, topojson и границы стран из world-atlas: вместе это
              // половина бандла, и она нужна только секции #map. Отдельный чанк
              // держит главный вход под порогом предупреждения Vite в 500 КБ.
              // Транзитивные d3-dispatch, d3-drag, d3-interpolate, d3-timer,
              // d3-ease и d3-transition попадают сюда же по маске d3-*.
              name: "vendor-map",
              test: /node_modules[\\/](d3-[a-z-]+|topojson-client|world-atlas)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    css: false,
  },
});
