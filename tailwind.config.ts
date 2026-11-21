import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        border: "#E8E8E5",
        input: "#E8E8E5",
        ring: "#4468E8",
        background: "#FAFAF8",
        foreground: "#202124",
        primary: {
          DEFAULT: "#4468E8",
          hover: "#3455D1",
          foreground: "#FFFFFF",
          subtle: "#EEF2FF",
        },
        secondary: {
          DEFAULT: "#F1F3F5",
          foreground: "#1E293B",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
          subtle: "#FEF2F2",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
          subtle: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
          subtle: "#FFFBEB",
        },
        muted: {
          DEFAULT: "#F5F5F3",
          foreground: "#70757A",
        },
        accent: {
          DEFAULT: "#EEF2FF",
          foreground: "#4468E8",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#202124",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        card: "0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        invoice: "0 12px 36px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
