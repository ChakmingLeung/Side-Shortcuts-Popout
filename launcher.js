import { getSettings, saveSettings, normalizeLauncherMode, isSidebarEmbedOpenMode } from "./shared.js";
import { resolveBrowserWindowIdForSidePanel } from "./sidebar-embed.js";

const POPUP_PATH = "popup.html";

export function resolveLauncherMode(settings) {
  if (isSidebarEmbedOpenMode(settings)) return "menu";
  return normalizeLauncherMode(settings?.launcherMode);
}

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

/** Side panel → menu mode (best-effort openPopup, then close side panel). */
export async function switchToMenuFromSidepanel() {
  const windowId = await resolveBrowserWindowIdForSidePanel();

  if (windowId != null) {
    try {
      await chrome.action.openPopup({ windowId });
    } catch {
      /* user gesture or popup unavailable */
    }
  }

  await recordLauncherMode("menu");
  await applyLauncherMode("menu");

  if (windowId != null) {
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
  if (isSidebarEmbedOpenMode(settings)) return;

  const windowId = await resolveBrowserWindowIdForSidePanel();
  if (windowId == null) return;

  await recordLauncherMode("sidebar");
  await applyLauncherMode("sidebar");

  try {
    await chrome.sidePanel.open({ windowId });
  } catch {
    /* user gesture or panel unavailable */
  }

  window.close();
}
