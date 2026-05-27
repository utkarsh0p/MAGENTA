"use client";

import { Check, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  applyHumanTouchTheme,
  defaultTheme,
  loadHumanTouchTheme,
  saveHumanTouchTheme,
  themePresets,
  type HumanTouchTheme,
} from "@/lib/theme";

export default function SettingsPage() {
  const [theme, setTheme] = useState<HumanTouchTheme>(defaultTheme);
  const [draftMainColor, setDraftMainColor] = useState(defaultTheme.mainColor);
  const [draftBackColor, setDraftBackColor] = useState(defaultTheme.backColor);

  useEffect(() => {
    const currentTheme = loadHumanTouchTheme();
    setTheme(currentTheme);
    setDraftMainColor(currentTheme.mainColor);
    setDraftBackColor(currentTheme.backColor);
    applyHumanTouchTheme(currentTheme);
  }, []);

  const activePreset = useMemo(
    () =>
      themePresets.find(
        (preset) =>
          preset.mainColor.toLowerCase() === theme.mainColor.toLowerCase() &&
          preset.backColor.toLowerCase() === theme.backColor.toLowerCase(),
      ),
    [theme],
  );

  function updateTheme(nextTheme: HumanTouchTheme) {
    const savedTheme = saveHumanTouchTheme(nextTheme);

    setTheme(savedTheme);
    setDraftMainColor(savedTheme.mainColor);
    setDraftBackColor(savedTheme.backColor);
  }

  function updateDraftTheme(nextTheme: HumanTouchTheme) {
    const savedTheme = saveHumanTouchTheme(nextTheme);

    setTheme(savedTheme);
  }

  function isCompleteHex(value: string) {
    return /^#[0-9a-f]{6}$/i.test(value.trim());
  }

  return (
    <main className="min-h-screen overflow-y-auto bg-bg-0 px-[var(--page-gutter)] py-24 text-text-100">
      <section className="mx-auto grid w-full max-w-6xl gap-10">
        <header className="grid gap-4 border-b border-bg-300 pb-8">
          <p className="text-xs font-bold uppercase tracking-normal text-accent">
            Workspace settings
          </p>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.45fr)] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-black leading-none tracking-normal text-text-100 sm:text-6xl">
              Theme controls
            </h1>
            <p className="max-w-xl text-sm leading-6 text-text-400">
              Choose the two app colors that drive the HumanTouch interface:
              the main action color and the background color.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,0.42fr)]">
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b border-bg-300 pb-3">
              <h2 className="text-sm font-black uppercase tracking-normal text-text-100">
                Presets
              </h2>
              <button
                type="button"
                onClick={() => updateTheme(defaultTheme)}
                className="inline-flex h-9 items-center gap-2 border border-bg-300 px-3 text-xs font-bold uppercase text-text-200 transition-colors hover:border-accent hover:text-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {themePresets.map((preset) => {
                const isActive = activePreset?.name === preset.name;

                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => updateTheme(preset)}
                    className="grid min-h-28 gap-4 border border-bg-300 bg-bg-100 p-4 text-left transition-colors hover:border-accent"
                    aria-pressed={isActive}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black uppercase tracking-normal text-text-100">
                        {preset.name}
                      </span>
                      {isActive && (
                        <span className="inline-grid h-6 w-6 place-items-center bg-accent text-bg-0">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="grid grid-cols-2 overflow-hidden border border-bg-300">
                      <span
                        className="h-12"
                        style={{ backgroundColor: preset.mainColor }}
                        aria-hidden="true"
                      />
                      <span
                        className="h-12"
                        style={{ backgroundColor: preset.backColor }}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid content-start gap-5 border-l-0 border-bg-300 lg:border-l lg:pl-6">
            <div className="grid gap-3">
              <h2 className="text-sm font-black uppercase tracking-normal text-text-100">
                Custom colors
              </h2>
              <label className="grid gap-2 text-xs font-bold uppercase text-text-400">
                Main color
                <span className="grid grid-cols-[3rem_1fr] border border-bg-300 bg-bg-100">
                  <input
                    type="color"
                    value={theme.mainColor}
                    onChange={(event) =>
                      updateTheme({
                        ...theme,
                        name: undefined,
                        mainColor: event.target.value,
                      })
                    }
                    className="h-12 w-12 cursor-pointer border-0 bg-transparent p-1"
                    aria-label="Main color"
                  />
                  <input
                    type="text"
                    value={draftMainColor}
                    onBlur={() => updateTheme({ ...theme, mainColor: draftMainColor })}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraftMainColor(value);

                      if (isCompleteHex(value)) {
                        updateDraftTheme({
                          ...theme,
                          name: undefined,
                          mainColor: value,
                        });
                      }
                    }}
                    className="min-w-0 bg-transparent px-3 text-sm font-bold uppercase text-text-100 outline-none"
                    aria-label="Main color hex value"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-xs font-bold uppercase text-text-400">
                Back color
                <span className="grid grid-cols-[3rem_1fr] border border-bg-300 bg-bg-100">
                  <input
                    type="color"
                    value={theme.backColor}
                    onChange={(event) =>
                      updateTheme({
                        ...theme,
                        name: undefined,
                        backColor: event.target.value,
                      })
                    }
                    className="h-12 w-12 cursor-pointer border-0 bg-transparent p-1"
                    aria-label="Back color"
                  />
                  <input
                    type="text"
                    value={draftBackColor}
                    onBlur={() => updateTheme({ ...theme, backColor: draftBackColor })}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraftBackColor(value);

                      if (isCompleteHex(value)) {
                        updateDraftTheme({
                          ...theme,
                          name: undefined,
                          backColor: value,
                        });
                      }
                    }}
                    className="min-w-0 bg-transparent px-3 text-sm font-bold uppercase text-text-100 outline-none"
                    aria-label="Back color hex value"
                  />
                </span>
              </label>
            </div>

            <div className="grid gap-4 border border-bg-300 bg-bg-100 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-bg-300 pb-3">
                <span className="text-xs font-black uppercase text-text-400">
                  Preview
                </span>
                <span className="h-3 w-12 bg-accent" aria-hidden="true" />
              </div>
              <div className="grid gap-2">
                <p className="text-2xl font-black leading-none text-text-100">
                  HumanTouch
                </p>
                <p className="text-sm leading-6 text-text-400">
                  Main color:{" "}
                  <span className="font-bold uppercase text-accent">
                    {theme.mainColor}
                  </span>
                  <br />
                  Back color:{" "}
                  <span className="font-bold uppercase text-text-100">
                    {theme.backColor}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
