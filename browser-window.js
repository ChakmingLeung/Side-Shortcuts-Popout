/** 解析用于布局/侧栏的 normal 浏览器窗口（跳过扩展 popup）。 */
export async function resolveAnchorBrowserWindow() {
  try {
    const current = await chrome.windows.getCurrent();
    if (current?.type === "normal") return current;
  } catch {
    /* */
  }

  try {
    const last = await chrome.windows.getLastFocused();
    if (last?.type === "normal") return last;
  } catch {
    /* */
  }

  const normalWins = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const focusedNormal = normalWins.find((win) => win.focused);
  if (focusedNormal) return focusedNormal;

  const activeTabs = await chrome.tabs.query({ active: true });
  for (const tab of activeTabs) {
    if (tab.windowId == null) continue;
    try {
      const win = await chrome.windows.get(tab.windowId);
      if (win.type === "normal") return win;
    } catch {
      /* */
    }
  }

  return normalWins[0] ?? null;
}

/** 扩展弹出菜单的 getCurrent 往往是 popup 窗口，需解析到 normal 浏览器窗口。 */
export async function resolveBrowserWindowIdForSidePanel() {
  const win = await resolveAnchorBrowserWindow();
  return win?.id ?? null;
}
