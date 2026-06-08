import { getSettings, saveSettings, normalizeLauncherMode } from "./shared.js";

const POPUP_PATH = "popup.html";

export function syncLauncherModeSelect(select, settings) {
  if (!select) return;
  select.value = normalizeLauncherMode(settings?.launcherMode);
}

/** @param {"menu" | "sidebar"} mode */
export async function applyLauncherMode(mode) {
  const launcherMode = normalizeLauncherMode(mode);
  if (launcherMode === "menu") {
    await chrome.action.setPopup({ popup: POPUP_PATH });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  } else {
    await chrome.action.setPopup({ popup: "" });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
  return launcherMode;
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

function withCurrentWindow(fn) {
  chrome.windows.getCurrent((win) => {
    void chrome.runtime.lastError;
    if (win?.id != null) fn(win.id);
  });
}

function closeSidePanel(windowId) {
  chrome.sidePanel.close({ windowId }, () => {
    void chrome.runtime.lastError;
    if (typeof window !== "undefined") window.close();
  });
}

/** Side panel → menu mode (best-effort openPopup, then close side panel). */
export function switchToMenuFromSidepanel() {
  withCurrentWindow((windowId) => {
    chrome.action.setPopup({ popup: POPUP_PATH }, () => {
      void chrome.runtime.lastError;
      chrome.action.openPopup({ windowId }, () => {
        void chrome.runtime.lastError;
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }, () => {
          void chrome.runtime.lastError;
          recordLauncherMode("menu").catch(() => {});
          closeSidePanel(windowId);
        });
      });
    });
  });
}

/** Popup → side panel list, then close popup. */
export function switchToSidebarFromPopup() {
  withCurrentWindow((windowId) => {
    chrome.sidePanel.open({ windowId }, () => {
      if (chrome.runtime.lastError) return;
      chrome.action.setPopup({ popup: "" }, () => {
        void chrome.runtime.lastError;
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }, () => {
          void chrome.runtime.lastError;
          recordLauncherMode("sidebar").catch(() => {});
          window.close();
        });
      });
    });
  });
}
