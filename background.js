import { DEFAULT_INSTALL_SHORTCUTS } from "./default-shortcuts.js";
import {
  DEFAULT_SETTINGS,
  getShortcuts,
  getSettings,
  saveSettings,
  isSidebarEmbedOpenMode,
  applyPopoutOpenModeToSettings,
  resolveLauncherMode,
  shouldHandleStorageUpdate,
  shouldSyncLauncherFromSettingsChange,
  normalizeStoredSettings,
  ensureLocalShortcutsCache,
  ensureLocalSettingsCache,
  hasStoredSettings,
  hasSavedShortcuts,
  INSTALL_LOCAL_SEED_KEY,
} from "./shared.js";
import { initI18n, t } from "./i18n.js";
import {
  openShortcutPopout,
  removeStalePopouts,
  syncOpenPopoutsIfChanged,
  handlePopoutNavigationCommitted,
} from "./popout.js";
import {
  openShortcutInSidePanel,
  clearSidebarEmbedRequest,
  getSidebarEmbedRequest,
  syncOpenEmbedIfChanged,
} from "./sidebar-embed.js";
import { clearResumeOnUrlChange, pruneResumeUrls } from "./popout-resume.js";
import { applyLauncherMode, applyLauncherModeFromSettings, persistAndApplyLauncherMode } from "./launcher.js";
import { registerContextMenu, setupContextMenuListener } from "./context-menu.js";
import { syncEmbedMobileUa, handleMobileNavigationCommitted } from "./mobile-ua.js";

setupContextMenuListener();

chrome.webNavigation.onCommitted.addListener((details) => {
  handlePopoutNavigationCommitted(details);
  handleMobileNavigationCommitted(details);
});

async function updateActionTitle() {
  await initI18n();
  const settings = await getSettings();
  const mode = resolveLauncherMode(settings);
  const key = mode === "menu" ? "actionTitleMenu" : "actionTitleSidebar";
  await chrome.action.setTitle({ title: t(key) });
  await registerContextMenu();
}

async function getActionPinnedToToolbar() {
  try {
    const { isOnToolbar } = await chrome.action.getUserSettings();
    return Boolean(isOnToolbar);
  } catch {
    return true;
  }
}

async function syncLauncherFromSettings(prevSettings, nextRaw) {
  let settings = nextRaw ? normalizeStoredSettings(nextRaw) : await getSettings();

  if (prevSettings) {
    const wasEmbed = isSidebarEmbedOpenMode(prevSettings);
    const nowEmbed = isSidebarEmbedOpenMode(settings);
    if (wasEmbed && !nowEmbed) {
      await clearSidebarEmbedRequest();
      await syncEmbedMobileUa(false);
    } else if (!wasEmbed && nowEmbed) {
      await removeStalePopouts([]);
    }
  }

  if (isSidebarEmbedOpenMode(settings)) {
    if (settings.launcherMode !== "menu") {
      settings.launcherMode = "menu";
      await saveSettings(settings);
    }
    await applyLauncherMode("menu");
  } else {
    if (settings.experimentalSidebarBrowse === true) {
      settings = applyPopoutOpenModeToSettings(settings, "popout");
      await saveSettings(settings);
    }
    await applyLauncherModeFromSettings(settings);
  }
  await updateActionTitle();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SYNC_LAUNCHER") {
    syncLauncherFromSettings()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === "SET_LAUNCHER_MODE") {
    persistAndApplyLauncherMode(message.mode)
      .then(async (result) => {
        if (result.ok) await updateActionTitle();
        sendResponse(result);
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === "GET_ACTION_PINNED") {
    getActionPinnedToToolbar()
      .then((pinned) => sendResponse({ ok: true, pinned }))
      .catch(() => sendResponse({ ok: true, pinned: true }));
    return true;
  }

  if (message?.type === "SET_ACTION_TITLE") {
    updateActionTitle()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === "SYNC_EMBED_MOBILE_UA") {
    syncEmbedMobileUa(Boolean(message.mobile), message.url ?? null)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === "OPEN_SHORTCUT") {
    (async () => {
      const shortcuts = await getShortcuts();
      const shortcut = shortcuts.find((s) => s.id === message.shortcutId);
      if (!shortcut) {
        sendResponse({ ok: false, error: "not_found" });
        return;
      }
      const settings = await getSettings();
      const forcePopout = Boolean(message.forcePopout);
      if (isSidebarEmbedOpenMode(settings) && !forcePopout) {
        await openShortcutInSidePanel(shortcut, {
          fromStart: Boolean(message.fromStart),
          openPanel: false,
        });
      } else {
        await openShortcutPopout(shortcut, {
          fromStart: Boolean(message.fromStart),
        });
      }
      sendResponse({ ok: true });
    })().catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

/** sync 到达时覆盖 local 预置；空列表表示用户曾清空全部入口 */
async function recoverUserShortcutsFromSync(syncList) {
  if (!Array.isArray(syncList)) return;

  if (syncList.length === 0) {
    try {
      const stored = await chrome.storage.local.get(INSTALL_LOCAL_SEED_KEY);
      if (!stored[INSTALL_LOCAL_SEED_KEY]) return;
      await chrome.storage.local.set({ shortcuts: [] });
      await chrome.storage.local.remove(INSTALL_LOCAL_SEED_KEY);
    } catch {
      /* */
    }
    return;
  }

  await ensureLocalShortcutsCache(syncList);
}

async function onShortcutsStorageChanged(prev, list, area) {
  const ids = list.map((s) => s.id);
  const embed = await getSidebarEmbedRequest();
  if (embed?.shortcutId && !ids.includes(embed.shortcutId)) {
    await clearSidebarEmbedRequest();
  }
  await clearResumeOnUrlChange(prev, list);
  await pruneResumeUrls(ids);
  await removeStalePopouts(ids);
  await syncOpenPopoutsIfChanged(prev, list);
  await syncOpenEmbedIfChanged(prev, list);
  if (area === "sync") {
    await recoverUserShortcutsFromSync(list);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (changes.settings?.newValue) {
    if (shouldHandleStorageUpdate(area, "settings", changes.settings.newValue)) {
      const next = changes.settings.newValue;
      const prev = changes.settings.oldValue ?? {};
      if (shouldSyncLauncherFromSettingsChange(prev, next)) {
        syncLauncherFromSettings(prev, next).catch(() => {});
      } else if (next.locale !== prev?.locale) {
        updateActionTitle().catch(() => {});
      }
    }
  }

  if (changes.shortcuts) {
    const list = changes.shortcuts.newValue ?? [];
    if (!shouldHandleStorageUpdate(area, "shortcuts", list)) {
      return;
    }
    const prev = changes.shortcuts.oldValue ?? [];
    onShortcutsStorageChanged(prev, list, area).catch(() => {});
  }
});

async function restoreEmbedMobileUaFromSession() {
  const settings = await getSettings();
  if (!isSidebarEmbedOpenMode(settings)) return;

  const embed = await getSidebarEmbedRequest();
  if (!embed?.url) return;

  await syncEmbedMobileUa(embed.mobile, embed.url);
}

/** @type {Promise<void> | null} */
let bootstrapPromise = null;

function bootstrapServiceWorker() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await syncLauncherFromSettings();
        await restoreEmbedMobileUaFromSession();
      } catch {
        bootstrapPromise = null;
        throw new Error("bootstrap_failed");
      }
    })();
  }
  return bootstrapPromise;
}

chrome.runtime.onStartup.addListener(() => {
  bootstrapServiceWorker().catch(() => {});
});

/** 仅写入 local；绝不调用 saveShortcuts，避免预置上传到 sync */
async function seedDefaultShortcutsLocal() {
  if (await hasSavedShortcuts()) return;

  await chrome.storage.local.set({
    shortcuts: DEFAULT_INSTALL_SHORTCUTS.map((item) => ({
      id: crypto.randomUUID(),
      title: item.title,
      url: item.url,
      mobile: item.mobile ?? true,
    })),
    [INSTALL_LOCAL_SEED_KEY]: true,
  });
}

async function initOnFirstInstall() {
  if (await hasStoredSettings()) {
    await ensureLocalSettingsCache(await getSettings());
  } else {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  const existing = await getShortcuts();
  if (existing.length > 0 || (await hasSavedShortcuts())) {
    if (existing.length > 0) {
      await ensureLocalShortcutsCache(existing);
    }
    await chrome.storage.local.remove(INSTALL_LOCAL_SEED_KEY);
    return;
  }

  await seedDefaultShortcutsLocal();
}

bootstrapServiceWorker().catch(() => {});

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === "install") {
      await initOnFirstInstall();
    }
    await bootstrapServiceWorker();
  } catch {
    /* install/update setup failed */
  }
});
