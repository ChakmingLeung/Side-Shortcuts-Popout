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
} from "./shared.js";
import {
  initI18n,
  t,
  applyDocumentI18n,
  setLocalePreference,
  syncLanguageSelect,
} from "./i18n.js";

const form = document.getElementById("shortcut-form");
const formTitle = document.getElementById("form-title");
const editId = document.getElementById("edit-id");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const mobileModeSelect = document.getElementById("mobile-mode");
const defaultMobileCheckbox = document.getElementById("default-mobile");
const languageSelect = document.getElementById("language");
const formError = document.getElementById("form-error");
const btnCancel = document.getElementById("btn-cancel");
const manageList = document.getElementById("manage-list");
const manageEmpty = document.getElementById("manage-empty");

function newId() {
  return crypto.randomUUID();
}

function mobileFromSelect(value) {
  if (value === "on") return true;
  if (value === "off") return false;
  return null;
}

function mobileToSelect(mobile) {
  if (mobile === true) return "on";
  if (mobile === false) return "off";
  return "inherit";
}

function applyOptionsI18n() {
  applyDocumentI18n();
  if (!editId.value) {
    formTitle.dataset.i18n = "addShortcut";
    formTitle.textContent = t("addShortcut");
  }
}

function resetForm() {
  editId.value = "";
  form.reset();
  mobileModeSelect.value = "inherit";
  formTitle.dataset.i18n = "addShortcut";
  formTitle.textContent = t("addShortcut");
  btnCancel.hidden = true;
  formError.hidden = true;
}

function startEdit(item) {
  editId.value = item.id;
  titleInput.value = item.title;
  urlInput.value = item.url;
  mobileModeSelect.value = mobileToSelect(item.mobile ?? null);
  formTitle.dataset.i18n = "editShortcut";
  formTitle.textContent = t("editShortcut");
  btnCancel.hidden = false;
  formError.hidden = true;
  titleInput.focus();
}

async function renderManageList(shortcuts) {
  manageList.replaceChildren();
  manageEmpty.hidden = shortcuts.length > 0;
  const settings = await getSettings();

  for (const item of shortcuts) {
    const mobile = shouldUseMobile(item, settings);
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
    li.querySelector(".btn-edit").addEventListener("click", () => startEdit(item));
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
}

async function refresh() {
  const shortcuts = await getShortcuts();
  await renderManageList(shortcuts);
}

async function loadSettings() {
  const settings = await getSettings();
  defaultMobileCheckbox.checked = settings.defaultMobileMode !== false;
  syncLanguageSelect(languageSelect, settings);
}

languageSelect.addEventListener("change", async () => {
  await setLocalePreference(languageSelect.value);
  applyOptionsI18n();
  await refresh();
  if (editId.value) {
    const shortcuts = await getShortcuts();
    const item = shortcuts.find((s) => s.id === editId.value);
    if (item) {
      formTitle.dataset.i18n = "editShortcut";
      formTitle.textContent = t("editShortcut");
    }
  }
});

defaultMobileCheckbox.addEventListener("change", async () => {
  const settings = await getSettings();
  settings.defaultMobileMode = defaultMobileCheckbox.checked;
  await saveSettings(settings);
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

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync" || !changes.settings) return;
  await initI18n();
  const settings = changes.settings.newValue ?? {};
  syncLanguageSelect(languageSelect, settings);
  applyOptionsI18n();
  await refresh();
});

async function boot() {
  await initI18n();
  applyOptionsI18n();
  await loadSettings();
  await refresh();
}

boot();
