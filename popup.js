import { getSettings, isSidebarEmbedOpenMode, shouldHandleStorageUpdate } from "./shared.js";
import { initLauncherList } from "./launcher-list.js";
import { switchToSidebarFromPopup } from "./launcher.js";

let showOpenError = () => {};

document.getElementById("btn-switch-sidebar")?.addEventListener("click", async () => {
  const result = await switchToSidebarFromPopup().catch(() => ({ ok: false }));
  if (!result?.ok) {
    const key =
      result?.error === "no_window"
        ? "errOpenNoWindow"
        : "errOpenFailed";
    showOpenError(key);
  }
});

async function syncExperimentalPopupUi() {
  const settings = await getSettings();
  const btn = document.getElementById("btn-switch-sidebar");
  if (btn) btn.hidden = isSidebarEmbedOpenMode(settings);
}

async function boot() {
  await syncExperimentalPopupUi().catch(() => {});
  const launcher = await initLauncherList({
    variant: "popup",
    closeOnOpen: true,
    attachStorageListener: false,
  });
  showOpenError = launcher.showOpenError ?? showOpenError;

  chrome.storage.onChanged.addListener((changes, area) => {
    launcher.handleStorageChange(changes, area).catch(() => {});
    if (
      changes.settings?.newValue &&
      shouldHandleStorageUpdate(area, "settings", changes.settings.newValue)
    ) {
      syncExperimentalPopupUi().catch(() => {});
    }
  });
}

boot().catch(() => {});
