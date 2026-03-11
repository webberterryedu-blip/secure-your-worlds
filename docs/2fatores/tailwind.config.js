
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Habilita o dark mode baseado na classe 'dark'
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',	
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Paleta Dark Tech
        border: "#1e293b", // slate-800
        input: "#1e293b", // slate-800
        ring: "#10b981", // emerald-500
        background: "#020617", // slate-950
        foreground: "#f8fafc", // slate-50
        primary: {
          DEFAULT: "#10b981", // emerald-500
          foreground: "#020617", // slate-950
        },
        secondary: {
          DEFAULT: "#1e293b", // slate-800
          foreground: "#f8fafc", // slate-50
        },
        destructive: {
          DEFAULT: "#ef4444", // red-500
          foreground: "#f8fafc", // slate-50
        },
        muted: {
          DEFAULT: "#334155", // slate-700
          foreground: "#94a3b8", // slate-400
        },
        accent: {
          DEFAULT: "#1e293b", // slate-800
          foreground: "#f8fafc", // slate-50
        },
        popover: {
          DEFAULT: "#0f172a", // slate-900
          foreground: "#f8fafc", // slate-50
        },
        card: {
          DEFAULT: "#0f172a", // slate-900
          foreground: "#f8fafc", // slate-50
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
