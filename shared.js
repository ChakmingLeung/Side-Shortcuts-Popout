const STORAGE_KEY = "shortcuts";

const LAST_KEY = "lastShortcutId";

const SETTINGS_KEY = "settings";



export const DEFAULT_SETTINGS = {

  defaultMobileMode: true,

  /** null = follow browser; "zh" | "en" */

  locale: null,

};



/**

 * 仅对确认存在对应移动站且路径兼容的域名做主机映射（小窗打开时使用）。

 */

const HOST_TO_MOBILE = {

  "www.bilibili.com": "m.bilibili.com",

  "bilibili.com": "m.bilibili.com",

  "www.weibo.com": "m.weibo.cn",

  "weibo.com": "m.weibo.cn",

};



/** 同时写入本机 local + 账号 sync；重载扩展不会清空，登录浏览器账号可跨设备同步 */
async function storageSet(key, value) {
  await chrome.storage.local.set({ [key]: value });
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch {
    /* 未登录、同步关闭或超出 sync 配额时仅保留本机副本 */
  }
}

async function readShortcutsFromAreas() {
  let syncList;
  let localList;
  try {
    syncList = (await chrome.storage.sync.get(STORAGE_KEY))[STORAGE_KEY];
  } catch {
    /* sync 不可用 */
  }
  try {
    localList = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  } catch {
    /* */
  }
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
  try {
    const sync = (await chrome.storage.sync.get(LAST_KEY))[LAST_KEY];
    if (sync) return sync;
  } catch {
    /* */
  }
  try {
    return (await chrome.storage.local.get(LAST_KEY))[LAST_KEY] ?? null;
  } catch {
    return null;
  }
}

export async function setLastShortcutId(id) {
  await storageSet(LAST_KEY, id);
}

export async function hasStoredSettings() {
  try {
    const sync = await chrome.storage.sync.get(SETTINGS_KEY);
    if (sync[SETTINGS_KEY]) return true;
  } catch {
    /* */
  }
  try {
    const local = await chrome.storage.local.get(SETTINGS_KEY);
    return Boolean(local[SETTINGS_KEY]);
  } catch {
    return false;
  }
}

export async function getSettings() {
  let stored = {};
  try {
    stored = { ...(await chrome.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY] };
  } catch {
    /* */
  }
  try {
    stored = { ...stored, ...(await chrome.storage.sync.get(SETTINGS_KEY))[SETTINGS_KEY] };
  } catch {
    /* */
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings) {
  await storageSet(SETTINGS_KEY, settings);
}



const DEFAULT_FAVICON_FALLBACK = "🔗";

/**
 * 与书签栏一致：优先 Chrome 已缓存的站点图标（需 manifest 中 favicon 权限），再尝试常见回退源。
 * @returns {string[]}
 */
export function getFaviconCandidateUrls(urlString, size = 32) {
  const pageUrl = normalizeUrl(urlString);
  if (!pageUrl) return [];

  const urls = [];

  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      const favicon = new URL(chrome.runtime.getURL("/_favicon/"));
      favicon.searchParams.set("pageUrl", pageUrl);
      favicon.searchParams.set("size", String(size));
      urls.push(favicon.toString());
    }
  } catch {
    /* */
  }

  try {
    const u = new URL(pageUrl);
    urls.push(`${u.origin}/favicon.ico`);
    urls.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=${size}`
    );
    urls.push(`https://icons.duckduckgo.com/ip3/${u.hostname}.ico`);
  } catch {
    /* */
  }

  return [...new Set(urls)];
}

/** @returns {string | null} 首选 favicon URL */
export function getFaviconUrl(urlString, size = 32) {
  const candidates = getFaviconCandidateUrls(urlString, size);
  return candidates[0] ?? null;
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

/**
 * 根据网址创建图标节点（img + 多级回退，效果接近浏览器书签）
 * @param {string} url
 * @param {{ size?: number, className?: string }} [opts]
 */
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

    if (!mapped || mapped === host) {

      return null;

    }

    url.hostname = mapped;

    return url.toString();

  } catch {

    return null;

  }

}



export function shouldUseMobile(shortcut, settings) {

  if (shortcut.mobile === true) return true;

  if (shortcut.mobile === false) return false;

  return settings.defaultMobileMode !== false;

}



export async function resolveLoadUrl(shortcut) {

  const settings = await getSettings();

  const canonical = normalizeUrl(shortcut.url);

  if (!shouldUseMobile(shortcut, settings)) {

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

