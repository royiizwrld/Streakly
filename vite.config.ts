// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        // The guarded wrapper in src/lib/pwa/register.ts is the only registrar.
        injectRegister: null,
        registerType: "autoUpdate",
        devOptions: { enabled: false },
        // The manifest is a static file in public/ and linked from the root route head.
        manifest: false,
        filename: "sw.js",
        workbox: {
          // Static assets only. API, auth, database and AI calls are never cached.
          globPatterns: ["**/*.{js,css,ico,png,svg,woff2,webmanifest}", "offline.html"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Pages always come from the network; offline shows the friendly fallback page.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth") && !url.pathname.startsWith("/api/"),
              handler: "NetworkOnly",
              options: { precacheFallback: { fallbackURL: "/offline.html" } },
            },
          ],
        },
      }),
    ],
    optimizeDeps: {
      // Crawl every page before serving the client, not just the HTML entry.
      // Late discovery invalidates shared chunks while hydration is importing them.
      entries: ["src/routes/**/*.tsx", "src/start.ts"],
      include: ["@radix-ui/react-progress"],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
