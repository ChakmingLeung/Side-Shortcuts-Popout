import { getSettings, isSidebarEmbedOpenMode, shouldHandleStorageUpdate } from "./shared.js";
import { initLauncherList } from "./launcher-list.js";
import { switchToSidebarFromPopup } from "./launcher.js";

document.getElementById("btn-switch-sidebar")?.addEventListener("click", () => {
  switchToSidebarFromPopup();
});

async function syncExperimentalPopupUi() {
  const settings = await getSettings();
  const btn = document.getElementById("btn-switch-sidebar");
  if (btn) btn.hidden = isSidebarEmbedOpenMode(settings);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (
    changes.settings?.newValue &&
    shouldHandleStorageUpdate(area, "settings", changes.settings.newValue)
  ) {
    syncExperimentalPopupUi().catch(() => {});
  }
});

async function boot() {
  await syncExperimentalPopupUi().catch(() => {});
  await initLauncherList({ variant: "popup", closeOnOpen: true });
}

boot().catch(() => {});
