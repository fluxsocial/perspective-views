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
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      name: "MyLib",
      fileName: (format) => `chat-view.${format}.js`,
    },
    rollupOptions: {},
  },
});
