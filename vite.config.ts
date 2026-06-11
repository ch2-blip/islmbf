import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig, type Plugin } from "vite"

/**
 * Custom Vite plugin: strip @layer wrappers AND "in oklab" color-space hints
 * from built CSS so old browsers (Chrome < 99 / Baidu / QQ) work correctly.
 *
 * Tailwind CSS v4 wraps ALL output in @layer (properties / theme / base /
 * utilities). Browsers older than Chrome 99 don't understand @layer and
 * silently discard every rule inside, resulting in a completely unstyled page.
 *
 * Tailwind v4 also uses "in oklab" in gradient position variables, e.g.
 * `--tw-gradient-position: to bottom right in oklab`. Old browsers can't parse
 * this, causing ALL gradients to become transparent.
 *
 * This plugin runs in generateBundle (after Tailwind + lightningcss have
 * finished) and:
 *  1. Removes @layer wrappers while keeping all rules intact
 *  2. Strips "in oklab" from gradient position variables
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
          let css = removeLayers(asset.source)
          css = stripOklabFromGradients(css)
          asset.source = css
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
      const bracePos = css.indexOf("{", i)
      const semiPos = css.indexOf(";", i)

      // Empty @layer declaration (e.g. `@layer components;`) — skip
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

/**
 * Strip "in oklab" from gradient position variables.
 *
 * Tailwind v4 generates: `--tw-gradient-position: to bottom right in oklab`
 * Old browsers can't parse `linear-gradient(to bottom right in oklab, ...)`
 * and fall back to transparent. Removing "in oklab" makes the gradient use
 * the default sRGB color space, which all browsers understand.
 *
 * This is safe because "in oklab" inside color-mix() is always guarded by
 * @supports blocks, so old browsers never see those.
 */
function stripOklabFromGradients(css: string): string {
  return css.replace(
    /--tw-gradient-position:\s*([^;{}]+?)\s+in\s+oklab/g,
    "--tw-gradient-position:$1"
  )
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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
})
