import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cobalt: {
          DEFAULT: "#1D4ED8",
          soft: "#EFF6FF",
        },
        ivory: "#FAF7F2",
        white: "#FFFFFF",
        surface: "#F5F1EA",
        border: "#E7DFD4",
        "border-hover": "#D7CCB8",
        ink: "#1A1816",
        muted: "#6E6458",
        "soft-text": "#A99D8F",
        inverse: "#FFFFFF",
        success: "#15803D",
        warning: "#B45309",
        error: "#B91C1C",
        info: "#475569",
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "monospace"],
      },
      spacing: {
        3: "0.75rem",
        5: "1.25rem",
        7: "1.75rem",
        9: "2.25rem",
        11: "2.75rem",
        13: "3.25rem",
        15: "3.75rem",
      },
      fontSize: {
        h1: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h2: ["1.75rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h3: ["1.25rem", { lineHeight: "1.3" }],
        h4: ["1rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.6" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
        "skeleton-pulse": "skeletonPulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        skeletonPulse: {
          "0%": { opacity: "0.6" },
          "50%": { opacity: "0.3" },
          "100%": { opacity: "0.6" },
        },
      },
      borderRadius: {
        none: "0",
        sm: "0.25rem",
        DEFAULT: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
