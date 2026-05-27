import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "HumanTouch",
  description: "Company agent management for HumanTouch.",
};

const themeInitializer = `
  (() => {
    const key = "humantouch_theme";
    const fallback = { mainColor: "#fd5200", backColor: "#000000" };
    const normalizeHex = (value, nextFallback) => {
      const trimmed = String(value || "").trim();
      if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
      if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
        const [, r, g, b] = trimmed;
        return ("#" + r + r + g + g + b + b).toLowerCase();
      }
      return nextFallback;
    };
    const toneFor = (hex) => {
      const value = normalizeHex(hex, fallback.backColor).slice(1);
      const r = parseInt(value.slice(0, 2), 16);
      const g = parseInt(value.slice(2, 4), 16);
      const b = parseInt(value.slice(4, 6), 16);
      return ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) > 0.58 ? "light" : "dark";
    };

    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null") || fallback;
      const mainColor = normalizeHex(stored.mainColor, fallback.mainColor);
      const backColor = normalizeHex(stored.backColor, fallback.backColor);
      const root = document.documentElement;

      root.dataset.themeTone = toneFor(backColor);
      root.style.setProperty("--main-color", mainColor);
      root.style.setProperty("--back-color", backColor);
      root.style.setProperty("--page-color", backColor);
    } catch {
      document.documentElement.dataset.themeTone = "dark";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
