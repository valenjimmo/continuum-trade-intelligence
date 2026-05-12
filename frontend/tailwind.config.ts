import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./charts/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f6f7f4",
        ink: "#151716",
        panel: "#ffffff",
        line: "#d8ddd5",
        pine: "#176b5b",
        amber: "#b67a18",
        danger: "#b73737",
        steel: "#40566b"
      },
      boxShadow: {
        panel: "0 14px 35px rgba(21, 23, 22, 0.08)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
