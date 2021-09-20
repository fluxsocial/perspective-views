const vue = require("@vitejs/plugin-vue");
const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // treat all tags with a dash as custom elements
          isCustomElement: (tag) => tag.includes("-"),
        },
      },
    }),
  ],
  build: {
    outDir: "docs",
  },
});
