import { isValidUrl, normalizeUrl, shouldUseMobile } from "./shared.js";

const SESSION_KEY = "popoutResume";
export const RESUME_FLUSH_MS = 250;
const FLUSH_MS = RESUME_FLUSH_MS;
const MIN_POPOUT_WIDTH = 200;
const MIN_POPOUT_HEIGHT = 200;
const MAX_POPOUT_WIDTH = 2000;
const MAX_POPOUT_HEIGHT = 2000;

/** @type {Record<string, { url?: string, left?: number, top?: number, width?: number, height?: number }> | null} */
let resumeMap = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let resumeFlushTimer = null;

/** @returns {boolean} */
export function isValidResumeUrl(url) {
  return typeof url === "string" && isValidUrl(url);
}

/**
 * @param {{ left?: unknown, top?: unknown, width?: unknown, height?: unknown }} entry
 * @returns {{ left: number, top: number, width: number, height: number } | null}
 */
export function normalizeResumeBounds(entry) {
  if (!entry || typeof entry !== "object") return null;
  const { left, top, width, height } = entry;
  if (
    typeof left !== "number" ||
    typeof top !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }
  const clampedWidth = Math.round(
    Math.min(MAX_POPOUT_WIDTH, Math.max(MIN_POPOUT_WIDTH, width))
  );
  const clampedHeight = Math.round(
    Math.min(MAX_POPOUT_HEIGHT, Math.max(MIN_POPOUT_HEIGHT, height))
  );
  return {
    left: Math.round(left),
    top: Math.round(top),
    width: clampedWidth,
    height: clampedHeight,
  };
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

/** @returns {Promise<{ left: number, top: number, width: number, height: number } | null>} */
export async function getResumeBounds(shortcutId) {
  if (!shortcutId) return null;
  const map = await ensureResumeMap();
  return normalizeResumeBounds(map[shortcutId]);
}

export async function setResumeUrl(shortcutId, url) {
  if (!shortcutId || !isValidResumeUrl(url)) return;
  const map = await ensureResumeMap();
  const prev = map[shortcutId] ?? {};
  if (prev.url === url) return;
  map[shortcutId] = { ...prev, url };
  scheduleResumeFlush();
}

export async function setResumeBounds(shortcutId, bounds) {
  if (!shortcutId) return;
  const normalized = normalizeResumeBounds(bounds);
  if (!normalized) return;
  const map = await ensureResumeMap();
  const prev = map[shortcutId] ?? {};
  const next = { ...prev, ...normalized };
  if (
    prev.left === next.left &&
    prev.top === next.top &&
    prev.width === next.width &&
    prev.height === next.height
  ) {
    return;
  }
  map[shortcutId] = next;
  scheduleResumeFlush();
}

export async function clearResumeUrl(shortcutId) {
  if (!shortcutId) return;
  const map = await ensureResumeMap();
  if (!(shortcutId in map)) return;
  delete map[shortcutId];
  await flushResumeMap();
}

/** 删除入口后清理 session 中的续看缓存 */
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

/** 设置里改了起始 URL 或移动/桌面时清续看缓存 */
export async function clearResumeOnUrlChange(prevList, nextList) {
  if (!Array.isArray(prevList) || !Array.isArray(nextList)) return;
  const prevById = new Map(prevList.map((s) => [s.id, s]));
  for (const next of nextList) {
    const prev = prevById.get(next.id);
    if (!prev) continue;
    if (
      normalizeUrl(prev.url) !== normalizeUrl(next.url) ||
      shouldUseMobile(prev) !== shouldUseMobile(next)
    ) {
      await clearResumeUrl(next.id);
    }
  }
}

export async function persistResumeFromPopout(shortcutId, tabId, windowId) {
  if (!shortcutId || tabId == null || windowId == null) return;
  try {
    const [tab, win] = await Promise.all([
      chrome.tabs.get(tabId),
      chrome.windows.get(windowId),
    ]);
    const map = await ensureResumeMap();
    const next = { ...(map[shortcutId] ?? {}) };
    if (isValidResumeUrl(tab.url)) next.url = tab.url;
    const bounds = normalizeResumeBounds(win);
    if (bounds) Object.assign(next, bounds);
    if (!next.url && !bounds) return;
    map[shortcutId] = next;
    await flushResumeMap();
  } catch {
    /* 窗口或标签已关闭 */
  }
}
