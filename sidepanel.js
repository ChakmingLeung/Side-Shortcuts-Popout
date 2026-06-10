import { initLauncherList } from "./launcher-list.js";
import { switchToMenuFromSidepanel } from "./launcher.js";
import { initSidebarEmbedView } from "./sidebar-embed.js";
import { getSettings, isSidebarEmbedOpenMode, resolveLauncherMode, shouldHandleStorageUpdate } from "./shared.js";

document.getElementById("btn-switch-menu")?.addEventListener("click", () => {
  switchToMenuFromSidepanel().catch(() => {});
});

async function syncSwitchMenuUi() {
  const settings = await getSettings();
  const btn = document.getElementById("btn-switch-menu");
  if (btn) btn.hidden = isSidebarEmbedOpenMode(settings);
}

/** 侧栏列表模式：未 Pin 到工具栏时显示固定扩展提示 */
async function syncPinToolbarHint() {
  const hint = document.getElementById("pin-toolbar-hint");
  if (!hint) return;

  const settings = await getSettings();
  if (resolveLauncherMode(settings) !== "sidebar") {
    hint.hidden = true;
    return;
  }

  try {
    const res = await chrome.runtime.sendMessage({ type: "GET_ACTION_PINNED" });
    hint.hidden = Boolean(res?.ok && res.pinned);
  } catch {
    hint.hidden = false;
  }
}

function schedulePinToolbarHintSync() {
  syncPinToolbarHint().catch(() => {});
}

async function boot() {
  await Promise.all([syncSwitchMenuUi(), syncPinToolbarHint()].map((p) => p.catch(() => {})));
  const embedView = initSidebarEmbedView();
  const launcher = await initLauncherList({
    variant: "sidebar",
    attachStorageListener: false,
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    embedView.handleStorageChange(changes, area);
    launcher.handleStorageChange(changes, area).catch(() => {});
    if (
      changes.settings?.newValue &&
      shouldHandleStorageUpdate(area, "settings", changes.settings.newValue)
    ) {
      syncSwitchMenuUi().catch(() => {});
      schedulePinToolbarHintSync();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") schedulePinToolbarHintSync();
  });
  window.addEventListener("focus", schedulePinToolbarHintSync);
}

boot().catch(() => {});
