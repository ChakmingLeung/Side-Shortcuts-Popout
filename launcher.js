import { getSettings, saveSettings, normalizeLauncherMode, isSidebarEmbedOpenMode, resolveLauncherMode } from "./shared.js";
import { resolveBrowserWindowIdForSidePanel } from "./browser-window.js";

const POPUP_PATH = "popup.html";

export { resolveLauncherMode };

export function syncLauncherModeSelect(select, settings) {
  if (!select) return;
  select.value = resolveLauncherMode(settings);
}

/** @param {"menu" | "sidebar"} mode */
export async function applyLauncherMode(mode) {
  const launcherMode = normalizeLauncherMode(mode);
  if (launcherMode === "menu") {
    // 先关闭「点击图标打开侧栏」，再恢复 popup，避免侧栏抢占工具栏点击
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    await chrome.action.setPopup({ popup: POPUP_PATH });
  } else {
    await chrome.action.setPopup({ popup: "" });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
  return launcherMode;
}

export function requestLauncherSyncFromBackground() {
  return chrome.runtime.sendMessage({ type: "SYNC_LAUNCHER" }).catch(() => {});
}

export async function applyLauncherModeFromSettings(settings) {
  return applyLauncherMode(resolveLauncherMode(settings));
}

/** 用户点击切换按钮时写入 settings.launcherMode */
export async function recordLauncherMode(mode) {
  const next = normalizeLauncherMode(mode);
  const settings = await getSettings();
  if (settings.launcherMode === next) return next;
  settings.launcherMode = next;
  await saveSettings(settings);
  return next;
}

/** 在 Service Worker 中持久化并应用工具栏模式（避免侧栏/弹窗页与 SW 缓存竞态） */
export async function persistAndApplyLauncherMode(mode) {
  const requested = normalizeLauncherMode(mode);
  const settings = await getSettings();

  if (isSidebarEmbedOpenMode(settings) && requested !== "menu") {
    return { ok: false, error: "embed_mode" };
  }

  const applied = resolveLauncherMode({
    ...settings,
    launcherMode: isSidebarEmbedOpenMode(settings) ? "menu" : requested,
  });

  settings.launcherMode = applied;
  await saveSettings(settings);
  await applyLauncherMode(applied);
  return { ok: true, mode: applied };
}

/** Side panel → menu mode (best-effort openPopup, then close side panel). */
export async function switchToMenuFromSidepanel() {
  const windowId = await resolveBrowserWindowIdForSidePanel();

  let res;
  try {
    res = await chrome.runtime.sendMessage({ type: "SET_LAUNCHER_MODE", mode: "menu" });
  } catch {
    res = null;
  }
  if (!res?.ok) {
    await recordLauncherMode("menu");
    try {
      res = await chrome.runtime.sendMessage({ type: "SET_LAUNCHER_MODE", mode: "menu" });
    } catch {
      res = null;
    }
    if (!res?.ok) {
      await requestLauncherSyncFromBackground();
    }
  }

  if (windowId != null) {
    try {
      await chrome.action.openPopup({ windowId });
    } catch {
      /* user gesture or popup unavailable */
    }
    try {
      await chrome.sidePanel.close({ windowId });
    } catch {
      /* */
    }
  }

  window.close();
}

/** Popup → side panel list, then close popup. */
export async function switchToSidebarFromPopup() {
  const settings = await getSettings();
  if (isSidebarEmbedOpenMode(settings)) {
    return { ok: false, error: "embed_mode" };
  }

  const windowId = await resolveBrowserWindowIdForSidePanel();
  if (windowId == null) {
    return { ok: false, error: "no_window" };
  }

  let res;
  try {
    res = await chrome.runtime.sendMessage({ type: "SET_LAUNCHER_MODE", mode: "sidebar" });
  } catch {
    res = null;
  }
  if (!res?.ok) {
    await recordLauncherMode("sidebar");
    try {
      res = await chrome.runtime.sendMessage({ type: "SET_LAUNCHER_MODE", mode: "sidebar" });
    } catch {
      res = null;
    }
    if (!res?.ok) {
      await requestLauncherSyncFromBackground();
    }
  }

  try {
    await chrome.sidePanel.open({ windowId });
  } catch {
    return { ok: false, error: "open_failed" };
  }

  window.close();
  return { ok: true };
}
