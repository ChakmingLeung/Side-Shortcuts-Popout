import { DEFAULT_INSTALL_SHORTCUTS } from "./default-shortcuts.js";
import {
  DEFAULT_SETTINGS,
  getShortcuts,
  getSettings,
  normalizeLauncherMode,
  ensureLocalShortcutsCache,
  ensureLocalSettingsCache,
  hasStoredSettings,
  hasSavedShortcuts,
  INSTALL_LOCAL_SEED_KEY,
} from "./shared.js";
import { initI18n, t } from "./i18n.js";
import { openShortcutPopout, removeStalePopouts, syncOpenPopoutsIfChanged } from "./popout.js";
import { clearResumeOnUrlChange, pruneResumeUrls } from "./popout-resume.js";
import { applyLauncherMode } from "./launcher.js";
import { registerContextMenu, setupContextMenuListener } from "./context-menu.js";

setupContextMenuListener();

async function updateActionTitle() {
  await initI18n();
  const settings = await getSettings();
  const mode = normalizeLauncherMode(settings.launcherMode);
  const key = mode === "menu" ? "actionTitleMenu" : "actionTitleSidebar";
  await chrome.action.setTitle({ title: t(key) });
  await registerContextMenu();
}

async function syncLauncherFromSettings() {
  const settings = await getSettings();
  await applyLauncherMode(settings.launcherMode);
  await updateActionTitle();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SET_ACTION_TITLE") {
    updateActionTitle()
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
      await openShortcutPopout(shortcut, { fromStart: Boolean(message.fromStart) });
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
  await clearResumeOnUrlChange(prev, list);
  await pruneResumeUrls(ids);
  await removeStalePopouts(ids);
  await syncOpenPopoutsIfChanged(prev, list);
  if (area === "sync") {
    await recoverUserShortcutsFromSync(list);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (changes.settings?.newValue) {
    const next = changes.settings.newValue;
    const prev = changes.settings.oldValue;
    if (next.launcherMode !== prev?.launcherMode) {
      syncLauncherFromSettings().catch(() => {});
    } else if (next.locale !== prev?.locale) {
      updateActionTitle().catch(() => {});
    }
  }

  if (changes.shortcuts) {
    const list = changes.shortcuts.newValue ?? [];
    const prev = changes.shortcuts.oldValue ?? [];
    onShortcutsStorageChanged(prev, list, area).catch(() => {});
  }
});

chrome.runtime.onStartup.addListener(() => {
  syncLauncherFromSettings().catch(() => {});
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

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === "install") {
      await initOnFirstInstall();
    }
    await syncLauncherFromSettings();
  } catch {
    /* install/update setup failed */
  }
});
