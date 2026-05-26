/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "game-bg":        "#030c06",
        "game-primary":   "#1e40af",
        "game-secondary": "#7c3aed",
        "card-red":       "#dc2626",
        "card-black":     "#111827",
        "table-green":    "#052e1f",
        "table-felt":     "#064e3b",
        "team-a":         "#3b82f6",
        "team-b":         "#ef4444",
        "gold":           "#d4af37",
        "gold-light":     "#f4d03f",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Menlo", "Monaco", "monospace"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        card: "0 3px 10px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)",
        "card-hover": "0 10px 28px rgba(0,0,0,0.4), 0 3px 8px rgba(0,0,0,0.2)",
        "card-selected": "0 0 0 2.5px #3b82f6, 0 10px 24px rgba(59,130,246,0.3)",
      },
    },
  },
  plugins: [],
};
