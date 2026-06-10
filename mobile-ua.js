/** Android Chrome UA for mobile-mode popout tabs. */
export const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

/** Popout width when a shortcut opens in mobile mode. */
export const MOBILE_VIEWPORT_WIDTH = 375;

const RULE_ID_BASE = 1_000_000;
const EMBED_INITIATOR_RULE_ID = 2_000_000;

/** Tabs opened in mobile mode — UA rules + in-page viewport / navigator shim. */
const mobileModeTabIds = new Set();

/** 侧栏内嵌移动版：扩展发起的 iframe 请求 + 页面内 navigator/viewport 注入 */
let embedMobileActive = false;
/** @type {string | null} */
let embedMobileUrl = null;

const MOBILE_REQUEST_HEADERS = [
  { header: "user-agent", operation: "set", value: MOBILE_USER_AGENT },
  { header: "sec-ch-ua-mobile", operation: "set", value: "?1" },
  { header: "sec-ch-ua-platform", operation: "set", value: '"Android"' },
  { header: "sec-ch-ua", operation: "remove" },
];

function mobileUaRuleId(tabId) {
  return RULE_ID_BASE + tabId;
}

export async function applyMobileUserAgentForTab(tabId) {
  if (mobileModeTabIds.has(tabId)) return;
  mobileModeTabIds.add(tabId);
  const ruleId = mobileUaRuleId(tabId);
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ruleId],
    addRules: [
      {
        id: ruleId,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: MOBILE_REQUEST_HEADERS,
        },
        condition: {
          tabIds: [tabId],
          urlFilter: "*",
          resourceTypes: [
            "main_frame",
            "sub_frame",
            "xmlhttprequest",
            "script",
            "stylesheet",
          ],
        },
      },
    ],
  });
}

export async function clearMobileUserAgentForTab(tabId) {
  mobileModeTabIds.delete(tabId);
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [mobileUaRuleId(tabId)],
  });
}

/**
 * Runs in page MAIN world at document_start for every mobile-mode popout tab.
 * Keeps layout viewport at phone width so responsive sites match mobile layout
 * when the shortcut is set to mobile mode (regardless of the saved URL host).
 */
function injectMobileEmulation(ua, viewportWidth) {
  try {
    const applyViewport = () => {
      try {
        const content = `width=${viewportWidth}, initial-scale=1, maximum-scale=1, user-scalable=no`;
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "viewport";
          (document.head || document.documentElement).appendChild(meta);
        }
        meta.setAttribute("content", content);
      } catch {
        /* DOM not ready */
      }
    };

    try {
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
        configurable: true,
      });
      const data = navigator.userAgentData;
      if (data && typeof data === "object") {
        Object.defineProperty(navigator, "userAgentData", {
          get: () => ({
            brands: data.brands ?? [{ brand: "Chromium", version: "120" }],
            mobile: true,
            platform: "Android",
          }),
          configurable: true,
        });
      }
    } catch {
      /* read-only navigator */
    }

    if (document.head) applyViewport();
    else document.addEventListener("DOMContentLoaded", applyViewport, { once: true });
  } catch {
    /* page restrictions */
  }
}

function shouldInjectMobilePopout(details) {
  return details.frameId === 0 && mobileModeTabIds.has(details.tabId);
}

function injectMobileEmulationIntoTab(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      world: "MAIN",
      injectImmediately: true,
      func: injectMobileEmulation,
      args: [MOBILE_USER_AGENT, MOBILE_VIEWPORT_WIDTH],
    })
    .catch(() => {});
}

function isEmbedRelatedUrl(frameUrl, embedUrl) {
  try {
    const frame = new URL(frameUrl);
    const embed = new URL(embedUrl);
    if (frame.origin === embed.origin) return true;
    const embedHost = embed.hostname.replace(/^www\./, "");
    return (
      frame.hostname === embedHost || frame.hostname.endsWith(`.${embedHost}`)
    );
  } catch {
    return false;
  }
}

async function updateEmbedInitiatorUaRule(enabled) {
  if (!enabled) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [EMBED_INITIATOR_RULE_ID],
    });
    return;
  }

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [EMBED_INITIATOR_RULE_ID],
    addRules: [
      {
        id: EMBED_INITIATOR_RULE_ID,
        priority: 2,
        action: {
          type: "modifyHeaders",
          requestHeaders: MOBILE_REQUEST_HEADERS,
        },
        condition: {
          initiatorDomains: [chrome.runtime.id],
          urlFilter: "*",
          resourceTypes: [
            "main_frame",
            "sub_frame",
            "xmlhttprequest",
            "script",
            "stylesheet",
          ],
        },
      },
    ],
  });
}

/** @param {boolean} mobile @param {string | null} [embedUrl] */
export async function syncEmbedMobileUa(mobile, embedUrl = null) {
  const nextUrl = mobile && embedUrl ? embedUrl : null;
  if (embedMobileActive === mobile && embedMobileUrl === nextUrl) return;
  embedMobileActive = mobile;
  embedMobileUrl = nextUrl;
  await updateEmbedInitiatorUaRule(mobile);
}

async function injectMobileEmulationIntoEmbedFrame(frameId) {
  let contexts = [];
  try {
    contexts = await chrome.runtime.getContexts({ contextTypes: ["SIDE_PANEL"] });
  } catch {
    /* */
  }

  const panel = contexts[0];
  if (!panel) return;

  /** @type {chrome.scripting.InjectionTarget} */
  let target;
  if (panel.documentId) {
    target = { documentIds: [panel.documentId], frameIds: [frameId] };
  } else if (panel.tabId != null) {
    target = { tabId: panel.tabId, frameIds: [frameId] };
  } else {
    return;
  }

  chrome.scripting
    .executeScript({
      target,
      world: "MAIN",
      injectImmediately: true,
      func: injectMobileEmulation,
      args: [MOBILE_USER_AGENT, MOBILE_VIEWPORT_WIDTH],
    })
    .catch(() => {});
}

export function handleMobileNavigationCommitted(details) {
  if (shouldInjectMobilePopout(details)) {
    injectMobileEmulationIntoTab(details.tabId);
    return;
  }

  if (!embedMobileActive || !embedMobileUrl) return;
  if (details.frameType !== "sub_frame") return;
  if (!isEmbedRelatedUrl(details.url, embedMobileUrl)) return;

  injectMobileEmulationIntoEmbedFrame(details.frameId).catch(() => {});
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (mobileModeTabIds.has(tabId)) {
    clearMobileUserAgentForTab(tabId).catch(() => {});
  }
});
