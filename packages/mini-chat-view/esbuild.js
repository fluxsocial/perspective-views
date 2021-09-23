const preactCompatPlugin = {
  name: "preact-compat",
  setup(build) {
    const path = require("path");
    const preact = path.join(
      process.cwd(),
      "node_modules",
      "preact",
      "compat",
      "dist",
      "compat.module.js"
    );

    build.onResolve({ filter: /^(react-dom|react)$/ }, (args) => {
      return { path: preact };
    });
  },
};

require("esbuild")
  .build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    format: "esm",
    watch: process.env.NODE_ENV === "dev" ? true : false,
    inject: ["./preact-shim.js"],
    outfile: "dist/main.js",
    plugins: [preactCompatPlugin],
  })
  .catch(() => process.exit(1));
