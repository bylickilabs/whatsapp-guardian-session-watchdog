// Whatsapp Guardian - Session Watchdog
// Copyright (c) 2026 Thorsten Bylicki / BYLICKILABS. All rights reserved.

(() => {
  "use strict";

  const APP_NAME = "WA Guardian - Session Watchdog";

  const CONFIG = {
    heartbeatMs: 10000,
    classifyIntervalMs: 4000,
    mutationDebounceMs: 700,
    minCanvasQrSize: 180,
    maxBodyTextLength: 25000
  };

  const state = {
    initialized: false,
    destroyed: false,
    lastMode: "unknown",
    lastTitle: "",
    lastUnreadCount: 0,
    lastVisibility: document.visibilityState || "visible",
    lastFocused: typeof document.hasFocus === "function" ? document.hasFocus() : true,
    lastHeartbeatAt: 0,
    lastClassifyAt: 0,
    observer: null,
    heartbeatIntervalId: null,
    classifyIntervalId: null,
    mutationDebounceTimer: null
  };

  function log(...args) {
    console.log(`[${APP_NAME}]`, ...args);
  }

  function warn(...args) {
    console.warn(`[${APP_NAME}]`, ...args);
  }

  function isRuntimeAvailable() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  function clearTimer(timerId) {
    if (timerId) clearTimeout(timerId);
    return null;
  }

  function clearIntervalSafe(intervalId) {
    if (intervalId) clearInterval(intervalId);
    return null;
  }

  function cleanupDomHooks() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch {}
      state.observer = null;
    }

    window.removeEventListener("focus", onFocusChange, true);
    window.removeEventListener("blur", onFocusChange, true);
    document.removeEventListener("visibilitychange", onVisibilityChange, true);
    window.removeEventListener("pagehide", onPageHide, true);

    state.mutationDebounceTimer = clearTimer(state.mutationDebounceTimer);
    state.heartbeatIntervalId = clearIntervalSafe(state.heartbeatIntervalId);
    state.classifyIntervalId = clearIntervalSafe(state.classifyIntervalId);
  }

  function destroy(reason = "unknown", logAsWarning = true) {
    if (state.destroyed) return;
    state.destroyed = true;
    cleanupDomHooks();
    const msg = `Content script stopped: ${reason}`;
    if (logAsWarning) warn(msg); else log(msg);
  }

  function safeNowIso() {
    try { return new Date().toISOString(); } catch { return ""; }
  }

  function extractUnreadCount(title) {
    if (!title || typeof title !== "string") return 0;
    const match = /^\((\d+)\)/.exec(title.trim());
    if (!match) return 0;
    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getBodyText() {
    try {
      const text = document.body?.innerText || "";
      return text.slice(0, CONFIG.maxBodyTextLength);
    } catch {
      return "";
    }
  }

  function getCanvasCandidates() {
    try { return Array.from(document.querySelectorAll("canvas")); } catch { return []; }
  }

  function hasLikelyQrCanvas() {
    return getCanvasCandidates().some((canvas) => {
      try {
        const rect = canvas.getBoundingClientRect();
        return rect.width >= CONFIG.minCanvasQrSize && rect.height >= CONFIG.minCanvasQrSize;
      } catch {
        return false;
      }
    });
  }

  function detectMode() {
    const text = getBodyText();
    const qrHints = [
      "Scanne den QR-Code",
      "Scan the QR code",
      "Mit deinem Telefon verknüpfen",
      "Verknüpfe ein Gerät",
      "Link a device",
      "Link with phone number"
    ];
    const activeHints = [
      "Archiviert",
      "Archived",
      "Chats",
      "Communities",
      "Kanäle",
      "Channels",
      "Status"
    ];

    const qrDetected = qrHints.some((hint) => text.includes(hint)) || hasLikelyQrCanvas();
    const activeDetected = activeHints.some((hint) => text.includes(hint));

    if (qrDetected) return "qr-login";
    if (activeDetected) return "active-session";
    return "unknown";
  }

  function buildPayload(event, extra = {}) {
    return {
      event,
      mode: detectMode(),
      title: document.title || "",
      unreadCount: extractUnreadCount(document.title || ""),
      visibility: document.visibilityState || "visible",
      focused: typeof document.hasFocus === "function" ? document.hasFocus() : true,
      url: location.href,
      detail: typeof extra.detail === "string" ? extra.detail : "",
      ts: safeNowIso(),
      ...extra
    };
  }

  async function sendEvent(event, extra = {}) {
    if (state.destroyed) return false;
    if (!isRuntimeAvailable()) {
      destroy("extension-context-unavailable");
      return false;
    }
    const payload = buildPayload(event, extra);

    try {
      const response = await chrome.runtime.sendMessage({ type: "WA_EVENT", payload });
      return !!response?.ok;
    } catch (error) {
      const message = String(error?.message || error || "");
      if (message.includes("Extension context invalidated") || message.includes("Receiving end does not exist")) {
        destroy("extension-context-invalidated");
        return false;
      }
      warn("sendMessage failed:", message);
      return false;
    }
  }

  async function emitModeChanges(currentMode) {
    if (currentMode === state.lastMode) return;
    const previousMode = state.lastMode;
    state.lastMode = currentMode;

    await sendEvent("mode-changed", { detail: `${previousMode} -> ${currentMode}` });

    if (currentMode === "qr-login") {
      await sendEvent("qr-login-detected", { detail: "WhatsApp Web zeigt eine QR-Verknüpfung an." });
      return;
    }
    if (currentMode === "active-session") {
      await sendEvent("session-active", { detail: "Aktive WhatsApp-Web-Sitzung erkannt." });
      return;
    }
    if (previousMode === "active-session" && currentMode === "unknown") {
      await sendEvent("session-logged-out", { detail: "Sitzung möglicherweise beendet oder Oberfläche zurückgesetzt." });
    }
  }

  async function emitTitleChanges(currentTitle) {
    if (currentTitle === state.lastTitle) return;
    state.lastTitle = currentTitle;
    await sendEvent("title-changed", { detail: currentTitle });
  }

  async function emitUnreadChanges(currentUnread) {
    if (currentUnread === state.lastUnreadCount) return;
    state.lastUnreadCount = currentUnread;
    await sendEvent("unread-count-changed", { detail: String(currentUnread), unreadCount: currentUnread });
  }

  async function classifyAndEmit() {
    if (state.destroyed) return;
    const now = Date.now();
    if (now - state.lastClassifyAt < 300) return;
    state.lastClassifyAt = now;

    const currentMode = detectMode();
    const currentTitle = document.title || "";
    const currentUnread = extractUnreadCount(currentTitle);

    await emitModeChanges(currentMode);
    await emitTitleChanges(currentTitle);
    await emitUnreadChanges(currentUnread);
  }

  async function sendHeartbeat() {
    if (state.destroyed) return;
    const now = Date.now();
    if (now - state.lastHeartbeatAt < 2000) return;
    state.lastHeartbeatAt = now;
    await sendEvent("heartbeat", { detail: "alive" });
  }

  async function onVisibilityChange() {
    if (state.destroyed) return;
    const currentVisibility = document.visibilityState || "visible";
    if (currentVisibility === state.lastVisibility) return;
    state.lastVisibility = currentVisibility;
    await sendEvent("visibility-changed", { detail: currentVisibility, visibility: currentVisibility });
  }

  async function onFocusChange() {
    if (state.destroyed) return;
    const currentFocused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
    if (currentFocused === state.lastFocused) return;
    state.lastFocused = currentFocused;
    await sendEvent("focus-changed", { detail: currentFocused ? "focused" : "blurred", focused: currentFocused });
  }

  function onPageHide() {
    destroy("page-hide", false);
  }

  function installObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(() => {
      if (state.destroyed) return;
      state.mutationDebounceTimer = clearTimer(state.mutationDebounceTimer);
      state.mutationDebounceTimer = setTimeout(() => {
        classifyAndEmit().catch((error) => warn("classifyAndEmit failed:", error));
      }, CONFIG.mutationDebounceMs);
    });

    try {
      state.observer.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false
      });
    } catch (error) {
      warn("Observer installation failed:", error);
    }
  }

  function installEventListeners() {
    window.addEventListener("focus", onFocusChange, true);
    window.addEventListener("blur", onFocusChange, true);
    document.addEventListener("visibilitychange", onVisibilityChange, true);
    window.addEventListener("pagehide", onPageHide, true);
  }

  function installIntervals() {
    state.heartbeatIntervalId = setInterval(() => {
      sendHeartbeat().catch((error) => warn("heartbeat failed:", error));
    }, CONFIG.heartbeatMs);

    state.classifyIntervalId = setInterval(() => {
      classifyAndEmit().catch((error) => warn("periodic classify failed:", error));
    }, CONFIG.classifyIntervalMs);
  }

  async function bootstrapInitialState() {
    state.lastMode = detectMode();
    state.lastTitle = document.title || "";
    state.lastUnreadCount = extractUnreadCount(state.lastTitle);
    state.lastVisibility = document.visibilityState || "visible";
    state.lastFocused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
  }

  async function init() {
    if (state.initialized || state.destroyed) return;
    state.initialized = true;
    if (!isRuntimeAvailable()) {
      destroy("no-runtime-context-on-init");
      return;
    }

    await bootstrapInitialState();
    installObserver();
    installEventListeners();
    installIntervals();

    await sendHeartbeat();
    await classifyAndEmit();

    log("Content script initialized.");
  }

  init().catch((error) => {
    warn("Initialization failed:", error);
    destroy("init-failed");
  });
})();