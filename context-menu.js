import {
  getShortcuts,
  normalizeUrl,
  findShortcutByUrl,
  contextPopoutShortcutId,
  isValidUrl,
} from "./shared.js";
import { initI18n, t } from "./i18n.js";
import { openShortcutPopout } from "./popout.js";

export const CONTEXT_MENU_OPEN_POPOUT = "open-in-popout";

let registerQueue = Promise.resolve();

function promisifyContextMenu(fn) {
  return new Promise((resolve) => {
    fn(() => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

async function doRegisterContextMenu() {
  await initI18n();
  const title = t("contextMenuOpenPopout");
  const props = {
    id: CONTEXT_MENU_OPEN_POPOUT,
    title,
    contexts: ["page"],
    documentUrlPatterns: ["http://*/*", "https://*/*"],
  };

  await promisifyContextMenu((done) => chrome.contextMenus.remove(CONTEXT_MENU_OPEN_POPOUT, done));

  await new Promise((resolve) => {
    chrome.contextMenus.create(props, () => {
      const err = chrome.runtime.lastError;
      if (err?.message?.includes("duplicate id")) {
        chrome.contextMenus.update(CONTEXT_MENU_OPEN_POPOUT, { title }, () => {
          void chrome.runtime.lastError;
          resolve();
        });
        return;
      }
      void err;
      resolve();
    });
  });
}

export function registerContextMenu() {
  registerQueue = registerQueue.then(doRegisterContextMenu).catch(() => {});
  return registerQueue;
}

export function setupContextMenuListener() {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_OPEN_POPOUT) return;
    const url = tab?.url;
    if (!isValidUrl(url)) return;

    try {
      const shortcuts = await getShortcuts();
      const saved = findShortcutByUrl(url, shortcuts);
      const shortcut = saved ?? {
        id: contextPopoutShortcutId(url),
        url: normalizeUrl(url),
        mobile: true,
      };
      await openShortcutPopout(shortcut, { updateLastShortcut: Boolean(saved) });
    } catch {
      /* popout failed */
    }
  });
}
