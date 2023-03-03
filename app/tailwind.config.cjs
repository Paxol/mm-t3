/** @type {import("tailwindcss").Config} */
module.exports = {
  presets: [require("@paxol/tailwind-config")],
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/_app.tsx",
    "../node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
};
