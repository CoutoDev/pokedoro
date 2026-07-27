import tailwindPlugin from "bun-plugin-tailwind"

await Bun.build({
  entrypoints: ["./src/client/index.html"],
  outdir: "./dist",
  sourcemap: "linked",
  target: "browser",
  minify: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  env: "BUN_PUBLIC_*",
  plugins: [tailwindPlugin],
})
