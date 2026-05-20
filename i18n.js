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
    theme: "外观主题",
    themeSystem: "跟随系统",
    themeLight: "浅色",
    themeDark: "深色",
    storagePersistHint:
      "快捷方式会保存在本机；登录 Chrome/Edge 并开启同步可跨设备。重新加载、浏览器更新不会清空；卸载扩展会删除数据，重装前请先导出备份。",
    btnExportBackup: "导出配置",
    btnImportBackup: "导入配置",
    importModePrompt: "请选择导入方式，然后选择备份文件：",
    importPanelClose: "关闭",
    importModeMerge: "合并（同 ID 覆盖，新条目追加）",
    importModeReplace: "替换（清空现有后导入）",
    importReplaceConfirm: "将用备份文件替换当前全部快捷入口与设置，是否继续？",
    backupExportOk: "已导出配置文件。",
    backupImportMergeOk: "已合并导入，当前共 {count} 个快捷入口。",
    backupImportReplaceOk: "已替换导入，共 {count} 个快捷入口。",
    backupErrJson: "文件不是有效的 JSON。",
    backupErrFormat: "备份文件格式不正确。",
    backupErrEmpty: "备份中没有有效的快捷入口。",
    backupErrGeneric: "导入或导出失败，请重试。",
    authorLabel: "作者",
    authorRepoCta: "GitHub 开源仓库 · 反馈与 Star",
    authorVersion: "版本 {version}",
    addShortcut: "添加快捷入口",
    editShortcut: "编辑快捷入口",
    fieldName: "名称",
    fieldUrl: "网址",
    fieldFaviconHint: "图标将根据网址自动显示网站 favicon，无需配置。",
    fieldOpenMode: "打开方式",
    openModeOn: "移动版",
    openModeOff: "桌面版",
    openModeHint:
      "B 站、微博等会转为移动域名；其余站点使用你保存的网址。不会修改已保存的网址。",
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
    pinToolbarHint:
      "建议将本扩展固定到工具栏：点击浏览器工具栏的扩展图标（拼图）→ 找到「侧栏快捷小窗」→ 点击图钉，之后可一键打开侧栏。",
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
    theme: "Appearance",
    themeSystem: "Follow system",
    themeLight: "Light",
    themeDark: "Dark",
    storagePersistHint:
      "Shortcuts are saved on this device; sign in with sync for other devices. Reload and browser updates keep data; uninstall removes it—export a backup before reinstalling.",
    btnExportBackup: "Export",
    btnImportBackup: "Import",
    importModePrompt: "Choose import mode, then select a backup file:",
    importPanelClose: "Close",
    importModeMerge: "Merge (update same ID, append new)",
    importModeReplace: "Replace (clear existing, then import)",
    importReplaceConfirm:
      "Replace all current shortcuts and settings with this backup?",
    backupExportOk: "Backup file downloaded.",
    backupImportMergeOk: "Merged import complete. {count} shortcut(s) now.",
    backupImportReplaceOk: "Replace import complete. {count} shortcut(s).",
    backupErrJson: "Invalid JSON file.",
    backupErrFormat: "Unrecognized backup format.",
    backupErrEmpty: "No valid shortcuts in backup.",
    backupErrGeneric: "Import or export failed. Try again.",
    authorLabel: "Author",
    authorRepoCta: "GitHub repo · feedback & Star",
    authorVersion: "Version {version}",
    addShortcut: "Add shortcut",
    editShortcut: "Edit shortcut",
    fieldName: "Name",
    fieldUrl: "URL",
    fieldFaviconHint: "Icons use each site’s favicon from the URL automatically.",
    fieldOpenMode: "Open as",
    openModeOn: "Mobile",
    openModeOff: "Desktop",
    openModeHint:
      "Bilibili, Weibo, etc. use mapped mobile hosts; other sites use your saved URL. Saved URLs are never rewritten.",
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
    pinToolbarHint:
      "Pin this extension to the toolbar: open the extensions menu (puzzle icon) → find Side Shortcuts Popout → click the pin icon for one-click access.",
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
