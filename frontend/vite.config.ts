/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isGitHubPages =
    process.env.GITHUB_PAGES === "true" || process.env.VITE_BASE_URL;

  return {
    plugins: [react()],
    base: isGitHubPages ? "/meeting-audio-studio/" : "/",
    server: {
      port: 3000,
      host: "0.0.0.0",
      watch: {
        usePolling: true,
        interval: 1000,
      },
      hmr: false,
      strictPort: true,
      cors: true,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "build",
      sourcemap: true,
      // Ensure assets are properly referenced
      assetsDir: "assets",
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/setupTests.ts"],
    },
    define: {
      // For compatibility with some libraries
      global: "globalThis",
    },
  };
});
