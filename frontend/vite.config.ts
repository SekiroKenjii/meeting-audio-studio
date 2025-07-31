import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  },
  define: {
    // For compatibility with some libraries
    global: "globalThis",
  },
});
