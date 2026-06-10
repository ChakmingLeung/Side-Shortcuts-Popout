import { initLauncherList } from "./launcher-list.js";
import { switchToMenuFromSidepanel } from "./launcher.js";
import { initSidebarEmbedView } from "./sidebar-embed.js";

document.getElementById("btn-switch-menu")?.addEventListener("click", () => {
  switchToMenuFromSidepanel();
});

async function boot() {
  const embedView = initSidebarEmbedView();
  const launcher = await initLauncherList({
    variant: "sidebar",
    attachStorageListener: false,
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    embedView.handleStorageChange(changes, area);
    launcher.handleStorageChange(changes, area).catch(() => {});
  });
}

boot().catch(() => {});
