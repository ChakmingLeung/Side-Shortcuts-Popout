import {
  DEFAULT_SETTINGS,
  getShortcuts,
  saveShortcuts,
  hasStoredSettings,
  saveSettings,
} from "./shared.js";
import { initI18n, t } from "./i18n.js";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

async function updateActionTitle() {
  await initI18n();
  await chrome.action.setTitle({ title: t("actionTitle") });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SET_ACTION_TITLE") {
    updateActionTitle()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.settings) {
    updateActionTitle().catch(() => {});
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  await updateActionTitle();

  if (details.reason !== "install") return;

  if (!(await hasStoredSettings())) {
    await saveSettings(DEFAULT_SETTINGS);
  }

  if (!(await getShortcuts()).length) {
    await saveShortcuts([
      {
        id: crypto.randomUUID(),
        title: "语雀",
        url: "https://www.yuque.com/",
        mobile: null,
      },
      {
        id: crypto.randomUUID(),
        title: "小红书",
        url: "https://www.xiaohongshu.com/explore",
        mobile: null,
      },
      {
        id: crypto.randomUUID(),
        title: "抖音",
        url: "https://www.douyin.com/jingxuan",
        mobile: null,
      },
      {
        id: crypto.randomUUID(),
        title: "Instagram",
        url: "https://www.instagram.com/",
        mobile: null,
      },
      {
        id: crypto.randomUUID(),
        title: "TikTok",
        url: "https://www.tiktok.com/",
        mobile: null,
      },
    ]);
  }
});
