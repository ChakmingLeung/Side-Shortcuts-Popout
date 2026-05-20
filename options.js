import {
  getShortcuts,
  saveShortcuts,
  getSettings,
  saveSettings,
  normalizeUrl,
  isValidUrl,
  toMobileUrl,
  shouldUseMobile,
  createShortcutIcon,
  GITHUB_REPO_URL,
} from "./shared.js";
import {
  initI18n,
  t,
  applyDocumentI18n,
  setLocalePreference,
  syncLanguageSelect,
} from "./i18n.js";
import { initTheme, syncThemeSelect, setThemePreference, applyTheme } from "./theme.js";
import {
  buildBackupPayload,
  downloadBackupJson,
  parseBackupJson,
  applyBackupImport,
} from "./backup.js";

const form = document.getElementById("shortcut-form");
const formTitle = document.getElementById("form-title");
const editId = document.getElementById("edit-id");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const mobileModeSelect = document.getElementById("mobile-mode");
const languageSelect = document.getElementById("language");
const themeSelect = document.getElementById("theme");
const formError = document.getElementById("form-error");
const btnCancel = document.getElementById("btn-cancel");
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
  if (!editId.value) {
    formTitle.dataset.i18n = "addShortcut";
    formTitle.textContent = t("addShortcut");
  }
}

function resetForm() {
  editId.value = "";
  form.reset();
  mobileModeSelect.value = "on";
  formTitle.dataset.i18n = "addShortcut";
  formTitle.textContent = t("addShortcut");
  btnCancel.hidden = true;
  formError.hidden = true;
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

  const fields = document.createElement("div");
  fields.className = "manage-inline-fields";
  fields.append(
    createInlineField(t("fieldName"), inlineTitle),
    createInlineField(t("fieldUrl"), inlineUrl),
    createInlineField(t("fieldOpenMode"), inlineMobile)
  );

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

async function renderManageList(shortcuts) {
  manageList.replaceChildren();
  manageEmpty.hidden = shortcuts.length > 0;
  for (const item of shortcuts) {
    if (item.id === editingInlineId) {
      manageList.append(buildInlineEditItem(item));
      continue;
    }

    const mobile = shouldUseMobile(item);
    const canonical = normalizeUrl(item.url);
    const mappedMobile = mobile ? toMobileUrl(canonical) : null;
    const loadHint =
      mappedMobile && mappedMobile !== canonical
        ? `<span class="manage-load-hint">${escapeHtml(t("manageLoadMapped", { url: mappedMobile }))}</span>`
        : mobile
          ? `<span class="manage-load-hint">${escapeHtml(t("manageLoadUa"))}</span>`
          : "";

    const li = document.createElement("li");
    li.className = "manage-item";
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="manage-info">
        <div class="manage-title">${escapeHtml(item.title)} <span class="badge">${mobile ? t("mobileBadge") : t("desktopBadge")}</span></div>
        <div class="manage-url">${escapeHtml(canonical)}
        ${loadHint}</div>
      </div>
      <div class="manage-actions">
        <button type="button" class="btn ghost btn-edit">${escapeHtml(t("btnEdit"))}</button>
        <button type="button" class="btn danger btn-delete">${escapeHtml(t("btnDelete"))}</button>
      </div>
    `;
    const icon = createShortcutIcon(item.url, { className: "manage-icon" });
    li.insertBefore(icon, li.firstChild);
    li.querySelector(".btn-edit").addEventListener("click", () => openInlineEdit(item));
    li.querySelector(".btn-delete").addEventListener("click", () =>
      removeShortcut(item.id)
    );
    manageList.appendChild(li);
  }
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function removeShortcut(id) {
  const shortcuts = await getShortcuts();
  await saveShortcuts(shortcuts.filter((s) => s.id !== id));
  await refresh();
  if (editId.value === id) resetForm();
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
}

themeSelect.addEventListener("change", async () => {
  await setThemePreference(themeSelect.value);
});

languageSelect.addEventListener("change", async () => {
  await setLocalePreference(languageSelect.value);
  applyOptionsI18n();
  applyAuthorFooter();
  await refresh();
  if (editingInlineId) await refresh();
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
  const existingId = editId.value;

  if (existingId) {
    const idx = shortcuts.findIndex((s) => s.id === existingId);
    if (idx >= 0) {
      shortcuts[idx] = { ...shortcuts[idx], title, url, mobile };
    }
  } else {
    shortcuts.push({ id: newId(), title, url, mobile });
  }

  await saveShortcuts(shortcuts);
  resetForm();
  await refresh();
});

btnCancel.addEventListener("click", resetForm);

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
  await initTheme();
  await initI18n();
  applyOptionsI18n();
  applyAuthorFooter();
  await loadSettings();
  await refresh();
}

boot();
