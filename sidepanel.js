import {
  getShortcuts,
  getLastShortcutId,
  setLastShortcutId,
  resolveLoadUrl,
  createShortcutIcon,
  escapeHtml,
} from "./shared.js";
import { initI18n, t, applyDocumentI18n, applyToolbarI18n } from "./i18n.js";
import { initTheme, applyTheme } from "./theme.js";

const shortcutList = document.getElementById("shortcut-list");
const emptyState = document.getElementById("empty-state");
const btnSettings = document.getElementById("btn-settings");
const btnAddFirst = document.getElementById("btn-add-first");

let shortcutsCache = [];
let lastOpenedId = null;
/** @type {Map<string, Window>} */
const popoutWindows = new Map();

const POPOUT_WIDTH = 420;
const POPOUT_HEIGHT_OFFSET = 48;
const POPOUT_EDGE = 12;
const POPOUT_CASCADE = 28;

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getPopoutLayout() {
  const openCount = [...popoutWindows.values()].filter((w) => w && !w.closed).length;
  const height = Math.min(900, screen.availHeight - POPOUT_HEIGHT_OFFSET);
  const left =
    screen.availWidth - POPOUT_WIDTH - POPOUT_EDGE - openCount * POPOUT_CASCADE;
  const top = 32 + openCount * POPOUT_CASCADE;
  return { left: Math.max(8, left), top, width: POPOUT_WIDTH, height };
}

function trackPopoutWindow(shortcutId, win) {
  popoutWindows.set(shortcutId, win);
  const timer = setInterval(() => {
    if (!win.closed) return;
    popoutWindows.delete(shortcutId);
    clearInterval(timer);
  }, 800);
}

function openPopoutWindow(shortcut, url) {
  const targetUrl = url || shortcut.url;
  const existing = popoutWindows.get(shortcut.id);
  if (existing && !existing.closed) {
    existing.location.href = targetUrl;
    existing.focus();
    return existing;
  }

  const { left, top, width, height } = getPopoutLayout();
  const features = [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
  const win = window.open(targetUrl, `sidebar-popout-${shortcut.id}`, features);
  if (win) trackPopoutWindow(shortcut.id, win);
  return win;
}

async function openShortcut(shortcut) {
  const { loadUrl } = await resolveLoadUrl(shortcut);
  openPopoutWindow(shortcut, loadUrl);
  lastOpenedId = shortcut.id;
  await setLastShortcutId(shortcut.id);
  highlightActive(shortcut.id);
}

function highlightActive(activeId) {
  shortcutList.querySelectorAll(".shortcut-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === activeId);
  });
}

function removeStalePopouts(shortcuts) {
  const validIds = new Set(shortcuts.map((s) => s.id));
  for (const id of [...popoutWindows.keys()]) {
    if (validIds.has(id)) continue;
    const win = popoutWindows.get(id);
    if (win && !win.closed) win.close();
    popoutWindows.delete(id);
    if (lastOpenedId === id) lastOpenedId = null;
  }
}

async function renderShortcuts(shortcuts) {
  shortcutsCache = shortcuts;
  removeStalePopouts(shortcuts);

  const fragment = document.createDocumentFragment();
  emptyState.hidden = shortcuts.length > 0;

  for (const item of shortcuts) {
    const li = document.createElement("li");
    li.className = "shortcut-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shortcut-btn";
    btn.dataset.id = item.id;
    const text = document.createElement("span");
    text.className = "shortcut-text";
    text.innerHTML = `
      <span class="shortcut-title">${escapeHtml(item.title)}</span>
      <span class="shortcut-url">${escapeHtml(hostFromUrl(item.url))}</span>
    `;
    btn.append(createShortcutIcon(item.url, { className: "shortcut-icon" }), text);
    btn.addEventListener("click", () => openShortcut(item));
    li.appendChild(btn);
    fragment.appendChild(li);
  }

  shortcutList.replaceChildren(fragment);

  const highlightId =
    lastOpenedId && shortcuts.some((s) => s.id === lastOpenedId)
      ? lastOpenedId
      : null;
  highlightActive(highlightId);
}

function applySidepanelI18n() {
  applyDocumentI18n();
  applyToolbarI18n();
}

async function init() {
  await initTheme();
  await initI18n();
  applySidepanelI18n();

  shortcutsCache = await getShortcuts();
  lastOpenedId = await getLastShortcutId();
  await renderShortcuts(shortcutsCache);
}

btnSettings.addEventListener("click", () => chrome.runtime.openOptionsPage());
btnAddFirst.addEventListener("click", () => chrome.runtime.openOptionsPage());

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.settings?.newValue) {
    const settings = changes.settings.newValue;
    if (settings.theme !== undefined) applyTheme(settings.theme);
    await initI18n();
    applySidepanelI18n();
  }

  if (changes.shortcuts) {
    shortcutsCache = changes.shortcuts.newValue ?? [];
    await renderShortcuts(shortcutsCache);
  }
});

init();
