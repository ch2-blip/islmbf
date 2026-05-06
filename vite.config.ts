import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig, type Plugin } from "vite"

/**
 * Custom Vite plugin: strip @layer wrappers from built CSS.
 *
 * Tailwind CSS v4 wraps ALL output in @layer (properties / theme / base /
 * utilities). Browsers older than Chrome 99 don't understand @layer and
 * silently discard every rule inside, resulting in a completely unstyled page.
 *
 * This plugin runs in generateBundle (after Tailwind + lightningcss have
 * finished) and removes the @layer wrappers while keeping all rules intact.
 * Modern browsers still get the correct cascade because rules already appear
 * in source order.
 */
function stripCssLayers(): Plugin {
  return {
    name: "strip-css-layers",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [, asset] of Object.entries(bundle)) {
        if (
          asset.type === "asset" &&
          typeof asset.source === "string" &&
          asset.fileName.endsWith(".css")
        ) {
          asset.source = removeLayers(asset.source)
        }
      }
    },
  }
}

/** Remove @layer wrappers, handling nested braces correctly. */
function removeLayers(css: string): string {
  let result = ""
  let i = 0
  while (i < css.length) {
    if (css.startsWith("@layer ", i)) {
      // Find opening brace or semicolon (empty layer like `@layer components;`)
      const bracePos = css.indexOf("{", i)
      const semiPos = css.indexOf(";", i)

      // Empty @layer declaration — skip entirely
      if (semiPos !== -1 && (bracePos === -1 || semiPos < bracePos)) {
        i = semiPos + 1
        continue
      }

      if (bracePos === -1) break

      // Walk forward to find the matching closing brace
      let depth = 1
      let j = bracePos + 1
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++
        else if (css[j] === "}") depth--
        j++
      }

      // Keep everything between the braces (the actual rules)
      result += css.substring(bracePos + 1, j - 1)
      i = j
    } else {
      result += css[i]
      i++
    }
  }
  return result
}

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
    stripCssLayers(),
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
