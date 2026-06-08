/** Android Chrome UA for mobile-mode popout tabs. */
export const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

/** Popout width when a shortcut opens in mobile mode. */
export const MOBILE_VIEWPORT_WIDTH = 375;

const RULE_ID_BASE = 1_000_000;

/** Tabs opened in mobile mode — UA rules + in-page viewport / navigator shim. */
const mobileModeTabIds = new Set();

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

function shouldInjectMobile(details) {
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

chrome.webNavigation.onCommitted.addListener((details) => {
  if (!shouldInjectMobile(details)) return;
  injectMobileEmulationIntoTab(details.tabId);
});
