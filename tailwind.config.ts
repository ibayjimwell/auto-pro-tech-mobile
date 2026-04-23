/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#B22222",
        accent: "#FFD700",
        secondary: "#757575",
        background: "#FFFFFF",
        surface: "#F5F5F5",
        error: "#B22222",
        success: "#4CAF50",
        warning: "#FF9800",
      },
    },
  },
  plugins: [],
};