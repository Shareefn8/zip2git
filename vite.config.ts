import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const rawPort = process.env.PORT ?? "5173";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";
const isProduction = process.env.NODE_ENV === "production";
const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig(async () => {
  const replitPlugins =
    !isProduction && isReplit
      ? await Promise.all([
          import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default(),
          ),
          import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname),
            }),
          ),
          import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]).catch(() => [])
      : [];

  return {
    base: basePath,
    plugins: [react(), ...replitPlugins],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          // Split heavy vendor libs into separate chunks so the home page
          // loads fast even at 100k+ daily visits.
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            // Split only leaf libraries that don't depend on each other,
            // to avoid circular-chunk warnings at scale.
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("jszip")) return "vendor-zip";
            if (id.includes("@octokit") || id.includes("/octokit/")) return "vendor-octokit";
            if (id.includes("@tanstack")) return "vendor-query";
            // Keep React + Radix + Router together so React stays a single chunk
            return "vendor";
          },
        },
      },
    },
    server: {
      port,
      strictPort: false,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: false,
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
