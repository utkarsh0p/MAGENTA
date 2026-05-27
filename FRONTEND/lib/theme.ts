export const THEME_STORAGE_KEY = "humantouch_theme";

export type HumanTouchTheme = {
  name?: string;
  mainColor: string;
  backColor: string;
};

export const defaultTheme: HumanTouchTheme = {
  name: "Command Black",
  mainColor: "#fd5200",
  backColor: "#000000",
};

export const themePresets: HumanTouchTheme[] = [
  defaultTheme,
  {
    name: "Paper Signal",
    mainColor: "#0f62fe",
    backColor: "#f7f3ea",
  },
  {
    name: "Carbon Mint",
    mainColor: "#00a676",
    backColor: "#101413",
  },
  {
    name: "White Shade",
    mainColor: "#111111",
    backColor: "#ffffff",
  },
  {
    name: "Plum Console",
    mainColor: "#b448ff",
    backColor: "#08060b",
  },
];

function normalizeHex(value: string, fallback: string) {
  const trimmed = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return fallback;
}

function getRgb(hex: string) {
  const value = normalizeHex(hex, defaultTheme.backColor).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function getThemeTone(backColor: string) {
  const { r, g, b } = getRgb(backColor);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance > 0.58 ? "light" : "dark";
}

export function applyHumanTouchTheme(theme: HumanTouchTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const mainColor = normalizeHex(theme.mainColor, defaultTheme.mainColor);
  const backColor = normalizeHex(theme.backColor, defaultTheme.backColor);
  const root = document.documentElement;

  root.dataset.themeTone = getThemeTone(backColor);
  root.style.setProperty("--main-color", mainColor);
  root.style.setProperty("--back-color", backColor);
  root.style.setProperty("--page-color", backColor);
}

export function saveHumanTouchTheme(theme: HumanTouchTheme) {
  const nextTheme = {
    ...theme,
    mainColor: normalizeHex(theme.mainColor, defaultTheme.mainColor),
    backColor: normalizeHex(theme.backColor, defaultTheme.backColor),
  };

  applyHumanTouchTheme(nextTheme);
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextTheme));

  return nextTheme;
}

export function loadHumanTouchTheme() {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!storedTheme) {
      return defaultTheme;
    }

    const parsedTheme = JSON.parse(storedTheme) as Partial<HumanTouchTheme>;

    return {
      name: parsedTheme.name,
      mainColor: normalizeHex(parsedTheme.mainColor ?? "", defaultTheme.mainColor),
      backColor: normalizeHex(parsedTheme.backColor ?? "", defaultTheme.backColor),
    };
  } catch {
    return defaultTheme;
  }
}
