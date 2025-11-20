/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom", // Simula el DOM del navegador
    setupFiles: "./src/setupTests.ts", // configuración global
  },
});
