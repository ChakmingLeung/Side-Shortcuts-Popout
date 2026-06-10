import {
  getSettings,
  getLastShortcutId,
  resolveLoadUrl,
  setLastShortcutId,
  isSidebarEmbedOpenMode,
  normalizeUrl,
  shouldUseMobile,
} from "./shared.js";

export const SIDEBAR_EMBED_SESSION_KEY = "sidebarEmbed";

/** @typedef {{ shortcutId: string, url: string, title: string, mobile: boolean, ts: number, fromStart?: boolean }} SidebarEmbedRequest */

export async function getSidebarEmbedRequest() {
  try {
    const stored = await chrome.storage.session.get(SIDEBAR_EMBED_SESSION_KEY);
    return stored[SIDEBAR_EMBED_SESSION_KEY] ?? null;
  } catch {
    return null;
  }
}

/** @param {SidebarEmbedRequest | null} payload */
export async function setSidebarEmbedRequest(payload) {
  if (!payload) {
    await clearSidebarEmbedRequest();
    return;
  }
  await chrome.storage.session.set({ [SIDEBAR_EMBED_SESSION_KEY]: payload });
}

/** @type {{ mobile: boolean | null, url: string | null }} */
let lastNotifiedEmbedUa = { mobile: null, url: null };

async function notifyEmbedMobileUa(mobile, url = null) {
  try {
    await chrome.runtime.sendMessage({
      type: "SYNC_EMBED_MOBILE_UA",
      mobile,
      url,
    });
  } catch {
    /* */
  }
}

async function notifyEmbedMobileUaIfChanged(mobile, url = null) {
  const nextUrl = url ?? null;
  if (lastNotifiedEmbedUa.mobile === mobile && lastNotifiedEmbedUa.url === nextUrl) {
    return;
  }
  lastNotifiedEmbedUa = { mobile, url: nextUrl };
  await notifyEmbedMobileUa(mobile, url);
}

export async function clearSidebarEmbedRequest() {
  try {
    await chrome.storage.session.remove(SIDEBAR_EMBED_SESSION_KEY);
    lastNotifiedEmbedUa = { mobile: null, url: null };
    await notifyEmbedMobileUaIfChanged(false);
  } catch {
    /* */
  }
}

async function isNormalBrowserWindow(windowId) {
  try {
    const win = await chrome.windows.get(windowId);
    return win.type === "normal";
  } catch {
    return false;
  }
}

/** 扩展弹出菜单的 getCurrent 往往是 popup 窗口，需解析到 normal 浏览器窗口。 */
export async function resolveBrowserWindowIdForSidePanel() {
  try {
    const current = await chrome.windows.getCurrent();
    if (current?.type === "normal" && current.id != null) {
      return current.id;
    }
  } catch {
    /* */
  }

  const normalWins = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const focusedNormal = normalWins.find((win) => win.focused);
  if (focusedNormal?.id != null) {
    return focusedNormal.id;
  }

  const activeTabs = await chrome.tabs.query({ active: true });
  for (const tab of activeTabs) {
    if (tab.windowId == null) continue;
    if (await isNormalBrowserWindow(tab.windowId)) {
      return tab.windowId;
    }
  }

  return normalWins[0]?.id ?? null;
}

async function resolveTargetWindowId() {
  return resolveBrowserWindowIdForSidePanel();
}

/**
 * @param {{ id: string, title: string, url: string, mobile?: boolean | null }} shortcut
 * @param {{ fromStart?: boolean }} [options]
 * @returns {Promise<SidebarEmbedRequest>}
 */
export async function prepareSidebarEmbedFromShortcut(
  shortcut,
  { fromStart = false } = {}
) {
  const { loadUrl, mobile } = resolveLoadUrl(shortcut);
  const existing = await getSidebarEmbedRequest();
  const unchanged =
    existing &&
    !fromStart &&
    existing.shortcutId === shortcut.id &&
    normalizeUrl(existing.url) === normalizeUrl(loadUrl) &&
    existing.mobile === mobile;

  if (unchanged) {
    /** @type {SidebarEmbedRequest} */
    const request = { ...existing, title: shortcut.title };
    await notifyEmbedMobileUaIfChanged(mobile, loadUrl);
    if (existing.title !== shortcut.title) {
      await setSidebarEmbedRequest(request);
    }
    const lastId = await getLastShortcutId();
    if (lastId !== shortcut.id) {
      await setLastShortcutId(shortcut.id);
    }
    return request;
  }

  /** @type {SidebarEmbedRequest} */
  const request = {
    shortcutId: shortcut.id,
    url: loadUrl,
    title: shortcut.title,
    mobile,
    ts: Date.now(),
    fromStart,
  };

  // UA 须先于 session 写入，否则侧栏 iframe 已开始导航而 embedMobileUrl 尚未更新
  await notifyEmbedMobileUaIfChanged(mobile, loadUrl);
  await setSidebarEmbedRequest(request);
  const lastId = await getLastShortcutId();
  if (lastId !== shortcut.id) {
    await setLastShortcutId(shortcut.id);
  }
  return request;
}

/**
 * @param {{ id: string, title: string, url: string, mobile?: boolean | null }} shortcut
 * @param {{ fromStart?: boolean, openPanel?: boolean }} [options]
 */
export async function openShortcutInSidePanel(
  shortcut,
  { fromStart = false, openPanel = false } = {}
) {
  await prepareSidebarEmbedFromShortcut(shortcut, { fromStart });

  if (openPanel) {
    const windowId = await resolveTargetWindowId();
    if (windowId == null) {
      throw new Error("no_window");
    }
    await chrome.sidePanel.open({ windowId });
  }
}

function shortcutEmbedLoadChanged(prev, next) {
  if (!prev || !next) return true;
  return (
    normalizeUrl(prev.url) !== normalizeUrl(next.url) ||
    shouldUseMobile(prev) !== shouldUseMobile(next)
  );
}

/** 设置里改了网址或打开方式时，刷新侧栏内嵌 iframe */
export async function syncOpenEmbedIfChanged(prevList, nextList) {
  const settings = await getSettings();
  if (!isSidebarEmbedOpenMode(settings)) return;

  const embed = await getSidebarEmbedRequest();
  if (!embed?.shortcutId) return;

  const next = nextList.find((s) => s.id === embed.shortcutId);
  if (!next) return;

  const prev = Array.isArray(prevList)
    ? prevList.find((s) => s.id === embed.shortcutId)
    : undefined;
  if (!shortcutEmbedLoadChanged(prev, next)) return;

  await prepareSidebarEmbedFromShortcut(next, { fromStart: true });
}

/** 须在弹出菜单的用户手势上下文中调用，否则 sidePanel.open 会失败。 */
export async function openSidePanelFromPopup() {
  const windowId = await resolveBrowserWindowIdForSidePanel();
  if (windowId == null) {
    throw new Error("no_window");
  }
  await chrome.sidePanel.open({ windowId });
}

async function clearEmbedFromStartFlag(request) {
  if (!request.fromStart) return;
  const { fromStart, ...rest } = request;
  try {
    await chrome.storage.session.set({ [SIDEBAR_EMBED_SESSION_KEY]: rest });
  } catch {
    /* */
  }
}

/**
 * Side panel: iframe browse view + session sync.
 */
export function initSidebarEmbedView() {
  const app = document.getElementById("app");
  const embedView = document.getElementById("embed-view");
  const embedFrame = /** @type {HTMLIFrameElement | null} */ (
    document.getElementById("embed-frame")
  );
  const embedLoading = document.getElementById("embed-loading");
  const embedError = document.getElementById("embed-error");
  const btnEmbedPopout = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("btn-embed-popout")
  );

  if (!app || !embedView || !embedFrame) {
    return { handleStorageChange() {} };
  }

  let activeShortcutId = null;
  /** @type {boolean | null} */
  let activeMobile = null;

  function normalizeEmbedUrl(url) {
    const normalized = normalizeUrl(String(url ?? ""));
    if (!normalized) return "";
    try {
      return new URL(normalized).href;
    } catch {
      return normalized;
    }
  }

  function getFrameSrc() {
    const raw = embedFrame.getAttribute("src") ?? embedFrame.src ?? "";
    return raw ? normalizeEmbedUrl(raw) : "";
  }

  function showEmbedLoading() {
    if (embedLoading) embedLoading.hidden = false;
  }

  function hideEmbedLoading() {
    if (embedLoading) embedLoading.hidden = true;
  }

  function hideEmbedError() {
    if (embedError) embedError.hidden = true;
  }

  function showEmbedError() {
    hideEmbedLoading();
    if (embedError) embedError.hidden = false;
  }

  function isChromeErrorFrame() {
    try {
      const href = embedFrame.contentWindow?.location?.href ?? "";
      return href.startsWith("chrome-error://");
    } catch {
      return false;
    }
  }

  function showListView() {
    embedView.hidden = true;
    app.hidden = false;
    embedView.classList.remove("embed-view--mobile");
    embedFrame.removeAttribute("src");
    hideEmbedLoading();
    hideEmbedError();
    activeShortcutId = null;
    activeMobile = null;
  }

  async function syncEmbedUaBeforeLoad(request) {
    try {
      await chrome.runtime.sendMessage({
        type: "SYNC_EMBED_MOBILE_UA",
        mobile: request.mobile,
        url: request.url,
      });
    } catch {
      /* */
    }
  }

  /** @param {SidebarEmbedRequest} request */
  async function showEmbedView(request) {
    app.hidden = true;
    embedView.hidden = false;
    embedView.classList.toggle("embed-view--mobile", request.mobile);

    const nextUrl = normalizeEmbedUrl(request.url);
    const prevUrl = getFrameSrc();
    const shortcutChanged = activeShortcutId !== request.shortcutId;
    const urlChanged = prevUrl !== nextUrl;
    const mobileChanged = activeMobile !== request.mobile;
    const shouldLoad =
      request.fromStart || shortcutChanged || urlChanged || mobileChanged || !prevUrl;

    activeShortcutId = request.shortcutId;
    activeMobile = request.mobile;

    hideEmbedError();

    if (shouldLoad && nextUrl) {
      showEmbedLoading();
      if (shortcutChanged && prevUrl) {
        embedFrame.removeAttribute("src");
      }
      await syncEmbedUaBeforeLoad(request);
      embedFrame.src = nextUrl;
    } else if (!shouldLoad) {
      hideEmbedLoading();
    }
  }

  function isEmbedSessionFromStartOnlyChange(oldVal, newVal) {
    if (!oldVal?.url || !newVal?.url) return false;
    if (!oldVal.fromStart || newVal.fromStart) return false;
    return (
      oldVal.shortcutId === newVal.shortcutId &&
      normalizeEmbedUrl(oldVal.url) === normalizeEmbedUrl(newVal.url) &&
      oldVal.mobile === newVal.mobile
    );
  }

  embedFrame.addEventListener("load", () => {
    if (embedView.hidden) return;
    hideEmbedLoading();
    getSidebarEmbedRequest()
      .then((request) => {
        if (request?.fromStart) {
          clearEmbedFromStartFlag(request);
        }
      })
      .catch(() => {});
    if (isChromeErrorFrame()) {
      showEmbedError();
    } else {
      hideEmbedError();
    }
  });

  btnEmbedPopout?.addEventListener("click", async () => {
    if (!activeShortcutId || btnEmbedPopout.disabled) return;
    const defaultLabel = btnEmbedPopout.textContent?.trim() || "";
    btnEmbedPopout.disabled = true;
    try {
      const { t } = await import("./i18n.js");
      btnEmbedPopout.textContent = t("embedOpeningPopout");
      const res = await chrome.runtime.sendMessage({
        type: "OPEN_SHORTCUT",
        shortcutId: activeShortcutId,
        fromStart: true,
        source: "sidebar",
        forcePopout: true,
      });
      if (!res?.ok) {
        btnEmbedPopout.textContent = t("errOpenFailed");
        window.setTimeout(() => {
          btnEmbedPopout.textContent = defaultLabel;
          btnEmbedPopout.disabled = false;
        }, 2000);
        return;
      }
      btnEmbedPopout.textContent = defaultLabel;
      btnEmbedPopout.disabled = false;
    } catch {
      btnEmbedPopout.textContent = defaultLabel || btnEmbedPopout.textContent;
      btnEmbedPopout.disabled = false;
    }
  });

  async function applyPendingEmbed() {
    const settings = await getSettings();
    if (!isSidebarEmbedOpenMode(settings)) {
      await clearSidebarEmbedRequest();
      showListView();
      return;
    }

    const request = await getSidebarEmbedRequest();
    if (request?.url) {
      await showEmbedView(request);
    } else {
      showListView();
    }
  }

  function handleStorageChange(changes, area) {
    if (area === "local" || area === "sync") {
      if (
        changes.settings?.newValue !== undefined &&
        !isSidebarEmbedOpenMode(changes.settings.newValue)
      ) {
        clearSidebarEmbedRequest()
          .then(() => showListView())
          .catch(() => showListView());
      }
      return;
    }

    if (area !== "session" || !changes[SIDEBAR_EMBED_SESSION_KEY]) return;

    const change = changes[SIDEBAR_EMBED_SESSION_KEY];
    const next = change.newValue;
    const old = change.oldValue;
    if (next?.url) {
      if (!isEmbedSessionFromStartOnlyChange(old, next)) {
        showEmbedView(next).catch(() => {});
      }
    } else if (activeShortcutId) {
      showListView();
    }
  }

  applyPendingEmbed().catch(() => {});
  return { handleStorageChange };
}
