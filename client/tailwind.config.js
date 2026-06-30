/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0c10",
          800: "#0f1319",
          700: "#161c24",
          600: "#222b36",
        },
        primary: {
          500: "#4f46e5",
          600: "#4338ca",
          400: "#6366f1",
        }
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        grotesk: ["Space Grotesk", "sans-serif"],
      }
    },
  },
  plugins: [],
}
