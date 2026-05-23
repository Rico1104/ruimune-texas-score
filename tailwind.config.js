/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wood: {
          900: "#2b1a10",
          800: "#3a2415",
          700: "#4a2b18"
        },
        brass: "#caa45a",
        brassLight: "#d8b86a",
        parchment: "#e8d2a2",
        parchmentDark: "#d7b879",
        tavernGreen: "#163b2b",
        tavernRed: "#6b241f",
        inkBrown: "#3a2415"
      },
      boxShadow: {
        tavern: "0 16px 40px rgba(0,0,0,.38), inset 0 1px rgba(255,255,255,.12)",
        brass: "0 0 0 1px rgba(202,164,90,.75), 0 8px 18px rgba(0,0,0,.28)"
      }
    }
  },
  plugins: []
};
