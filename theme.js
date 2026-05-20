import { getSettings, saveSettings } from "./shared.js";

export const THEME_VALUES = ["system", "light", "dark"];

export function normalizeTheme(value) {
  return THEME_VALUES.includes(value) ? value : "system";
}

/** @param {"system" | "light" | "dark"} theme */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = normalizeTheme(theme);
}

export async function initTheme() {
  const settings = await getSettings();
  applyTheme(settings.theme);
}

export function syncThemeSelect(select, settings) {
  if (!select) return;
  select.value = normalizeTheme(settings?.theme ?? "system");
}

export async function setThemePreference(theme) {
  const settings = await getSettings();
  settings.theme = normalizeTheme(theme);
  await saveSettings(settings);
  applyTheme(settings.theme);
  return settings.theme;
}
