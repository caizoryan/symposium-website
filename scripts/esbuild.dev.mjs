import esbuildServe from "esbuild-serve";

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["./public/script.js"],
    bundle: false,
    sourcemap: false,
    outfile: "public/ignore.min.js",
  },
  { root: "./public", port: 8080 },
);
