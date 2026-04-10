// Whatsapp Guardian - Session Watchdog
// Copyright (c) 2026 Thorsten Bylicki / BYLICKILABS. All rights reserved.

const APP_NAME = "WA Guardian - Session Watchdog";

const STORAGE_KEYS = {
  SETTINGS: "waGuardianSettings",
  EVENTS: "waGuardianEvents",
  STATE: "waGuardianState"
};

const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  badgeEnabled: true,
  soundEnabled: false,
  maxEvents: 500,
  heartbeatTimeoutMs: 30000,
  trackVisibility: true,
  trackFocus: true,
  trackUnreadChanges: true,
  logTitleChanges: true,
  uiLanguage: "de"
};

const DEFAULT_STATE = {
  lastHeartbeat: 0,
  lastKnownMode: "unknown",
  lastKnownTitle: "",
  lastUnreadCount: 0,
  lastTabId: null,
  monitoringActive: false
};

const RUNTIME_CACHE = {
  lastEventFingerprint: null,
  lastEventAt: 0
};

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function safeClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function buildEventFingerprint(event) {
  return JSON.stringify({
    type: event?.type || "",
    severity: event?.severity || "",
    title: event?.title || "",
    message: event?.message || "",
    source: event?.source || "",
    data: {
      mode: event?.data?.mode || "",
      unreadCount: event?.data?.unreadCount ?? "",
      visibility: event?.data?.visibility || "",
      focused: event?.data?.focused ?? "",
      rawEvent: event?.data?.rawEvent || event?.data?.event || "",
      detail: event?.data?.detail || ""
    }
  });
}

function isDuplicateEvent(event, windowMs = 1500) {
  const fingerprint = buildEventFingerprint(event);
  const now = Date.now();

  if (RUNTIME_CACHE.lastEventFingerprint === fingerprint && now - RUNTIME_CACHE.lastEventAt < windowMs) {
    return true;
  }

  RUNTIME_CACHE.lastEventFingerprint = fingerprint;
  RUNTIME_CACHE.lastEventAt = now;
  return false;
}

async function getFromStorage(key, fallback = null) {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] ?? fallback;
  } catch (error) {
    console.error(`[${APP_NAME}] Storage read failed for key "${key}"`, error);
    return fallback;
  }
}

async function setToStorage(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`[${APP_NAME}] Storage write failed for key "${key}"`, error);
    return false;
  }
}

async function getSettings() {
  const stored = await getFromStorage(STORAGE_KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

async function getState() {
  const stored = await getFromStorage(STORAGE_KEYS.STATE, {});
  return { ...DEFAULT_STATE, ...(stored || {}) };
}

async function setState(nextState) {
  const current = await getState();
  const merged = { ...current, ...(nextState || {}) };
  await setToStorage(STORAGE_KEYS.STATE, merged);
  return merged;
}

async function getEvents() {
  const stored = await getFromStorage(STORAGE_KEYS.EVENTS, []);
  return Array.isArray(stored) ? stored : [];
}

async function saveEvent(event) {
  const settings = await getSettings();
  const existing = await getEvents();

  const normalizedEvent = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: nowIso(),
    type: event?.type || "unknown",
    severity: event?.severity || "info",
    title: event?.title || "Event",
    message: event?.message || "",
    source: event?.source || "background",
    data: safeClone(event?.data || {})
  };

  existing.unshift(normalizedEvent);
  const trimmed = existing.slice(0, Math.max(50, settings.maxEvents || DEFAULT_SETTINGS.maxEvents));
  await setToStorage(STORAGE_KEYS.EVENTS, trimmed);
  return normalizedEvent;
}

async function clearEvents() {
  await setToStorage(STORAGE_KEYS.EVENTS, []);
}

function severityToBadgeText(severity) {
  switch (severity) {
    case "critical": return "!!!";
    case "high": return "!!";
    case "medium": return "!";
    default: return "";
  }
}

function severityToBadgeColor(severity, customText = "") {
  if (!severity && !customText) return "#2563eb";
  if (severity === "critical") return "#b91c1c";
  if (severity === "high") return "#dc2626";
  if (severity === "medium") return "#f59e0b";
  if (severity === "low") return "#0ea5e9";
  return "#2563eb";
}

async function updateBadge(severity = "", text = "") {
  const settings = await getSettings();
  try {
    if (!settings.badgeEnabled) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    await chrome.action.setBadgeText({ text: text || severityToBadgeText(severity) });
    await chrome.action.setBadgeBackgroundColor({ color: severityToBadgeColor(severity, text) });
  } catch (error) {
    console.warn(`[${APP_NAME}] Failed to update badge`, error);
  }
}

async function notifyUser(title, message) {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  if (!chrome.notifications || typeof chrome.notifications.create !== "function") {
    console.warn(`[${APP_NAME}] Notifications API not available`);
    return;
  }

  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title || APP_NAME,
      message: message || "A new event was detected."
    });
  } catch (error) {
    console.error(`[${APP_NAME}] Notification failed`, error);
  }
}

async function logAndNotify(event) {
  if (isDuplicateEvent(event)) return null;
  const storedEvent = await saveEvent(event);
  await updateBadge(storedEvent.severity);

  if (["medium", "high", "critical"].includes(storedEvent.severity)) {
    await notifyUser(storedEvent.title, storedEvent.message);
  }

  console.log(`[${APP_NAME}]`, storedEvent);
  return storedEvent;
}

async function setMonitoringStatus(isActive, tabId = null) {
  await setState({ monitoringActive: !!isActive, lastTabId: tabId ?? null });
  if (!isActive) {
    await updateBadge("", "");
  }
}

function isWhatsAppWebUrl(url) {
  return typeof url === "string" && url.startsWith("https://web.whatsapp.com/");
}

async function findWhatsAppTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: ["https://web.whatsapp.com/*"] });
    return Array.isArray(tabs) ? tabs : [];
  } catch (error) {
    console.error(`[${APP_NAME}] Failed to query WhatsApp tabs`, error);
    return [];
  }
}

async function handleTabMonitoringState() {
  const tabs = await findWhatsAppTabs();
  if (tabs.length > 0) {
    const preferredTab = tabs[0];
    await setMonitoringStatus(true, preferredTab.id);
    return preferredTab;
  }
  await setMonitoringStatus(false, null);
  return null;
}

function normalizeIncomingPayload(payload) {
  const data = payload || {};
  return {
    mode: typeof data.mode === "string" ? data.mode : "unknown",
    title: typeof data.title === "string" ? data.title : "",
    unreadCount: Number.isFinite(data.unreadCount) ? data.unreadCount : 0,
    visibility: typeof data.visibility === "string" ? data.visibility : "unknown",
    focused: typeof data.focused === "boolean" ? data.focused : false,
    url: typeof data.url === "string" ? data.url : "",
    detail: typeof data.detail === "string" ? data.detail : "",
    rawEvent: typeof data.event === "string" ? data.event : "unknown"
  };
}

async function handleSessionEvent(payload, sender) {
  const settings = await getSettings();
  const currentState = await getState();
  const incoming = normalizeIncomingPayload(payload);

  await setState({
    lastHeartbeat: Date.now(),
    lastKnownMode: incoming.mode || currentState.lastKnownMode,
    lastKnownTitle: incoming.title || currentState.lastKnownTitle,
    lastUnreadCount: incoming.unreadCount,
    lastTabId: sender?.tab?.id ?? currentState.lastTabId,
    monitoringActive: true
  });

  if (incoming.rawEvent === "heartbeat") {
    return { ok: true };
  }

  const eventsToEmit = [];

  if (incoming.rawEvent === "qr-login-detected") {
    eventsToEmit.push({
      type: "qr_login_detected",
      severity: "high",
      title: "QR login detected",
      message: "WhatsApp Web currently displays a QR pairing view.",
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "session-active") {
    eventsToEmit.push({
      type: "session_active",
      severity: "low",
      title: "Active session detected",
      message: "An active WhatsApp Web session was detected.",
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "session-logged-out") {
    eventsToEmit.push({
      type: "session_logged_out",
      severity: "medium",
      title: "Session change detected",
      message: "The WhatsApp Web session appears to be logged out or reset.",
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "title-changed" && settings.logTitleChanges) {
    eventsToEmit.push({
      type: "title_changed",
      severity: "info",
      title: "Title changed",
      message: `Page title changed: ${incoming.title || "Unknown"}`,
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "unread-count-changed" && settings.trackUnreadChanges) {
    eventsToEmit.push({
      type: "unread_count_changed",
      severity: "info",
      title: "Unread count changed",
      message: `New unread count detected: ${incoming.unreadCount}`,
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "visibility-changed" && settings.trackVisibility) {
    eventsToEmit.push({
      type: "visibility_changed",
      severity: "info",
      title: "Visibility changed",
      message: `Tab visibility: ${incoming.visibility}`,
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "focus-changed" && settings.trackFocus) {
    eventsToEmit.push({
      type: "focus_changed",
      severity: "info",
      title: "Focus changed",
      message: incoming.focused ? "The WhatsApp Web tab is focused." : "The WhatsApp Web tab lost focus.",
      source: "content",
      data: incoming
    });
  }

  if (incoming.rawEvent === "mode-changed") {
    let severity = "medium";
    let title = "Session mode changed";
    let message = `New mode: ${incoming.mode}`;

    if (incoming.mode === "active-session") {
      severity = "low";
      title = "Session active";
      message = "WhatsApp Web is currently in an active session.";
    } else if (incoming.mode === "qr-login") {
      severity = "high";
      title = "QR pairing detected";
      message = "The interface currently shows a QR login or a new pairing request.";
    }

    eventsToEmit.push({
      type: "mode_changed",
      severity,
      title,
      message,
      source: "content",
      data: incoming
    });
  }

  for (const event of eventsToEmit) {
    await logAndNotify(event);
  }

  return { ok: true };
}

async function exportEventsAsJson() {
  const events = await getEvents();
  return JSON.stringify(events, null, 2);
}

async function exportEventsAsCsv() {
  const events = await getEvents();
  const header = ["id", "timestamp", "type", "severity", "title", "message", "source", "data"];
  const rows = events.map((event) => [
    event.id,
    event.timestamp,
    event.type,
    event.severity,
    event.title,
    event.message,
    event.source,
    JSON.stringify(event.data || {})
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

async function ensureDefaults() {
  const existingSettings = await getFromStorage(STORAGE_KEYS.SETTINGS, null);
  if (!existingSettings) {
    await setToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  } else if (!existingSettings.uiLanguage) {
    await setToStorage(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...existingSettings, uiLanguage: "de" });
  }

  const existingState = await getFromStorage(STORAGE_KEYS.STATE, null);
  if (!existingState) {
    await setToStorage(STORAGE_KEYS.STATE, DEFAULT_STATE);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  (async () => {
    await ensureDefaults();

    await logAndNotify({
      type: "extension_installed",
      severity: "low",
      title: details.reason === "update" ? "Extension updated" : "Extension installed",
      message: details.reason === "update" ? "WA Guardian was updated successfully." : "WA Guardian was installed successfully.",
      source: "background",
      data: { reason: details.reason || "unknown" }
    });

    await handleTabMonitoringState();
  })().catch((error) => {
    console.error(`[${APP_NAME}] onInstalled failed`, error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  (async () => {
    await ensureDefaults();
    await handleTabMonitoringState();
  })().catch((error) => {
    console.error(`[${APP_NAME}] onStartup failed`, error);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  (async () => {
    const url = changeInfo.url || tab?.url || "";
    if (!isWhatsAppWebUrl(url)) return;

    await setMonitoringStatus(true, tabId);

    if (changeInfo.status === "complete") {
      await logAndNotify({
        type: "whatsapp_tab_loaded",
        severity: "low",
        title: "WhatsApp Web loaded",
        message: "A WhatsApp Web tab finished loading.",
        source: "background",
        data: { tabId, url }
      });
    }
  })().catch((error) => {
    console.warn(`[${APP_NAME}] Failed to process tab update`, error);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  (async () => {
    const currentState = await getState();
    if (currentState.lastTabId !== tabId) return;

    const remainingTabs = await findWhatsAppTabs();

    if (remainingTabs.length === 0) {
      await logAndNotify({
        type: "whatsapp_tab_closed",
        severity: "low",
        title: "WhatsApp Web closed",
        message: "The last monitored WhatsApp Web tab was closed.",
        source: "background",
        data: { tabId }
      });

      await setMonitoringStatus(false, null);
      await setState({
        lastHeartbeat: 0,
        lastKnownMode: "unknown",
        lastKnownTitle: "",
        lastUnreadCount: 0
      });
      return;
    }

    await setMonitoringStatus(true, remainingTabs[0].id);
  })().catch((error) => {
    console.warn(`[${APP_NAME}] Failed to process tab removal`, error);
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  (async () => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || !isWhatsAppWebUrl(tab.url || "")) return;

    await setMonitoringStatus(true, tab.id);

    await logAndNotify({
      type: "whatsapp_tab_activated",
      severity: "info",
      title: "WhatsApp Web tab activated",
      message: "A monitored WhatsApp Web tab was activated.",
      source: "background",
      data: { tabId: tab.id, url: tab.url || "" }
    });
  })().catch((error) => {
    console.warn(`[${APP_NAME}] Failed to process tab activation`, error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (!message || typeof message !== "object") {
        sendResponse({ ok: false, error: "Invalid message payload" });
        return;
      }

      switch (message.type) {
        case "WA_EVENT": {
          const result = await handleSessionEvent(message.payload, sender);
          sendResponse(result);
          return;
        }
        case "GET_SETTINGS": {
          sendResponse({ ok: true, settings: await getSettings() });
          return;
        }
        case "SAVE_SETTINGS": {
          const current = await getSettings();
          const next = { ...current, ...(message.payload || {}) };
          await setToStorage(STORAGE_KEYS.SETTINGS, next);
          await logAndNotify({
            type: "settings_updated",
            severity: "info",
            title: "Settings updated",
            message: "The monitoring settings were saved successfully.",
            source: "background",
            data: next
          });
          sendResponse({ ok: true, settings: next });
          return;
        }
        case "GET_STATE": {
          sendResponse({ ok: true, state: await getState() });
          return;
        }
        case "GET_EVENTS": {
          sendResponse({ ok: true, events: await getEvents() });
          return;
        }
        case "CLEAR_EVENTS": {
          await clearEvents();
          await updateBadge("", "");
          sendResponse({ ok: true });
          return;
        }
        case "EXPORT_EVENTS_JSON": {
          sendResponse({ ok: true, content: await exportEventsAsJson() });
          return;
        }
        case "EXPORT_EVENTS_CSV": {
          sendResponse({ ok: true, content: await exportEventsAsCsv() });
          return;
        }
        case "PING": {
          sendResponse({ ok: true, ts: nowIso() });
          return;
        }
        default: {
          sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
        }
      }
    } catch (error) {
      console.error(`[${APP_NAME}] Runtime message handling failed`, error);
      sendResponse({ ok: false, error: error?.message || "Unknown background error" });
    }
  })();

  return true;
});

setInterval(() => {
  (async () => {
    try {
      const settings = await getSettings();
      const currentState = await getState();

      if (!currentState.monitoringActive || !currentState.lastTabId) return;

      const tabs = await findWhatsAppTabs();
      if (tabs.length === 0) {
        await setMonitoringStatus(false, null);
        return;
      }

      const elapsed = Date.now() - (currentState.lastHeartbeat || 0);
      if (currentState.lastHeartbeat > 0 && elapsed > settings.heartbeatTimeoutMs) {
        await logAndNotify({
          type: "heartbeat_timeout",
          severity: "medium",
          title: "Heartbeat timeout detected",
          message: `No heartbeat has been received for ${Math.round(elapsed / 1000)} seconds.`,
          source: "background",
          data: {
            elapsedMs: elapsed,
            timeoutMs: settings.heartbeatTimeoutMs,
            tabId: currentState.lastTabId
          }
        });

        await setState({ lastHeartbeat: Date.now() });
      }
    } catch (error) {
      console.error(`[${APP_NAME}] Heartbeat monitor failed`, error);
    }
  })();
}, 10000);
