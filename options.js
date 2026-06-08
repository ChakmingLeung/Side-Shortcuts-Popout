import {
  getShortcuts,
  saveShortcuts,
  getSettings,
  saveSettings,
  normalizeUrl,
  isValidUrl,
  shouldUseMobile,
  createShortcutIcon,
  escapeHtml,
  GITHUB_AUTHOR_URL,
  GITHUB_REPO_URL,
  normalizeLauncherMode,
} from "./shared.js";
import {
  initI18n,
  t,
  applyDocumentI18n,
  setLocalePreference,
  syncLanguageSelect,
} from "./i18n.js";
import { initTheme, syncThemeSelect, setThemePreference, applyTheme } from "./theme.js";
import { syncLauncherModeSelect } from "./launcher.js";
import {
  buildBackupPayload,
  downloadBackupJson,
  parseBackupJson,
  applyBackupImport,
} from "./backup.js";

const form = document.getElementById("shortcut-form");
const formTitle = document.getElementById("form-title");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const mobileModeSelect = document.getElementById("mobile-mode");
const languageSelect = document.getElementById("language");
const themeSelect = document.getElementById("theme");
const launcherModeSelect = document.getElementById("launcher-mode");
const formError = document.getElementById("form-error");
const manageList = document.getElementById("manage-list");
const manageEmpty = document.getElementById("manage-empty");
const btnExportBackup = document.getElementById("btn-export-backup");
const btnImportBackup = document.getElementById("btn-import-backup");
const importPanel = document.getElementById("import-panel");
const importMergeBtn = document.getElementById("import-merge");
const importReplaceBtn = document.getElementById("import-replace");
const importPanelCloseBtn = document.getElementById("import-panel-close");
const importBackupFile = document.getElementById("import-backup-file");
const backupStatus = document.getElementById("backup-status");
/** @type {string | null} 右侧列表内联编辑中的快捷方式 id */
let editingInlineId = null;
/** @type {"merge" | "replace" | null} */
let pendingImportMode = null;
/** @type {string | null} 拖拽排序中的条目 id */
let draggingShortcutId = null;

function newId() {
  return crypto.randomUUID();
}

function mobileFromSelect(value) {
  return value !== "off";
}

function mobileToSelect(mobile) {
  return mobile === false ? "off" : "on";
}

function applyOptionsI18n() {
  applyDocumentI18n();
  if (importPanelCloseBtn) {
    const label = t("importPanelClose");
    importPanelCloseBtn.title = label;
    importPanelCloseBtn.setAttribute("aria-label", label);
  }
  formTitle.dataset.i18n = "addShortcut";
  formTitle.textContent = t("addShortcut");
}

function resetForm() {
  form.reset();
  mobileModeSelect.value = "on";
  formError.hidden = true;
}

function createDragHandle() {
  const handle = document.createElement("span");
  handle.className = "drag-handle";
  handle.draggable = true;
  handle.role = "button";
  handle.tabIndex = 0;
  handle.title = t("dragHandleLabel");
  handle.setAttribute("aria-label", t("dragHandleLabel"));
  handle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9 16a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="currentColor"/></svg>`;
  return handle;
}

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll(".manage-item:not(.is-dragging):not(.manage-item-editing)")];
  return items.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

async function persistShortcutsOrderFromDom() {
  const ids = [...manageList.querySelectorAll(".manage-item[data-id]")].map((el) => el.dataset.id);
  const shortcuts = await getShortcuts();
  const byId = new Map(shortcuts.map((s) => [s.id, s]));
  const reordered = ids.map((id) => byId.get(id)).filter(Boolean);
  for (const shortcut of shortcuts) {
    if (!ids.includes(shortcut.id)) reordered.push(shortcut);
  }
  if (reordered.length !== shortcuts.length) return;
  const unchanged = reordered.every((s, i) => s.id === shortcuts[i]?.id);
  if (unchanged) return;
  await saveShortcuts(reordered);
}

function setupManageListDragDrop() {
  manageList.addEventListener("dragstart", (e) => {
    const handle = e.target.closest(".drag-handle");
    if (!handle) {
      e.preventDefault();
      return;
    }
    const li = handle.closest(".manage-item");
    if (!li || li.classList.contains("manage-item-editing")) {
      e.preventDefault();
      return;
    }
    draggingShortcutId = li.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggingShortcutId);
    li.classList.add("is-dragging");
  });

  manageList.addEventListener("dragend", () => {
    manageList.querySelector(".is-dragging")?.classList.remove("is-dragging");
    draggingShortcutId = null;
  });

  manageList.addEventListener("dragover", (e) => {
    if (!draggingShortcutId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const dragging = manageList.querySelector(".is-dragging");
    if (!dragging) return;
    const afterElement = getDragAfterElement(manageList, e.clientY);
    if (afterElement == null) {
      manageList.appendChild(dragging);
    } else {
      manageList.insertBefore(dragging, afterElement);
    }
  });

  manageList.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggingShortcutId) return;
    persistShortcutsOrderFromDom().catch(() => {});
  });
}

function scrollManageItemIntoView(li) {
  if (!li || !manageList) return;
  const listRect = manageList.getBoundingClientRect();
  const elRect = li.getBoundingClientRect();
  if (elRect.top < listRect.top + 8 || elRect.bottom > listRect.bottom - 8) {
    li.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function createInlineField(labelText, control) {
  const label = document.createElement("label");
  label.className = "field";
  const span = document.createElement("span");
  span.textContent = labelText;
  label.append(span, control);
  return label;
}

function buildInlineEditItem(item) {
  const li = document.createElement("li");
  li.className = "manage-item manage-item-editing";
  li.dataset.id = item.id;

  li.append(createShortcutIcon(item.url, { className: "manage-icon" }));

  const body = document.createElement("div");
  body.className = "manage-inline-body";

  const inlineForm = document.createElement("form");
  inlineForm.className = "manage-inline-form";

  const inlineTitle = document.createElement("input");
  inlineTitle.type = "text";
  inlineTitle.required = true;
  inlineTitle.maxLength = 40;
  inlineTitle.value = item.title;
  inlineTitle.className = "inline-input";

  const inlineUrl = document.createElement("input");
  inlineUrl.type = "url";
  inlineUrl.required = true;
  inlineUrl.value = item.url;
  inlineUrl.className = "inline-input";

  const inlineMobile = document.createElement("select");
  inlineMobile.className = "inline-input";
  for (const [value, key] of [
    ["on", "openModeOn"],
    ["off", "openModeOff"],
  ]) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = t(key);
    inlineMobile.append(opt);
  }
  inlineMobile.value = mobileToSelect(item.mobile);

  const nameField = createInlineField(t("fieldName"), inlineTitle);
  const openModeField = createInlineField(t("fieldOpenMode"), inlineMobile);
  const urlField = createInlineField(t("fieldUrl"), inlineUrl);
  urlField.classList.add("field-url");

  const fields = document.createElement("div");
  fields.className = "manage-inline-fields";
  fields.append(nameField, openModeField, urlField);

  const inlineError = document.createElement("p");
  inlineError.className = "error";
  inlineError.hidden = true;

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const btnSave = document.createElement("button");
  btnSave.type = "submit";
  btnSave.className = "btn primary";
  btnSave.textContent = t("btnSave");
  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "btn ghost";
  btnCancel.textContent = t("btnCancel");
  actions.append(btnSave, btnCancel);

  inlineForm.append(fields, inlineError, actions);
  body.append(inlineForm);
  li.append(body);

  btnCancel.addEventListener("click", () => {
    editingInlineId = null;
    refresh();
  });

  inlineForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    inlineError.hidden = true;

    const title = inlineTitle.value.trim();
    const url = normalizeUrl(inlineUrl.value);
    const mobile = mobileFromSelect(inlineMobile.value);

    if (!title) {
      inlineError.textContent = t("errNameRequired");
      inlineError.hidden = false;
      return;
    }
    if (!isValidUrl(inlineUrl.value)) {
      inlineError.textContent = t("errUrlInvalid");
      inlineError.hidden = false;
      return;
    }

    const shortcuts = await getShortcuts();
    const idx = shortcuts.findIndex((s) => s.id === item.id);
    if (idx >= 0) {
      shortcuts[idx] = { ...shortcuts[idx], title, url, mobile };
    }
    await saveShortcuts(shortcuts);
    editingInlineId = null;
    await refresh();
  });

  return li;
}

function openInlineEdit(item) {
  editingInlineId = item.id;
  refresh().then(() => {
    requestAnimationFrame(() => {
      const li = manageList.querySelector(`[data-id="${CSS.escape(item.id)}"]`);
      scrollManageItemIntoView(li);
      li?.querySelector(".manage-inline-form input")?.focus();
    });
  });
}

function createOpenModeBadge(mobile) {
  const badge = document.createElement("span");
  badge.className = "badge";
  const label = mobile ? t("mobileBadge") : t("desktopBadge");
  badge.title = label;
  badge.setAttribute("aria-label", label);
  badge.innerHTML = mobile
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm1 2v12h4V4h-4Zm2 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1v2l-3-2H6a2 2 0 0 1-2-2V5Zm2 0v8h12V5H6Z" fill="currentColor"/></svg>`;
  return badge;
}

async function renderManageList(shortcuts) {
  const fragment = document.createDocumentFragment();
  manageEmpty.hidden = shortcuts.length > 0;
  for (const item of shortcuts) {
    if (item.id === editingInlineId) {
      fragment.append(buildInlineEditItem(item));
      continue;
    }

    const mobile = shouldUseMobile(item);
    const canonical = normalizeUrl(item.url);

    const li = document.createElement("li");
    li.className = "manage-item";
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="manage-info">
        <div class="manage-title"><span class="manage-name">${escapeHtml(item.title)}</span></div>
        <div class="manage-url">${escapeHtml(canonical)}</div>
      </div>
      <div class="manage-actions">
        <button type="button" class="btn ghost btn-edit">${escapeHtml(t("btnEdit"))}</button>
        <button type="button" class="btn danger btn-delete">${escapeHtml(t("btnDelete"))}</button>
      </div>
    `;
    li.querySelector(".manage-title").append(createOpenModeBadge(mobile));
    const icon = createShortcutIcon(item.url, { className: "manage-icon" });
    const dragHandle = createDragHandle();
    li.insertBefore(icon, li.firstChild);
    li.insertBefore(dragHandle, icon.nextSibling);
    li.querySelector(".btn-edit").addEventListener("click", () => openInlineEdit(item));
    li.querySelector(".btn-delete").addEventListener("click", () =>
      removeShortcut(item.id)
    );
    fragment.appendChild(li);
  }
  manageList.replaceChildren(fragment);
}

async function removeShortcut(id) {
  const shortcuts = await getShortcuts();
  await saveShortcuts(shortcuts.filter((s) => s.id !== id));
  await refresh();
  if (editingInlineId === id) editingInlineId = null;
}

async function refresh() {
  const shortcuts = await getShortcuts();
  await renderManageList(shortcuts);
}

async function loadSettings() {
  const settings = await getSettings();
  syncLanguageSelect(languageSelect, settings);
  syncThemeSelect(themeSelect, settings);
  syncLauncherModeSelect(launcherModeSelect, settings);
}

themeSelect.addEventListener("change", async () => {
  await setThemePreference(themeSelect.value);
});

launcherModeSelect?.addEventListener("change", async () => {
  const settings = await getSettings();
  settings.launcherMode = normalizeLauncherMode(launcherModeSelect.value);
  await saveSettings(settings);
});

languageSelect.addEventListener("change", async () => {
  await setLocalePreference(languageSelect.value);
  applyOptionsI18n();
  applyAuthorFooter();
  await refresh();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const title = titleInput.value.trim();
  const url = normalizeUrl(urlInput.value);
  const mobile = mobileFromSelect(mobileModeSelect.value);

  if (!title) {
    formError.textContent = t("errNameRequired");
    formError.hidden = false;
    return;
  }
  if (!isValidUrl(urlInput.value)) {
    formError.textContent = t("errUrlInvalid");
    formError.hidden = false;
    return;
  }

  const shortcuts = await getShortcuts();
  shortcuts.push({ id: newId(), title, url, mobile });

  await saveShortcuts(shortcuts);
  resetForm();
  await refresh();
});

function showBackupStatus(message, isError = false) {
  if (!backupStatus) return;
  backupStatus.textContent = message;
  backupStatus.hidden = false;
  backupStatus.classList.toggle("backup-status-error", isError);
  backupStatus.classList.toggle("backup-status-ok", !isError);
}

function backupErrorMessage(code) {
  const map = {
    invalidJson: "backupErrJson",
    invalidFormat: "backupErrFormat",
    noValidShortcuts: "backupErrEmpty",
  };
  return t(map[code] ?? "backupErrFormat");
}

function setImportPanelVisible(visible) {
  if (!importPanel) return;
  importPanel.hidden = !visible;
  if (!visible) pendingImportMode = null;
}

function startImportWithMode(mode) {
  pendingImportMode = mode;
  importBackupFile?.click();
}

btnExportBackup?.addEventListener("click", async () => {
  setImportPanelVisible(false);
  try {
    const payload = await buildBackupPayload();
    downloadBackupJson(payload);
    showBackupStatus(t("backupExportOk"));
  } catch {
    showBackupStatus(t("backupErrGeneric"), true);
  }
});

btnImportBackup?.addEventListener("click", () => {
  setImportPanelVisible(true);
});

importPanelCloseBtn?.addEventListener("click", () => {
  setImportPanelVisible(false);
});

importMergeBtn?.addEventListener("click", () => {
  startImportWithMode("merge");
});

importReplaceBtn?.addEventListener("click", () => {
  if (!window.confirm(t("importReplaceConfirm"))) return;
  startImportWithMode("replace");
});

importBackupFile?.addEventListener("change", async () => {
  const file = importBackupFile.files?.[0];
  importBackupFile.value = "";
  const mode = pendingImportMode;
  setImportPanelVisible(false);

  if (!file || !mode) return;

  try {
    const text = await file.text();
    const parsed = parseBackupJson(text);
    if (parsed.error) {
      showBackupStatus(backupErrorMessage(parsed.error), true);
      return;
    }
    if (parsed.shortcuts.length === 0) {
      showBackupStatus(t("backupErrEmpty"), true);
      return;
    }

    const result = await applyBackupImport(parsed, mode);
    editingInlineId = null;
    resetForm();
    await initTheme();
    await initI18n();
    applyOptionsI18n();
    applyAuthorFooter();
    await loadSettings();
    await refresh();
    showBackupStatus(
      t(mode === "replace" ? "backupImportReplaceOk" : "backupImportMergeOk", {
        count: String(result.shortcutCount),
      })
    );
  } catch {
    showBackupStatus(t("backupErrGeneric"), true);
  }
});

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.settings) {
    const settings = changes.settings.newValue ?? {};
    if (settings.theme !== undefined) applyTheme(settings.theme);
    syncThemeSelect(themeSelect, settings);
    syncLauncherModeSelect(launcherModeSelect, settings);
    await initI18n();
    syncLanguageSelect(languageSelect, settings);
    applyOptionsI18n();
    applyAuthorFooter();
    await refresh();
    return;
  }
  if (changes.shortcuts) await refresh();
});

function applyAuthorFooter() {
  document.querySelectorAll("[data-author-link]").forEach((el) => {
    el.href = GITHUB_AUTHOR_URL;
  });
  document.querySelectorAll("[data-repo-link]").forEach((el) => {
    el.href = GITHUB_REPO_URL;
  });
  const versionEl = document.getElementById("extension-version");
  if (versionEl) {
    const version = chrome.runtime.getManifest().version;
    versionEl.textContent = t("authorVersion", { version });
  }
}

async function boot() {
  setupManageListDragDrop();
  await initTheme();
  await initI18n();
  applyOptionsI18n();
  applyAuthorFooter();
  await loadSettings();
  await refresh();
}

boot();
