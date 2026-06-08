import { initLauncherList } from "./launcher-list.js";
import { switchToMenuFromSidepanel } from "./launcher.js";

document.getElementById("btn-switch-menu")?.addEventListener("click", () => {
  switchToMenuFromSidepanel();
});

initLauncherList({ variant: "sidebar" });
