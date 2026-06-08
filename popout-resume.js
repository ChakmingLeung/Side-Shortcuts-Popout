import { isValidUrl, normalizeUrl } from "./shared.js";

const SESSION_KEY = "popoutResume";
const FLUSH_MS = 250;

/** @type {Record<string, { url: string }> | null} */
let resumeMap = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let resumeFlushTimer = null;

/** @returns {boolean} */
export function isValidResumeUrl(url) {
  return typeof url === "string" && isValidUrl(url);
}

async function loadResumeMapFromSession() {
  try {
    const stored = await chrome.storage.session.get(SESSION_KEY);
    const map = stored[SESSION_KEY];
    return map && typeof map === "object" ? { ...map } : {};
  } catch {
    return {};
  }
}

async function ensureResumeMap() {
  if (!resumeMap) resumeMap = await loadResumeMapFromSession();
  return resumeMap;
}

async function flushResumeMap() {
  if (!resumeMap) return;
  try {
    await chrome.storage.session.set({ [SESSION_KEY]: resumeMap });
  } catch {
    /* session 不可用 */
  }
}

function scheduleResumeFlush() {
  if (resumeFlushTimer != null) clearTimeout(resumeFlushTimer);
  resumeFlushTimer = setTimeout(() => {
    resumeFlushTimer = null;
    flushResumeMap().catch(() => {});
  }, FLUSH_MS);
}

/** @returns {Promise<string | null>} */
export async function getResumeUrl(shortcutId) {
  if (!shortcutId) return null;
  const map = await ensureResumeMap();
  const url = map[shortcutId]?.url;
  return isValidResumeUrl(url) ? url : null;
}

export async function setResumeUrl(shortcutId, url) {
  if (!shortcutId || !isValidResumeUrl(url)) return;
  const map = await ensureResumeMap();
  if (map[shortcutId]?.url === url) return;
  map[shortcutId] = { url };
  scheduleResumeFlush();
}

export async function clearResumeUrl(shortcutId) {
  if (!shortcutId) return;
  const map = await ensureResumeMap();
  if (!(shortcutId in map)) return;
  delete map[shortcutId];
  await flushResumeMap();
}

/** 删除入口后清理 session 中的续看 URL */
export async function pruneResumeUrls(validIds) {
  const valid = new Set(validIds);
  const map = await ensureResumeMap();
  let changed = false;
  for (const id of Object.keys(map)) {
    if (valid.has(id)) continue;
    delete map[id];
    changed = true;
  }
  if (changed) await flushResumeMap();
}

/** 设置里改了起始 URL 时清续看缓存 */
export async function clearResumeOnUrlChange(prevList, nextList) {
  if (!Array.isArray(prevList) || !Array.isArray(nextList)) return;
  const prevById = new Map(prevList.map((s) => [s.id, s]));
  for (const next of nextList) {
    const prev = prevById.get(next.id);
    if (!prev) continue;
    if (normalizeUrl(prev.url) !== normalizeUrl(next.url)) {
      await clearResumeUrl(next.id);
    }
  }
}

export async function persistResumeFromTab(shortcutId, tabId) {
  if (!shortcutId || tabId == null) return;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isValidResumeUrl(tab.url)) return;
    const map = await ensureResumeMap();
    map[shortcutId] = { url: tab.url };
    await flushResumeMap();
  } catch {
    /* tab 已关闭 */
  }
}
