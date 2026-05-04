import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: [
        "Android >= 6",
        "Chrome >= 60",
        "iOS >= 11",
        "Safari >= 11",
        "Edge >= 79",
        "Firefox >= 60",
        "> 0.3%",
        "not dead",
      ],
      modernPolyfills: true,
      renderLegacyChunks: true,
      polyfills: ["es.promise", "es.array.iterator", "es.object.assign", "es.symbol"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssTarget: ["chrome60", "safari11"],
  },
})
