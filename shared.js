const STORAGE_KEY = "shortcuts";
const LAST_KEY = "lastShortcutId";
const SETTINGS_KEY = "settings";

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
};

/** 首次安装时的示例快捷入口 */
export const DEFAULT_INSTALL_SHORTCUTS = [
  { title: "语雀", url: "https://www.yuque.com/" },
  { title: "小红书", url: "https://www.xiaohongshu.com/explore" },
  { title: "抖音", url: "https://www.douyin.com/jingxuan" },
  { title: "Instagram", url: "https://www.instagram.com/" },
  { title: "TikTok", url: "https://www.tiktok.com/" },
];

/**
 * 仅对确认存在对应移动站且路径兼容的域名做主机映射（小窗打开时使用）。
 */
const HOST_TO_MOBILE = {
  "www.bilibili.com": "m.bilibili.com",
  "bilibili.com": "m.bilibili.com",
  "www.weibo.com": "m.weibo.cn",
  "weibo.com": "m.weibo.cn",
};

const DEFAULT_FAVICON_FALLBACK = "🔗";

async function storageSet(key, value) {
  await chrome.storage.local.set({ [key]: value });
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch {
    /* 未登录、同步关闭或超出 sync 配额时仅保留本机副本 */
  }
}

async function readFromAreas(key) {
  let syncVal;
  let localVal;
  try {
    syncVal = (await chrome.storage.sync.get(key))[key];
  } catch {
    /* sync 不可用 */
  }
  try {
    localVal = (await chrome.storage.local.get(key))[key];
  } catch {
    /* */
  }
  return { syncVal, localVal };
}

async function readShortcutsFromAreas() {
  const { syncVal: syncList, localVal: localList } = await readFromAreas(STORAGE_KEY);
  if (Array.isArray(syncList) && syncList.length > 0) return syncList;
  if (Array.isArray(localList) && localList.length > 0) return localList;
  if (Array.isArray(syncList)) return syncList;
  if (Array.isArray(localList)) return localList;
  return [];
}

export async function getShortcuts() {
  return readShortcutsFromAreas();
}

export async function saveShortcuts(shortcuts) {
  await storageSet(STORAGE_KEY, shortcuts);
}

export async function getLastShortcutId() {
  const { syncVal, localVal } = await readFromAreas(LAST_KEY);
  return syncVal ?? localVal ?? null;
}

export async function setLastShortcutId(id) {
  await storageSet(LAST_KEY, id);
}

export async function hasStoredSettings() {
  const { syncVal, localVal } = await readFromAreas(SETTINGS_KEY);
  return Boolean(syncVal || localVal);
}

export async function getSettings() {
  const { syncVal, localVal } = await readFromAreas(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...localVal, ...syncVal };
}

export async function saveSettings(settings) {
  await storageSet(SETTINGS_KEY, settings);
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

export function toMobileUrl(urlString) {
  try {
    const url = new URL(normalizeUrl(urlString));
    const host = url.hostname.toLowerCase();
    const mapped = HOST_TO_MOBILE[host];
    if (!mapped || mapped === host) return null;
    url.hostname = mapped;
    return url.toString();
  } catch {
    return null;
  }
}

/** 未显式关闭时视为移动版（含历史数据 mobile: null） */
export function shouldUseMobile(shortcut) {
  return shortcut.mobile !== false;
}

export async function resolveLoadUrl(shortcut) {
  const canonical = normalizeUrl(shortcut.url);

  if (!shouldUseMobile(shortcut)) {
    return {
      loadUrl: canonical,
      canonicalUrl: canonical,
      mobile: false,
      urlTransformed: false,
    };
  }

  const mobileUrl = toMobileUrl(canonical);
  if (mobileUrl) {
    return {
      loadUrl: mobileUrl,
      canonicalUrl: canonical,
      mobile: true,
      urlTransformed: true,
    };
  }

  return {
    loadUrl: canonical,
    canonicalUrl: canonical,
    mobile: true,
    urlTransformed: false,
  };
}
