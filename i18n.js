import { getSettings, saveSettings } from "./shared.js";

export const SUPPORTED_LOCALES = ["zh", "en"];

/** @type {"zh" | "en"} */
let currentLocale = "zh";

const listeners = new Set();

const MESSAGES = {
  zh: {
    docTitleOptions: "侧栏快捷小窗 - 设置",
    docTitleSidepanel: "侧栏快捷小窗",
    optionsTitle: "快捷入口管理",
    optionsSubtitle:
      "配置快捷入口。侧栏纵向列出，点击即在独立小窗打开，与主窗口并排浏览。",
    globalSettings: "全局设置",
    language: "界面语言",
    languageAuto: "跟随浏览器",
    languageZh: "简体中文",
    languageEn: "English",
    defaultMobile: "默认以移动版在小窗打开",
    defaultMobileHint:
      "B 站、微博等会按白名单转为移动域名；其余站点使用你保存的网址（小窗为正常浏览器环境，登录与扫码与标签页一致）。不会修改已保存的网址。",
    storagePersistHint:
      "快捷方式会自动保存在本机；登录 Chrome/Edge 并开启同步后可同步到其他设备。重新加载扩展不会清空配置。",
    addShortcut: "添加快捷入口",
    editShortcut: "编辑快捷入口",
    fieldName: "名称",
    fieldUrl: "网址",
    fieldFaviconHint: "图标将根据网址自动显示网站 favicon，无需配置。",
    fieldOpenMode: "打开方式",
    openModeInherit: "跟随全局（默认移动版）",
    openModeOn: "始终移动版",
    openModeOff: "始终桌面版",
    placeholderTitle: "例如：语雀",
    placeholderUrl: "https://example.com",
    btnSave: "保存",
    btnCancel: "取消编辑",
    savedShortcuts: "已保存的入口",
    manageEmpty: "暂无快捷入口",
    mobileBadge: "移动版",
    desktopBadge: "桌面版",
    manageLoadMapped: "小窗打开：{url}",
    manageLoadUa: "小窗：原地址（无移动域名映射）",
    btnEdit: "编辑",
    btnDelete: "删除",
    errNameRequired: "请填写名称",
    errUrlInvalid: "请填写有效的网址（需以 http:// 或 https:// 开头）",
    toolbarSettings: "管理快捷入口",
    launcherLabel: "快捷入口",
    launcherHint: "点击入口在独立小窗打开；已打开的小窗会聚焦并刷新地址。",
    emptyState: "还没有快捷入口。",
    emptyAddFirst: "去添加",
    actionTitle: "打开 / 关闭侧栏快捷小窗",
  },
  en: {
    docTitleOptions: "Side Shortcuts Popout - Settings",
    docTitleSidepanel: "Side Shortcuts Popout",
    optionsTitle: "Shortcut management",
    optionsSubtitle:
      "Configure shortcuts. The side panel lists them vertically; click to open in a popout window alongside the main window.",
    globalSettings: "Global settings",
    language: "Language",
    languageAuto: "Follow browser",
    languageZh: "简体中文",
    languageEn: "English",
    defaultMobile: "Open in popout with mobile view by default",
    defaultMobileHint:
      "Bilibili, Weibo, etc. use the mobile host allowlist; other sites use your saved URL (popouts use normal browser cookies and login). Saved URLs are never rewritten.",
    storagePersistHint:
      "Shortcuts are saved on this device; sign in to Chrome/Edge with sync to use them on other devices. Reloading the extension does not clear your list.",
    addShortcut: "Add shortcut",
    editShortcut: "Edit shortcut",
    fieldName: "Name",
    fieldUrl: "URL",
    fieldFaviconHint: "Icons use each site’s favicon from the URL automatically.",
    fieldOpenMode: "Open as",
    openModeInherit: "Use global default (mobile)",
    openModeOn: "Always mobile",
    openModeOff: "Always desktop",
    placeholderTitle: "e.g. Yuque",
    placeholderUrl: "https://example.com",
    btnSave: "Save",
    btnCancel: "Cancel edit",
    savedShortcuts: "Saved shortcuts",
    manageEmpty: "No shortcuts yet",
    mobileBadge: "Mobile",
    desktopBadge: "Desktop",
    manageLoadMapped: "Popout opens: {url}",
    manageLoadUa: "Popout: original URL (no mobile host mapping)",
    btnEdit: "Edit",
    btnDelete: "Delete",
    errNameRequired: "Please enter a name",
    errUrlInvalid: "Enter a valid URL (http:// or https://)",
    toolbarSettings: "Manage shortcuts",
    launcherLabel: "Shortcuts",
    launcherHint:
      "Click a shortcut to open it in a popout window. An existing popout is focused and navigated.",
    emptyState: "No shortcuts yet.",
    emptyAddFirst: "Add one",
    actionTitle: "Open / close Side Shortcuts Popout",
  },
};

export function resolveLocale(settings) {
  const loc = settings?.locale;
  if (loc === "zh" || loc === "en") return loc;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function getLocale() {
  return currentLocale;
}

export function t(key, vars = {}) {
  let str =
    MESSAGES[currentLocale]?.[key] ?? MESSAGES.zh[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    str = str.replaceAll(`{${name}}`, String(value));
  }
  return str;
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyLocaleChange() {
  for (const fn of listeners) fn(currentLocale);
}

export async function initI18n() {
  const settings = await getSettings();
  currentLocale = resolveLocale(settings);
  return currentLocale;
}

export async function setLocalePreference(preference) {
  const settings = await getSettings();
  settings.locale =
    preference === "zh" || preference === "en" ? preference : null;
  await saveSettings(settings);
  currentLocale = resolveLocale(settings);
  notifyLocaleChange();
  try {
    await chrome.runtime.sendMessage({
      type: "SET_ACTION_TITLE",
      title: t("actionTitle"),
    });
  } catch {
    /* service worker not ready */
  }
  return currentLocale;
}

function applyI18nAttr(el, key, attr) {
  const value = t(key);
  if (attr === "html") {
    el.innerHTML = value;
  } else if (attr === "placeholder") {
    el.placeholder = value;
  } else if (attr === "title" || attr === "aria-label") {
    el.setAttribute(attr, value);
  } else {
    el.textContent = value;
  }
}

export function applyDocumentI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    applyI18nAttr(el, el.dataset.i18n, el.dataset.i18nAttr || "text");
  });

  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });

  root.querySelectorAll("select option[data-i18n]").forEach((opt) => {
    opt.textContent = t(opt.dataset.i18n);
  });

  const docTitleKey =
    root === document ? document.body?.dataset?.docTitle : null;
  if (docTitleKey) {
    document.title = t(docTitleKey);
  }

  const html = root.ownerDocument?.documentElement ?? document.documentElement;
  html.lang = currentLocale === "zh" ? "zh-CN" : "en";
}

const TOOLBAR_I18N_IDS = {
  "btn-settings": "toolbarSettings",
};

export function applyToolbarI18n(root = document) {
  for (const [id, key] of Object.entries(TOOLBAR_I18N_IDS)) {
    const el = root.getElementById(id);
    if (!el) continue;
    const label = t(key);
    el.title = label;
    el.setAttribute("aria-label", label);
  }
}

export function syncLanguageSelect(select, settings) {
  if (!select) return;
  const pref = settings?.locale;
  select.value = pref === "zh" || pref === "en" ? pref : "auto";
}
