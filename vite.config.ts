import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites from /<repo>/. This repo is "Financial-Forecast".
// The base path is overridable via VITE_BASE for forks/custom domains.
const base = process.env.VITE_BASE ?? "/Financial-Forecast/";

export default defineConfig({
  base,
  plugins: [react()],
});
