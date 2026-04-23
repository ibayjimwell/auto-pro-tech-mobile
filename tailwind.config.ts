/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#64748B",
        accent: "#F59E0B",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        error: "#EF4444",
        success: "#22C55E",
        warning: "#F97316",
      },
    },
  },
  plugins: [],
};