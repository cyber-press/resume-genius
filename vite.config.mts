import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    sourcemap: true,
    target: "es2022",
    rollupOptions: {
      input: ["index.html", "privacy.html", "terms.html"],
    },
  },
});
