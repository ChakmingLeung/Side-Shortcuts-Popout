import {
  getShortcuts,
  getLastShortcutId,
  createShortcutIcon,
  escapeHtml,
} from "./shared.js";
import { initI18n, applyDocumentI18n, applyToolbarI18n, t } from "./i18n.js";
import { initTheme, applyTheme } from "./theme.js";

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * @param {{ mode: "menu" | "sidebar", variant: "popup" | "sidebar", closeOnOpen?: boolean }} opts
 */
export async function initLauncherList({ variant, closeOnOpen = false }) {
  const shortcutList = document.getElementById("shortcut-list");
  const emptyState = document.getElementById("empty-state");
  const btnSettings = document.getElementById("btn-settings");
  const btnAddFirst = document.getElementById("btn-add-first");
  const isSidebar = variant === "sidebar";

  let shortcutsCache = [];
  let lastOpenedId = null;
  let shortcutContextMenu = null;

  function removeShortcutContextMenu() {
    shortcutContextMenu?.remove();
    shortcutContextMenu = null;
  }

  function sidebarHighlightId() {
    return lastOpenedId && shortcutsCache.some((s) => s.id === lastOpenedId) ? lastOpenedId : null;
  }

  function showShortcutContextMenu(clientX, clientY, shortcut) {
    removeShortcutContextMenu();
    const menu = document.createElement("div");
    menu.className = "shortcut-context-menu";
    menu.setAttribute("role", "menu");

    const item = document.createElement("button");
    item.type = "button";
    item.className = "shortcut-context-menu-item";
    item.textContent = t("openFromStart");
    item.addEventListener("click", () => {
      removeShortcutContextMenu();
      openShortcut(shortcut, { fromStart: true });
    });
    menu.append(item);
    document.body.append(menu);
    shortcutContextMenu = menu;

    const pad = 8;
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(pad, Math.min(clientX, window.innerWidth - rect.width - pad))}px`;
    menu.style.top = `${Math.max(pad, Math.min(clientY, window.innerHeight - rect.height - pad))}px`;
  }

  document.addEventListener("click", () => removeShortcutContextMenu());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") removeShortcutContextMenu();
  });

  function highlightActive(activeId) {
    shortcutList.querySelectorAll(".shortcut-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === activeId);
    });
  }

  async function openShortcut(shortcut, { fromStart = false } = {}) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: "OPEN_SHORTCUT",
        shortcutId: shortcut.id,
        fromStart,
      });
      if (!res?.ok) return;
      if (isSidebar) {
        lastOpenedId = shortcut.id;
        highlightActive(shortcut.id);
      } else if (closeOnOpen) {
        window.close();
      }
    } catch {
      /* service worker unavailable */
    }
  }

  function renderShortcuts(shortcuts) {
    shortcutsCache = shortcuts;
    emptyState.hidden = shortcuts.length > 0;
    const fragment = document.createDocumentFragment();

    for (const item of shortcuts) {
      const li = document.createElement("li");
      li.className = "shortcut-item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shortcut-btn";
      if (isSidebar) btn.dataset.id = item.id;
      btn.title = `${item.title}\n${t("openFromStartShift")}`;
      btn.setAttribute("aria-label", item.title);

      if (isSidebar) {
        const text = document.createElement("span");
        text.className = "shortcut-text";
        text.innerHTML = `<span class="shortcut-title">${escapeHtml(item.title)}</span><span class="shortcut-url">${escapeHtml(hostFromUrl(item.url))}</span>`;
        btn.append(createShortcutIcon(item.url, { className: "shortcut-icon" }), text);
      } else {
        const title = document.createElement("span");
        title.className = "shortcut-title";
        title.textContent = item.title;
        btn.append(createShortcutIcon(item.url, { className: "shortcut-icon" }), title);
      }

      btn.addEventListener("click", (e) => {
        openShortcut(item, { fromStart: e.shiftKey });
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showShortcutContextMenu(e.clientX, e.clientY, item);
      });
      li.appendChild(btn);
      fragment.appendChild(li);
    }

    shortcutList.replaceChildren(fragment);

    if (isSidebar) {
      highlightActive(sidebarHighlightId());
    }
  }

  const closePage = () => {
    if (closeOnOpen) window.close();
  };

  btnSettings.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    closePage();
  });
  btnAddFirst.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    closePage();
  });

  chrome.storage.onChanged.addListener(async (changes) => {
    if (changes.settings?.newValue) {
      const settings = changes.settings.newValue;
      if (settings.theme !== undefined) applyTheme(settings.theme);
      await initI18n();
      applyDocumentI18n();
      applyToolbarI18n();
    }

    if (isSidebar && changes.lastShortcutId) {
      lastOpenedId = changes.lastShortcutId.newValue ?? null;
      highlightActive(sidebarHighlightId());
    }

    if (changes.shortcuts) {
      shortcutsCache = changes.shortcuts.newValue ?? [];
      renderShortcuts(shortcutsCache);
    }
  });

  await initTheme();
  await initI18n();
  applyDocumentI18n();
  applyToolbarI18n();

  if (isSidebar) {
    const [shortcuts, lastId] = await Promise.all([getShortcuts(), getLastShortcutId()]);
    shortcutsCache = shortcuts;
    lastOpenedId = lastId;
  } else {
    shortcutsCache = await getShortcuts();
  }
  renderShortcuts(shortcutsCache);
}
