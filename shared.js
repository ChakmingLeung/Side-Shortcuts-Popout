const STORAGE_KEY = "shortcuts";
const LAST_KEY = "lastShortcutId";
const SETTINGS_KEY = "settings";

/** @internal 首次安装 local 预置标记（勿写入 sync） */
export const INSTALL_LOCAL_SEED_KEY = "shortcutsLocalSeed";

/** 作者 GitHub 主页（设置页「作者」链接） */
export const GITHUB_AUTHOR_URL = "https://github.com/ChakmingLeung";

/** 开源仓库（设置页仓库 CTA） */
export const GITHUB_REPO_URL =
  "https://github.com/ChakmingLeung/Side-Shortcuts-Popout";

export const DEFAULT_SETTINGS = {
  /** null = follow browser; "zh" | "en" */
  locale: null,
  /** "system" | "light" | "dark" */
  theme: "system",
  /** "menu" | "sidebar" — toolbar icon opens popup menu or side panel list */
  launcherMode: "sidebar",
  /** "popout" | "sidebar" — popup menu shortcut opens popout window or side panel embed */
  popoutOpenMode: "popout",
};

export function normalizePopoutOpenMode(settingsOrValue) {
  if (typeof settingsOrValue === "object" && settingsOrValue !== null) {
    const settings = settingsOrValue;
    if (settings.popoutOpenMode === "sidebar") return "sidebar";
    if (settings.popoutOpenMode === "popout") return "popout";
    if (settings.experimentalSidebarBrowse === true) return "sidebar";
    return "popout";
  }
  return settingsOrValue === "sidebar" ? "sidebar" : "popout";
}

/** @param {Record<string, unknown>} settings */
export function applyPopoutOpenModeToSettings(settings, mode) {
  const next = { ...settings };
  next.popoutOpenMode = normalizePopoutOpenMode(mode);
  delete next.experimentalSidebarBrowse;
  return next;
}

export function isSidebarEmbedOpenMode(settings) {
  return normalizePopoutOpenMode(settings) === "sidebar";
}

/** settings 变更时是否需要重新同步工具栏打开方式（embed 模式须持续强制 popup 菜单） */
export function shouldSyncLauncherFromSettingsChange(prev, next) {
  const prevSettings = { ...DEFAULT_SETTINGS, ...prev };
  const nextSettings = { ...DEFAULT_SETTINGS, ...next };
  if (isSidebarEmbedOpenMode(nextSettings)) return true;
  return (
    nextSettings.launcherMode !== prevSettings.launcherMode ||
    normalizePopoutOpenMode(prevSettings) !== normalizePopoutOpenMode(nextSettings) ||
    next.experimentalSidebarBrowse !== prev?.experimentalSidebarBrowse ||
    isSidebarEmbedOpenMode(prevSettings) !== isSidebarEmbedOpenMode(nextSettings)
  );
}

export function normalizeLauncherMode(value) {
  return value === "sidebar" ? "sidebar" : "menu";
}

const DEFAULT_FAVICON_FALLBACK = "🔗";

async function storageSet(key, value) {
  await chrome.storage.local.set({ [key]: value });
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch {
    /* 未登录、同步关闭或超出 sync 配额时仅保留本机副本 */
  }
}

/** local+sync 双写时跳过 sync 回声的重复处理 */
const localStorageEcho = new Map();

/** 进程内 storage 读缓存（各页面/SW 独立，onChanged 时失效） */
const storageCache = {
  settings: /** @type {Record<string, unknown> | null} */ (null),
  shortcuts: /** @type {Array<unknown> | null} */ (null),
  lastShortcutId: /** @type {string | null | undefined} */ (undefined),
};

function mergeSettings(localVal, syncVal) {
  const merged = { ...DEFAULT_SETTINGS, ...localVal, ...syncVal };
  merged.popoutOpenMode = normalizePopoutOpenMode(merged);
  return merged;
}

function mergeShortcuts(syncList, localList) {
  if (Array.isArray(syncList) && syncList.length > 0) return syncList;
  if (Array.isArray(localList) && localList.length > 0) return localList;
  if (Array.isArray(syncList)) return syncList;
  if (Array.isArray(localList)) return localList;
  return [];
}

function invalidateStorageCache(key) {
  if (key === SETTINGS_KEY) storageCache.settings = null;
  if (key === STORAGE_KEY) storageCache.shortcuts = null;
  if (key === LAST_KEY) storageCache.lastShortcutId = undefined;
}

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" && area !== "sync") return;
    if (changes[SETTINGS_KEY]) invalidateStorageCache(SETTINGS_KEY);
    if (changes[STORAGE_KEY]) invalidateStorageCache(STORAGE_KEY);
    if (changes[LAST_KEY]) invalidateStorageCache(LAST_KEY);
  });
}

export function shouldHandleStorageUpdate(area, key, newValue) {
  const signature = JSON.stringify(newValue ?? null);
  if (area === "local") {
    localStorageEcho.set(key, signature);
    return true;
  }
  if (area === "sync") {
    if (localStorageEcho.get(key) === signature) {
      localStorageEcho.delete(key);
      return false;
    }
    localStorageEcho.set(key, signature);
    return true;
  }
  return true;
}

async function readFromAreas(key) {
  let syncVal;
  let localVal;
  try {
    const [syncStored, localStored] = await Promise.all([
      chrome.storage.sync.get(key).catch(() => ({})),
      chrome.storage.local.get(key).catch(() => ({})),
    ]);
    syncVal = syncStored[key];
    localVal = localStored[key];
  } catch {
    /* storage 不可用 */
  }
  return { syncVal, localVal };
}

async function readShortcutsFromAreas() {
  if (storageCache.shortcuts !== null) return storageCache.shortcuts;
  const { syncVal: syncList, localVal: localList } = await readFromAreas(STORAGE_KEY);
  const merged = mergeShortcuts(syncList, localList);
  storageCache.shortcuts = merged;
  return merged;
}

/** 是否已有用户保存的快捷入口（sync 已有该键、或 local 有条目 → 不写预置） */
export async function hasSavedShortcuts() {
  const { syncVal, localVal } = await readFromAreas(STORAGE_KEY);
  if (Array.isArray(syncVal)) return true;
  if (Array.isArray(localVal) && localVal.length > 0) return true;
  return false;
}

/** 云端已有数据、本机 local 为空时，把 shortcuts 写入 local 便于离线读取 */
export async function ensureLocalShortcutsCache(shortcuts) {
  if (!Array.isArray(shortcuts) || shortcuts.length === 0) return;
  try {
    const stored = await chrome.storage.local.get([STORAGE_KEY, INSTALL_LOCAL_SEED_KEY]);
    const localList = stored[STORAGE_KEY];
    const wasEarlySeed = stored[INSTALL_LOCAL_SEED_KEY];
    if (!wasEarlySeed && Array.isArray(localList) && localList.length > 0) return;
    await chrome.storage.local.set({ [STORAGE_KEY]: shortcuts });
    if (wasEarlySeed) {
      await chrome.storage.local.remove(INSTALL_LOCAL_SEED_KEY);
    }
  } catch {
    /* */
  }
}

export async function ensureLocalSettingsCache(settings) {
  if (!settings || typeof settings !== "object") return;
  try {
    const local = (await chrome.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY];
    if (local) return;
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  } catch {
    /* */
  }
}

export async function getShortcuts() {
  return readShortcutsFromAreas();
}

export async function saveShortcuts(shortcuts) {
  await storageSet(STORAGE_KEY, shortcuts);
  storageCache.shortcuts = shortcuts;
}

export async function getLastShortcutId() {
  if (storageCache.lastShortcutId !== undefined) {
    return storageCache.lastShortcutId;
  }
  const { syncVal, localVal } = await readFromAreas(LAST_KEY);
  const id = syncVal ?? localVal ?? null;
  storageCache.lastShortcutId = id;
  return id;
}

export async function setLastShortcutId(id) {
  await storageSet(LAST_KEY, id);
  storageCache.lastShortcutId = id;
}

export async function hasStoredSettings() {
  const { syncVal, localVal } = await readFromAreas(SETTINGS_KEY);
  return Boolean(syncVal || localVal);
}

export async function getSettings() {
  if (storageCache.settings) return storageCache.settings;
  const { syncVal, localVal } = await readFromAreas(SETTINGS_KEY);
  const merged = mergeSettings(localVal, syncVal);
  storageCache.settings = merged;
  return merged;
}

export async function saveSettings(settings) {
  await storageSet(SETTINGS_KEY, settings);
  storageCache.settings = mergeSettings(null, settings);
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * 与书签栏一致：Chrome 缓存 favicon（需 manifest favicon 权限），再尝试站点 /favicon.ico。
 * @returns {string[]}
 */
export function getFaviconCandidateUrls(urlString, size = 32) {
  const pageUrl = normalizeUrl(urlString);
  if (!pageUrl) return [];

  const urls = [];
  try {
    if (chrome.runtime?.getURL) {
      const favicon = new URL(chrome.runtime.getURL("/_favicon/"));
      favicon.searchParams.set("pageUrl", pageUrl);
      favicon.searchParams.set("size", String(size));
      urls.push(favicon.toString());
    }
  } catch {
    /* */
  }
  try {
    urls.push(`${new URL(pageUrl).origin}/favicon.ico`);
  } catch {
    /* */
  }
  return urls;
}

function tryLoadFaviconImage(wrap, className, size, candidates, index = 0) {
  if (index >= candidates.length) {
    appendFaviconFallback(wrap, className);
    return;
  }

  const img = document.createElement("img");
  img.className = className;
  img.width = size;
  img.height = size;
  img.alt = "";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.src = candidates[index];
  img.addEventListener(
    "error",
    () => {
      img.remove();
      tryLoadFaviconImage(wrap, className, size, candidates, index + 1);
    },
    { once: true }
  );
  wrap.append(img);
}

export function createShortcutIcon(url, { size = 22, className = "shortcut-icon" } = {}) {
  const wrap = document.createElement("span");
  wrap.className = `${className}-wrap`;

  const candidates = getFaviconCandidateUrls(url, 32);
  if (candidates.length > 0) {
    tryLoadFaviconImage(wrap, className, size, candidates);
  } else {
    appendFaviconFallback(wrap, className);
  }

  return wrap;
}

function appendFaviconFallback(wrap, className) {
  const fallback = document.createElement("span");
  fallback.className = `${className}-fallback`;
  fallback.setAttribute("aria-hidden", "true");
  fallback.textContent = DEFAULT_FAVICON_FALLBACK;
  wrap.append(fallback);
}

export function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidUrl(raw) {
  try {
    const url = new URL(normalizeUrl(raw));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** 未显式关闭时视为移动版（含历史数据 mobile: null） */
export function shouldUseMobile(shortcut) {
  return shortcut.mobile !== false;
}

/** @param {Array<{ id: string, url: string }>} shortcuts */
export function findShortcutByUrl(urlString, shortcuts) {
  const canonical = normalizeUrl(urlString);
  return shortcuts.find((s) => normalizeUrl(s.url) === canonical) ?? null;
}

export const EPHEMERAL_POPOUT_PREFIX = "__ctx__:";

export function contextPopoutShortcutId(urlString) {
  return `${EPHEMERAL_POPOUT_PREFIX}${normalizeUrl(urlString)}`;
}

export function isEphemeralPopoutId(shortcutId) {
  return typeof shortcutId === "string" && shortcutId.startsWith(EPHEMERAL_POPOUT_PREFIX);
}

export function resolveLoadUrl(shortcut) {
  return {
    loadUrl: normalizeUrl(shortcut.url),
    mobile: shouldUseMobile(shortcut),
  };
}
