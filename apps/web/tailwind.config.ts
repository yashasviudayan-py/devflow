import type { Config } from "tailwindcss";

/**
 * DevFlow design tokens.
 *
 * Neutrals are sage-tinted (a faint green cast in backgrounds, borders, and
 * text) so the emerald brand color reads as part of the material rather than a
 * bolt-on accent. Color values live as CSS variables in globals.css; the brand
 * scale is inlined so Tailwind opacity modifiers (e.g. brand-600/25) work.
 */
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "var(--canvas)",
          subtle: "var(--canvas-subtle)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        edge: {
          subtle: "var(--edge-subtle)",
          DEFAULT: "var(--edge)",
          strong: "var(--edge-strong)",
        },
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Inter",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        // Page title — used once per screen.
        display: [
          "1.875rem",
          { lineHeight: "2.25rem", letterSpacing: "-0.025em", fontWeight: "650" },
        ],
        // Section heading.
        headline: [
          "1.3125rem",
          { lineHeight: "1.75rem", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
        // Card heading.
        title: ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
      borderRadius: {
        // Inputs, buttons, compact controls.
        field: "10px",
        // Cards and list rows.
        card: "14px",
        // Modals, popovers, hero surfaces.
        modal: "18px",
      },
      boxShadow: {
        // Most cards are border-only; these are the few sanctioned elevations.
        raised: "0 1px 2px rgb(12 20 15 / 0.04), 0 2px 8px rgb(12 20 15 / 0.05)",
        menu: "0 1px 3px rgb(12 20 15 / 0.07), 0 8px 24px rgb(12 20 15 / 0.10)",
        modal: "0 16px 48px rgb(12 20 15 / 0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
