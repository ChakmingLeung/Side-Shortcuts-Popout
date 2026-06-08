import { initLauncherList } from "./launcher-list.js";
import { switchToSidebarFromPopup } from "./launcher.js";

document.getElementById("btn-switch-sidebar")?.addEventListener("click", () => {
  switchToSidebarFromPopup();
});

initLauncherList({ variant: "popup", closeOnOpen: true });
