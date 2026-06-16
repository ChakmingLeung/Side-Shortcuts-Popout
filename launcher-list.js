import {
  getShortcuts,
  getLastShortcutId,
  getSettings,
  isSidebarEmbedOpenMode,
  shouldHandleStorageUpdate,
  createShortcutIcon,
  escapeHtml,
  normalizeUrl,
  isValidUrl,
} from "./shared.js";
import {
  openSidePanelFromPopup,
  prepareSidebarEmbedFromShortcut,
} from "./sidebar-embed.js";
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
 * @param {{ variant: "popup" | "sidebar", closeOnOpen?: boolean, attachStorageListener?: boolean }} opts
 */
export async function initLauncherList({
  variant,
  closeOnOpen = false,
  attachStorageListener = true,
}) {
  const shortcutList = document.getElementById("shortcut-list");
  const emptyState = document.getElementById("empty-state");
  const btnSettings = document.getElementById("btn-settings");
  const btnAddFirst = document.getElementById("btn-add-first");
  const isSidebar = variant === "sidebar";

  let openErrorEl = document.getElementById("launcher-open-error");
  if (!openErrorEl && shortcutList?.parentElement) {
    openErrorEl = document.createElement("p");
    openErrorEl.id = "launcher-open-error";
    openErrorEl.className = "launcher-open-error";
    openErrorEl.hidden = true;
    shortcutList.parentElement.insertBefore(openErrorEl, shortcutList);
  }

  function showOpenError(key) {
    if (!openErrorEl) return;
    openErrorEl.textContent = t(key);
    openErrorEl.hidden = false;
  }

  function hideOpenError() {
    if (openErrorEl) openErrorEl.hidden = true;
  }

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

    function appendMenuItem(labelKey, onSelect) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "shortcut-context-menu-item";
      item.textContent = t(labelKey);
      item.addEventListener("click", () => {
        removeShortcutContextMenu();
        onSelect();
      });
      menu.append(item);
    }

    appendMenuItem("openFromStart", () => {
      openShortcut(shortcut, { fromStart: true });
    });
    appendMenuItem("openInTab", () => {
      openShortcutInTab(shortcut);
    });

    document.body.append(menu);
    shortcutContextMenu = menu;

    const pad = 8;
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(pad, Math.min(clientX, window.innerWidth - rect.width - pad))}px`;
    menu.style.top = `${Math.max(pad, Math.min(clientY, window.innerHeight - rect.height - pad))}px`;
  }

  async function openShortcutInTab(shortcut) {
    hideOpenError();
    if (!isValidUrl(shortcut.url)) {
      showOpenError("errUrlInvalid");
      return;
    }
    const url = normalizeUrl(shortcut.url);
    try {
      await chrome.tabs.create({ url, active: true });
    } catch {
      showOpenError("errOpenFailed");
    }
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
    hideOpenError();
    try {
      const settings = await getSettings();
      const sidebarEmbed = isSidebarEmbedOpenMode(settings);

      if (sidebarEmbed) {
        try {
          await prepareSidebarEmbedFromShortcut(shortcut, { fromStart });
          if (!isSidebar) {
            await openSidePanelFromPopup();
            if (closeOnOpen) window.close();
          } else {
            lastOpenedId = shortcut.id;
            highlightActive(shortcut.id);
          }
        } catch (err) {
          const key =
            err instanceof Error && err.message === "no_window"
              ? "errOpenNoWindow"
              : "errOpenFailed";
          showOpenError(key);
        }
        return;
      }

      const res = await chrome.runtime.sendMessage({
        type: "OPEN_SHORTCUT",
        shortcutId: shortcut.id,
        fromStart,
        source: isSidebar ? "sidebar" : "popup",
      });
      if (!res?.ok) {
        const key = res?.error === "not_found" ? "errOpenNotFound" : "errOpenFailed";
        showOpenError(key);
        return;
      }

      if (isSidebar) {
        lastOpenedId = shortcut.id;
        highlightActive(shortcut.id);
      } else if (closeOnOpen) {
        window.close();
      }
    } catch {
      showOpenError("errOpenFailed");
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

  async function handleStorageChange(changes, area) {
    if (
      changes.settings?.newValue &&
      shouldHandleStorageUpdate(area, "settings", changes.settings.newValue)
    ) {
      const settings = changes.settings.newValue;
      const prev = changes.settings.oldValue ?? {};
      if (settings.theme !== undefined) applyTheme(settings.theme);
      if (settings.locale !== prev.locale) {
        await initI18n();
        applyDocumentI18n();
        applyToolbarI18n();
      }
    }

    if (isSidebar && changes.lastShortcutId) {
      lastOpenedId = changes.lastShortcutId.newValue ?? null;
      highlightActive(sidebarHighlightId());
    }

    if (changes.shortcuts) {
      const list = changes.shortcuts.newValue ?? [];
      if (!shouldHandleStorageUpdate(area, "shortcuts", list)) return;
      shortcutsCache = list;
      renderShortcuts(shortcutsCache);
    }
  }

  if (attachStorageListener) {
    chrome.storage.onChanged.addListener((changes, area) => {
      handleStorageChange(changes, area).catch(() => {});
    });
  }

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
  return { handleStorageChange, showOpenError };
}
