import { Platform } from "react-native";

// Game mode accent colors
export const GameModeColors = {
  classic: "#4ECDC4",
  depth: "#8B4513",
  strategic: "#FFD700",
  tactical: "#FF6B6B",
  deus: "#A855F7",
} as const;

// Semantic colors
export const SemanticColors = {
  success: "#48BB78",
  error: "#F56565",
  warning: "#ECC94B",
} as const;

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#A0A8B8",
    textDisabled: "#4A5568",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#4ECDC4",
    link: "#4ECDC4",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#141B2D",
    backgroundSecondary: "#1E2640",
    backgroundTertiary: "#2D3748",
    border: "#2D3748",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A0A8B8",
    textDisabled: "#4A5568",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#4ECDC4",
    link: "#4ECDC4",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#141B2D",
    backgroundSecondary: "#1E2640",
    backgroundTertiary: "#2D3748",
    border: "#2D3748",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  number: {
    fontSize: 48,
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  small: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};
