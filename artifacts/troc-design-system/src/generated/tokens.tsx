/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#F4F4F4",
      "foreground": "#0E0E0E",
      "card": "#FFFFFF",
      "cardForeground": "#0E0E0E",
      "popover": "#FFFFFF",
      "popoverForeground": "#0E0E0E",
      "primary": "#DE1E30",
      "primaryForeground": "#FFFFFF",
      "secondary": "#E8E8E8",
      "secondaryForeground": "#171717",
      "muted": "#EDEDED",
      "mutedForeground": "#656565",
      "accent": "#FF2D3D",
      "accentForeground": "#0E0E0E",
      "destructive": "#C61728",
      "destructiveForeground": "#FFFFFF",
      "border": "#DEDEDE",
      "input": "#858585",
      "ring": "#C61728",
      "chart1": "#DE1E30",
      "chart2": "#171717",
      "chart3": "#656565",
      "chart4": "#8A8A8A",
      "chart5": "#B8B8B8",
      "sidebar": "#FFFFFF",
      "sidebarForeground": "#3B3B3B",
      "sidebarBorder": "#DEDEDE",
      "sidebarPrimary": "#C61728",
      "sidebarPrimaryForeground": "#FFFFFF",
      "sidebarAccent": "#FCE9EB",
      "sidebarAccentForeground": "#B51625",
      "sidebarRing": "#C61728"
    },
    "dark": {
      "background": "#0E0E0E",
      "foreground": "#F4F4F4",
      "card": "#171717",
      "cardForeground": "#F4F4F4",
      "popover": "#202020",
      "popoverForeground": "#F4F4F4",
      "primary": "#DE1E30",
      "primaryForeground": "#FFFFFF",
      "secondary": "#2A2A2A",
      "secondaryForeground": "#F4F4F4",
      "muted": "#222222",
      "mutedForeground": "#A3A3A3",
      "accent": "#FF2D3D",
      "accentForeground": "#0E0E0E",
      "destructive": "#FF5260",
      "destructiveForeground": "#0E0E0E",
      "border": "#2A2A2A",
      "input": "#686868",
      "ring": "#FF5260",
      "chart1": "#FF2D3D",
      "chart2": "#F4F4F4",
      "chart3": "#B8B8B8",
      "chart4": "#8A8A8A",
      "chart5": "#656565",
      "sidebar": "#111111",
      "sidebarForeground": "#A3A3A3",
      "sidebarBorder": "#2A2A2A",
      "sidebarPrimary": "#FF5260",
      "sidebarPrimaryForeground": "#0E0E0E",
      "sidebarAccent": "#2B171A",
      "sidebarAccentForeground": "#FF6571",
      "sidebarRing": "#FF5260"
    }
  },
  "fontFamily": {
    "sans": [
      "Plus Jakarta Sans",
      "Arial",
      "sans-serif"
    ],
    "serif": [
      "Plus Jakarta Sans",
      "Arial",
      "sans-serif"
    ],
    "mono": [
      "SFMono-Regular",
      "Consolas",
      "monospace"
    ]
  },
  "radius": "0.5rem",
  "spacing": "0.25rem",
  "semantic": {
    "light": {
      "surface": "#FFFFFF",
      "surface-elevated": "#FFFFFF",
      "surface-hover": "#EDEDED",
      "border-strong": "#858585",
      "text-primary": "#0E0E0E",
      "text-secondary": "#505050",
      "text-muted": "#656565",
      "accent-hover": "#C81728",
      "accent-pressed": "#AF1423",
      "focus": "#C61728",
      "success": "#3D3D3D",
      "positive": "#3D3D3D",
      "warning": "#505050",
      "danger": "#C61728",
      "shadow-sm": "0 1px 2px rgb(0 0 0 / 0.04)",
      "shadow-md": "0 8px 24px rgb(0 0 0 / 0.10)"
    },
    "dark": {
      "surface": "#171717",
      "surface-elevated": "#202020",
      "surface-hover": "#222222",
      "border-strong": "#686868",
      "text-primary": "#F4F4F4",
      "text-secondary": "#C4C4C4",
      "text-muted": "#A3A3A3",
      "accent-hover": "#C81728",
      "accent-pressed": "#AF1423",
      "focus": "#FF5260",
      "success": "#D1D1D1",
      "positive": "#D1D1D1",
      "warning": "#C4C4C4",
      "danger": "#FF5260",
      "shadow-sm": "0 1px 2px rgb(0 0 0 / 0.10)",
      "shadow-md": "0 8px 24px rgb(0 0 0 / 0.25)"
    }
  },
  "foundation": {
    "space": {
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "5": "20px",
      "6": "24px",
      "8": "32px",
      "10": "40px",
      "12": "48px",
      "16": "64px",
      "20": "80px",
      "24": "96px"
    },
    "container": {
      "reading": "720px",
      "content": "1120px",
      "wide": "1440px"
    },
    "breakpoint": {
      "mobile": "480px",
      "tablet": "768px",
      "desktop": "1024px",
      "wide": "1440px"
    },
    "motion": {
      "fast": "120ms",
      "normal": "180ms",
      "slow": "220ms",
      "easing": "cubic-bezier(0.2, 0, 0, 1)"
    },
    "z": {
      "base": 0,
      "sticky": 20,
      "dropdown": 40,
      "overlay": 60,
      "toast": 80
    },
    "control": {
      "small": "36px",
      "default": "44px",
      "large": "48px"
    }
  },
  "typeScale": {
    "display": {
      "size": "3.75rem",
      "lineHeight": "1.08",
      "weight": 800,
      "tracking": "-0.05em"
    },
    "h1": {
      "size": "2.5rem",
      "lineHeight": "1.16",
      "weight": 700,
      "tracking": "-0.045em"
    },
    "h2": {
      "size": "1.75rem",
      "lineHeight": "1.25",
      "weight": 700,
      "tracking": "-0.035em"
    },
    "h3": {
      "size": "1.375rem",
      "lineHeight": "1.35",
      "weight": 700,
      "tracking": "-0.025em"
    },
    "h4": {
      "size": "1.125rem",
      "lineHeight": "1.4",
      "weight": 600,
      "tracking": "-0.02em"
    },
    "h5": {
      "size": "1rem",
      "lineHeight": "1.5",
      "weight": 600,
      "tracking": "-0.01em"
    },
    "h6": {
      "size": "0.875rem",
      "lineHeight": "1.5",
      "weight": 600,
      "tracking": "0"
    },
    "body-large": {
      "size": "1.125rem",
      "lineHeight": "1.7",
      "weight": 400,
      "tracking": "-0.015em"
    },
    "body": {
      "size": "1rem",
      "lineHeight": "1.65",
      "weight": 400,
      "tracking": "-0.01em"
    },
    "body-small": {
      "size": "0.875rem",
      "lineHeight": "1.6",
      "weight": 400,
      "tracking": "0"
    },
    "label": {
      "size": "0.8125rem",
      "lineHeight": "1.5",
      "weight": 600,
      "tracking": "0"
    },
    "caption": {
      "size": "0.75rem",
      "lineHeight": "1.5",
      "weight": 400,
      "tracking": "0"
    },
    "metadata": {
      "size": "0.75rem",
      "lineHeight": "1.5",
      "weight": 500,
      "tracking": "0.015em"
    },
    "price-large": {
      "size": "1.75rem",
      "lineHeight": "1.2",
      "weight": 700,
      "tracking": "-0.035em"
    },
    "price-small": {
      "size": "0.9375rem",
      "lineHeight": "1.5",
      "weight": 700,
      "tracking": "-0.015em"
    },
    "table": {
      "size": "0.8125rem",
      "lineHeight": "1.5",
      "weight": 500,
      "tracking": "0"
    }
  }
} as const;

export type Tokens = typeof tokens;
export default tokens;
