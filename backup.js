import {
  DEFAULT_SETTINGS,
  getShortcuts,
  saveShortcuts,
  getSettings,
  saveSettings,
  normalizeUrl,
  isValidUrl,
  normalizeLauncherMode,
  normalizePopoutOpenMode,
  isSidebarEmbedOpenMode,
  applyPopoutOpenModeToSettings,
} from "./shared.js";
import { normalizeTheme } from "./theme.js";

export const BACKUP_FORMAT_VERSION = 1;
const APP_ID = "side-shortcuts-popout";

function sanitizeShortcut(raw) {
  if (!raw || typeof raw.title !== "string") return null;
  const title = raw.title.trim();
  if (!title) return null;
  const url = normalizeUrl(String(raw.url ?? ""));
  if (!isValidUrl(url)) return null;

  let mobile = null;
  if (raw.mobile === true) mobile = true;
  else if (raw.mobile === false) mobile = false;

  const id =
    typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : crypto.randomUUID();

  return { id, title: title.slice(0, 40), url, mobile };
}

function sanitizeSettings(raw) {
  if (!raw || typeof raw !== "object") return null;
  const settings = { ...DEFAULT_SETTINGS };
  if (raw.locale === "zh" || raw.locale === "en" || raw.locale === null) {
    settings.locale = raw.locale;
  }
  if (raw.theme !== undefined) {
    settings.theme = normalizeTheme(raw.theme);
  }
  if (raw.launcherMode !== undefined) {
    settings.launcherMode = normalizeLauncherMode(raw.launcherMode);
  }
  if (raw.popoutOpenMode !== undefined) {
    return applyPopoutOpenModeToSettings(settings, raw.popoutOpenMode);
  }
  if (raw.experimentalSidebarBrowse !== undefined) {
    return applyPopoutOpenModeToSettings(
      settings,
      raw.experimentalSidebarBrowse === true ? "sidebar" : "popout"
    );
  }
  return settings;
}

/** @returns {Promise<object>} */
export async function buildBackupPayload() {
  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: APP_ID,
    shortcuts: await getShortcuts(),
    settings: await getSettings(),
  };
}

export function backupFilename() {
  const d = new Date();
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  return `Side-Shortcuts-Popout-backup-${stamp}.json`;
}

/**
 * @param {object} payload
 * @returns {{ shortcuts: object[], settings: object | null, error?: string }}
 */
export function parseBackupPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { shortcuts: [], settings: null, error: "invalidFormat" };
  }

  const list = Array.isArray(payload.shortcuts)
    ? payload.shortcuts
    : Array.isArray(payload)
      ? payload
      : null;

  if (!list) {
    return { shortcuts: [], settings: null, error: "invalidFormat" };
  }

  const shortcuts = [];
  for (const item of list) {
    const s = sanitizeShortcut(item);
    if (s) shortcuts.push(s);
  }

  if (shortcuts.length === 0 && list.length > 0) {
    return { shortcuts: [], settings: null, error: "noValidShortcuts" };
  }

  const settings = sanitizeSettings(payload.settings);
  return { shortcuts, settings };
}

/**
 * @param {string} text
 */
export function parseBackupJson(text) {
  try {
    const data = JSON.parse(text);
    return parseBackupPayload(data);
  } catch {
    return { shortcuts: [], settings: null, error: "invalidJson" };
  }
}

/**
 * @param {{ shortcuts: object[], settings: object | null }} parsed
 * @param {"replace" | "merge"} mode
 */
export async function applyBackupImport(parsed, mode) {
  const { shortcuts: imported, settings: importedSettings } = parsed;

  if (mode === "replace") {
    await saveShortcuts(imported);
    if (importedSettings) {
      await saveSettings(importedSettings);
    }
    return { shortcutCount: imported.length };
  }

  const existing = await getShortcuts();
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const s of imported) {
    byId.set(s.id, s);
  }
  const merged = [...byId.values()];
  await saveShortcuts(merged);

  if (importedSettings) {
    const current = await getSettings();
    await saveSettings({ ...current, ...importedSettings });
  }

  return { shortcutCount: merged.length };
}

export function downloadBackupJson(payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
