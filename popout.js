import {
  resolveLoadUrl,
  setLastShortcutId,
  normalizeUrl,
  shouldUseMobile,
  isEphemeralPopoutId,
} from "./shared.js";
import {
  applyMobileUserAgentForTab,
  clearMobileUserAgentForTab,
  MOBILE_VIEWPORT_WIDTH,
} from "./mobile-ua.js";
import {
  getResumeUrl,
  getResumeBounds,
  clearResumeUrl,
  isValidResumeUrl,
  persistResumeFromPopout,
  setResumeUrl,
  setResumeBounds,
  RESUME_FLUSH_MS,
} from "./popout-resume.js";

const POPOUT_WIDTH_DESKTOP = 420;
const POPOUT_HEIGHT = 720;
const POPOUT_EDGE = 12;
const POPOUT_CASCADE = 28;

/** @type {Map<string, { windowId: number, tabId: number }>} */
const popoutWindows = new Map();
/** @type {Map<number, string>} */
const tabIdToShortcutId = new Map();
/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const boundsFlushTimers = new Map();

function popoutWidth(mobile) {
  return mobile ? MOBILE_VIEWPORT_WIDTH : POPOUT_WIDTH_DESKTOP;
}

function bindPopoutTab(shortcutId, windowId, tabId) {
  popoutWindows.set(shortcutId, { windowId, tabId });
  tabIdToShortcutId.set(tabId, shortcutId);
}

function unbindPopoutTab(tabId) {
  tabIdToShortcutId.delete(tabId);
}

function getPopoutLayout(openCount, anchorWindow, mobile) {
  const width = popoutWidth(mobile);
  let left = 100 + openCount * POPOUT_CASCADE;
  let top = 32 + openCount * POPOUT_CASCADE;

  if (anchorWindow?.width && anchorWindow.left != null) {
    left =
      anchorWindow.left +
      anchorWindow.width -
      width -
      POPOUT_EDGE -
      openCount * POPOUT_CASCADE;
    top = (anchorWindow.top ?? 0) + 32 + openCount * POPOUT_CASCADE;
  }

  return {
    left: Math.max(8, left),
    top: Math.max(0, top),
    width,
    height: POPOUT_HEIGHT,
  };
}

async function resolvePopoutLayout(openCount, anchorWindow, mobile, shortcutId, fromStart) {
  if (!fromStart) {
    const saved = await getResumeBounds(shortcutId);
    if (saved) return saved;
  }
  return getPopoutLayout(openCount, anchorWindow, mobile);
}

function clearBoundsFlushTimer(shortcutId) {
  const prev = boundsFlushTimers.get(shortcutId);
  if (prev == null) return;
  clearTimeout(prev);
  boundsFlushTimers.delete(shortcutId);
}

function scheduleBoundsPersist(shortcutId, windowId) {
  clearBoundsFlushTimer(shortcutId);
  boundsFlushTimers.set(
    shortcutId,
    setTimeout(() => {
      boundsFlushTimers.delete(shortcutId);
      if (!popoutWindows.has(shortcutId)) return;
      chrome.windows
        .get(windowId)
        .then((win) => setResumeBounds(shortcutId, win))
        .catch(() => {});
    }, RESUME_FLUSH_MS)
  );
}

async function countOpenPopouts() {
  let count = 0;
  for (const [shortcutId, { windowId, tabId }] of popoutWindows) {
    try {
      await chrome.windows.get(windowId);
      count++;
    } catch {
      clearBoundsFlushTimer(shortcutId);
      clearMobileUserAgentForTab(tabId).catch(() => {});
      unbindPopoutTab(tabId);
      popoutWindows.delete(shortcutId);
    }
  }
  return count;
}

function untrackWindow(windowId) {
  for (const [shortcutId, info] of popoutWindows) {
    if (info.windowId !== windowId) continue;
    clearBoundsFlushTimer(shortcutId);
    persistResumeFromPopout(shortcutId, info.tabId, info.windowId).catch(() => {});
    clearMobileUserAgentForTab(info.tabId).catch(() => {});
    unbindPopoutTab(info.tabId);
    popoutWindows.delete(shortcutId);
  }
}

chrome.windows.onRemoved.addListener(untrackWindow);

chrome.windows.onBoundsChanged.addListener((window) => {
  for (const [shortcutId, info] of popoutWindows) {
    if (info.windowId !== window.id) continue;
    scheduleBoundsPersist(shortcutId, window.id);
    break;
  }
});

export function handlePopoutNavigationCommitted(details) {
  if (details.frameId !== 0) return;
  const shortcutId = tabIdToShortcutId.get(details.tabId);
  if (!shortcutId || !isValidResumeUrl(details.url)) return;
  setResumeUrl(shortcutId, details.url).catch(() => {});
}

export async function removeStalePopouts(validIds) {
  const valid = new Set(validIds);
  for (const [shortcutId, { windowId }] of popoutWindows) {
    if (isEphemeralPopoutId(shortcutId)) continue;
    if (valid.has(shortcutId)) continue;
    try {
      await chrome.windows.remove(windowId);
    } catch {
      untrackWindow(windowId);
    }
  }
}

function shortcutOpenConfigChanged(prev, next) {
  if (!prev || !next) return false;
  return (
    normalizeUrl(prev.url) !== normalizeUrl(next.url) ||
    shouldUseMobile(prev) !== shouldUseMobile(next)
  );
}

/** 设置里改了网址或打开方式时，刷新已打开的小窗 */
export async function syncOpenPopoutsIfChanged(prevList, nextList) {
  if (!Array.isArray(prevList) || !Array.isArray(nextList)) return;
  const prevById = new Map(prevList.map((s) => [s.id, s]));
  for (const next of nextList) {
    if (!popoutWindows.has(next.id)) continue;
    const prev = prevById.get(next.id);
    if (!shortcutOpenConfigChanged(prev, next)) continue;
    const mobileChanged =
      prev != null && shouldUseMobile(prev) !== shouldUseMobile(next);
    await openShortcutPopout(next, {
      updateLastShortcut: false,
      reload: true,
      resetMobileWidth: mobileChanged,
    });
  }
}

async function configureTabForLoad(tabId, loadUrl, mobile) {
  if (mobile) {
    await applyMobileUserAgentForTab(tabId);
  } else {
    await clearMobileUserAgentForTab(tabId);
  }
  await chrome.tabs.update(tabId, { url: loadUrl, active: true });
}

/**
 * @param {{ id: string, url: string, mobile?: boolean | null }} shortcut
 * @param {{ updateLastShortcut?: boolean, reload?: boolean, fromStart?: boolean, resetMobileWidth?: boolean }} [options]
 */
export async function openShortcutPopout(
  shortcut,
  {
    updateLastShortcut = true,
    reload = false,
    fromStart = false,
    resetMobileWidth = false,
  } = {}
) {
  const { loadUrl, mobile } = resolveLoadUrl(shortcut);

  if (fromStart) {
    await clearResumeUrl(shortcut.id);
  }

  const existing = popoutWindows.get(shortcut.id);

  if (existing) {
    try {
      const win = await chrome.windows.get(existing.windowId, { populate: true });
      const tabId = win.tabs?.[0]?.id ?? existing.tabId;
      if (tabId != null) {
        if (fromStart) {
          let anchorWindow;
          try {
            anchorWindow = await chrome.windows.getLastFocused();
          } catch {
            /* no focused window */
          }
          const layout = getPopoutLayout(0, anchorWindow, mobile);
          await chrome.windows.update(existing.windowId, { ...layout, focused: true });
        } else if (resetMobileWidth) {
          await chrome.windows.update(existing.windowId, {
            width: popoutWidth(mobile),
            focused: true,
          });
        } else {
          await chrome.windows.update(existing.windowId, { focused: true });
        }
        if (reload || fromStart) {
          await configureTabForLoad(tabId, loadUrl, mobile);
        } else {
          await chrome.tabs.update(tabId, { active: true });
        }
        bindPopoutTab(shortcut.id, existing.windowId, tabId);
      } else {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
      if (updateLastShortcut) await setLastShortcutId(shortcut.id);
      return { windowId: existing.windowId, reused: true };
    } catch {
      clearMobileUserAgentForTab(existing.tabId).catch(() => {});
      unbindPopoutTab(existing.tabId);
      popoutWindows.delete(shortcut.id);
    }
  }

  const urlToLoad = fromStart ? loadUrl : (await getResumeUrl(shortcut.id)) ?? loadUrl;
  const openCount = await countOpenPopouts();
  let anchorWindow;
  try {
    anchorWindow = await chrome.windows.getLastFocused();
  } catch {
    /* no focused window */
  }
  const layout = await resolvePopoutLayout(
    openCount,
    anchorWindow,
    mobile,
    shortcut.id,
    fromStart
  );
  const created = await chrome.windows.create({
    url: "about:blank",
    type: "popup",
    focused: true,
    ...layout,
  });

  const windowId = created?.id;
  const tabId = created?.tabs?.[0]?.id;
  if (windowId != null && tabId != null) {
    await configureTabForLoad(tabId, urlToLoad, mobile);
    bindPopoutTab(shortcut.id, windowId, tabId);
    setResumeBounds(shortcut.id, layout).catch(() => {});
  }

  if (updateLastShortcut) await setLastShortcutId(shortcut.id);
  return { windowId: windowId ?? null, reused: false };
}
