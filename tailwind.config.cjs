/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./popup.html",
    "./welcome.html"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D1117",
        card: {
          DEFAULT: "#161B22",
          hover: "#1F242D"
        },
        border: {
          DEFAULT: "#30363D",
          muted: "#21262D"
        },
        accent: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          muted: "rgba(59, 130, 246, 0.15)"
        },
        success: {
          DEFAULT: "#22C55E",
          muted: "rgba(34, 197, 94, 0.15)"
        },
        warning: {
          DEFAULT: "#EAB308",
          muted: "rgba(234, 179, 8, 0.15)"
        },
        danger: {
          DEFAULT: "#EF4444",
          muted: "rgba(239, 68, 68, 0.15)"
        },
        text: {
          primary: "#E6EDF3",
          secondary: "#8B949E",
          muted: "#6E7681"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms"
      }
    }
  },
  plugins: []
};
