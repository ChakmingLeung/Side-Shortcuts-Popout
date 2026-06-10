async function isNormalBrowserWindow(windowId) {
  try {
    const win = await chrome.windows.get(windowId);
    return win.type === "normal";
  } catch {
    return false;
  }
}

/** 扩展弹出菜单的 getCurrent 往往是 popup 窗口，需解析到 normal 浏览器窗口。 */
export async function resolveBrowserWindowIdForSidePanel() {
  try {
    const current = await chrome.windows.getCurrent();
    if (current?.type === "normal" && current.id != null) {
      return current.id;
    }
  } catch {
    /* */
  }

  const normalWins = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const focusedNormal = normalWins.find((win) => win.focused);
  if (focusedNormal?.id != null) {
    return focusedNormal.id;
  }

  const activeTabs = await chrome.tabs.query({ active: true });
  for (const tab of activeTabs) {
    if (tab.windowId == null) continue;
    if (await isNormalBrowserWindow(tab.windowId)) {
      return tab.windowId;
    }
  }

  return normalWins[0]?.id ?? null;
}
