/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1B4F72",
          50: "#F4F8FA",
          100: "#E9F1F6",
          200: "#C7DCE9",
          300: "#A6C8DB",
          400: "#639FBF",
          500: "#2077A4",
          600: "#1B4F72",
          700: "#174362",
          800: "#133852",
          900: "#102E43",
        },
        accent: {
          DEFAULT: "#C0392B",
          50: "#FDF3F2",
          100: "#FBE8E5",
          200: "#F4C5C0",
          300: "#ECA29B",
          400: "#DF5C50",
          500: "#C0392B",
          600: "#A93125",
          700: "#8E291F",
          800: "#752119",
          900: "#611B14",
        },
        ink: {
          DEFAULT: "#111827",
          soft: "#374151",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        surface: "#FFFFFF",
        appbg: "#FAFAFB",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        soft: "0 8px 30px -8px rgba(17,24,39,0.08)",
        softer: "0 2px 12px -2px rgba(17,24,39,0.05)",
        lift: "0 20px 40px -16px rgba(109,40,217,0.35)",
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".55" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        float: "float 5s ease-in-out infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
