// WA Guardian - Session Watchdog
// Copyright (c) 2026 Thorsten Bylicki / BYLICKILABS. All rights reserved.

const fields = {
  notificationsEnabled: document.getElementById("notificationsEnabled"),
  badgeEnabled: document.getElementById("badgeEnabled"),
  trackFocus: document.getElementById("trackFocus"),
  trackVisibility: document.getElementById("trackVisibility"),
  logTitleChanges: document.getElementById("logTitleChanges"),
  trackUnreadChanges: document.getElementById("trackUnreadChanges"),
  maxEvents: document.getElementById("maxEvents"),
  heartbeatTimeoutMs: document.getElementById("heartbeatTimeoutMs"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  reloadSettingsBtn: document.getElementById("reloadSettingsBtn"),
  optionsStatus: document.getElementById("optionsStatus"),
  languageToggleBtn: document.getElementById("languageToggleBtn"),
  infoBtn: document.getElementById("infoBtn"),
  closeInfoBtn: document.getElementById("closeInfoBtn"),
  infoModal: document.getElementById("infoModal"),
  optionsTitle: document.getElementById("optionsTitle"),
  labelNotifications: document.getElementById("labelNotifications"),
  labelBadge: document.getElementById("labelBadge"),
  labelFocus: document.getElementById("labelFocus"),
  labelVisibility: document.getElementById("labelVisibility"),
  labelTitleChanges: document.getElementById("labelTitleChanges"),
  labelUnreadChanges: document.getElementById("labelUnreadChanges"),
  labelMaxEvents: document.getElementById("labelMaxEvents"),
  labelHeartbeat: document.getElementById("labelHeartbeat"),
  footerText: document.getElementById("footerText"),
  infoTitle: document.getElementById("infoTitle"),
  infoIntro: document.getElementById("infoIntro"),
  infoLanguageLabel: document.getElementById("infoLanguageLabel"),
  infoLanguageText: document.getElementById("infoLanguageText"),
  infoSettingsLabel: document.getElementById("infoSettingsLabel"),
  infoSettingsText: document.getElementById("infoSettingsText"),
  infoStorageLabel: document.getElementById("infoStorageLabel"),
  infoStorageText: document.getElementById("infoStorageText")
};

const I18N = {
  de: {
    optionsTitle: "Optionen",
    notifications: "Benachrichtigungen aktivieren",
    badge: "Badge aktivieren",
    focus: "Fokusänderungen überwachen",
    visibility: "Sichtbarkeitsänderungen überwachen",
    titleChanges: "Titeländerungen protokollieren",
    unreadChanges: "Ungelesene Änderungen überwachen",
    maxEvents: "Maximale Anzahl gespeicherter Events",
    heartbeat: "Heartbeat Timeout in Millisekunden",
    save: "Speichern",
    reload: "Neu laden",
    ready: "Bereit.",
    loaded: "Einstellungen geladen.",
    saved: "Einstellungen gespeichert.",
    loadFailed: "Laden fehlgeschlagen: {message}",
    saveFailed: "Speichern fehlgeschlagen: {message}",
    info: "Info",
    footer: "© 2026 Thorsten Bylicki / BYLICKILABS",
    infoTitle: "Informationen zur Anwendung",
    infoIntro: "In den Optionen wird das Verhalten von WA Guardian für Monitoring, Logging und UI-Sprache verwaltet.",
    infoLanguageLabel: "Sprache",
    infoLanguageText: "Über den Sprachumschalter wird die Oberfläche direkt zwischen Deutsch und Englisch umgestellt. Die Auswahl wird dauerhaft gespeichert.",
    infoSettingsLabel: "Einstellungen",
    infoSettingsText: "Hier werden Benachrichtigungen, Badge-Anzeige, Fokus-, Sichtbarkeits-, Titel- und Ungelesen-Überwachung sowie Event-Limits und Heartbeat-Timeout verwaltet.",
    infoStorageLabel: "Speicherung",
    infoStorageText: "Die Konfiguration und der Event-Log werden lokal im Browser-Speicher der Erweiterung abgelegt.",
    unknownError: "Unbekannter Fehler"
  },
  en: {
    optionsTitle: "Options",
    notifications: "Enable notifications",
    badge: "Enable badge",
    focus: "Track focus changes",
    visibility: "Track visibility changes",
    titleChanges: "Log title changes",
    unreadChanges: "Track unread changes",
    maxEvents: "Maximum number of stored events",
    heartbeat: "Heartbeat timeout in milliseconds",
    save: "Save",
    reload: "Reload",
    ready: "Ready.",
    loaded: "Settings loaded.",
    saved: "Settings saved.",
    loadFailed: "Loading failed: {message}",
    saveFailed: "Saving failed: {message}",
    info: "Info",
    footer: "© 2026 Thorsten Bylicki / BYLICKILABS",
    infoTitle: "Application information",
    infoIntro: "The options page controls the WA Guardian behavior for monitoring, logging and UI language.",
    infoLanguageLabel: "Language",
    infoLanguageText: "The language switch button changes the interface directly between German and English. The selection is stored persistently.",
    infoSettingsLabel: "Settings",
    infoSettingsText: "This page manages notifications, badge display, focus, visibility, title and unread monitoring as well as event limits and heartbeat timeout.",
    infoStorageLabel: "Storage",
    infoStorageText: "Configuration and the event log are stored locally inside the extension browser storage.",
    unknownError: "Unknown error"
  }
};

let currentLanguage = "de";

function t(key, vars = {}) {
  const dict = I18N[currentLanguage] || I18N.de;
  let value = dict[key] || I18N.de[key] || key;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

function setStatus(text, isError = false) {
  if (!fields.optionsStatus) return;
  fields.optionsStatus.textContent = text || "";
  fields.optionsStatus.dataset.state = isError ? "error" : "ok";
}

async function sendMessage(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || t("unknownError"));
  return response;
}

function applyStaticText() {
  document.documentElement.lang = currentLanguage;
  fields.optionsTitle.textContent = t("optionsTitle");
  fields.labelNotifications.textContent = t("notifications");
  fields.labelBadge.textContent = t("badge");
  fields.labelFocus.textContent = t("focus");
  fields.labelVisibility.textContent = t("visibility");
  fields.labelTitleChanges.textContent = t("titleChanges");
  fields.labelUnreadChanges.textContent = t("unreadChanges");
  fields.labelMaxEvents.textContent = t("maxEvents");
  fields.labelHeartbeat.textContent = t("heartbeat");
  fields.saveSettingsBtn.textContent = t("save");
  fields.reloadSettingsBtn.textContent = t("reload");
  fields.infoBtn.textContent = t("info");
  fields.footerText.textContent = t("footer");
  fields.infoTitle.textContent = t("infoTitle");
  fields.infoIntro.textContent = t("infoIntro");
  fields.infoLanguageLabel.textContent = t("infoLanguageLabel");
  fields.infoLanguageText.textContent = t("infoLanguageText");
  fields.infoSettingsLabel.textContent = t("infoSettingsLabel");
  fields.infoSettingsText.textContent = t("infoSettingsText");
  fields.infoStorageLabel.textContent = t("infoStorageLabel");
  fields.infoStorageText.textContent = t("infoStorageText");
}

function applySettings(settings) {
  fields.notificationsEnabled.checked = !!settings.notificationsEnabled;
  fields.badgeEnabled.checked = !!settings.badgeEnabled;
  fields.trackFocus.checked = !!settings.trackFocus;
  fields.trackVisibility.checked = !!settings.trackVisibility;
  fields.logTitleChanges.checked = !!settings.logTitleChanges;
  fields.trackUnreadChanges.checked = !!settings.trackUnreadChanges;
  fields.maxEvents.value = Number(settings.maxEvents ?? 500);
  fields.heartbeatTimeoutMs.value = Number(settings.heartbeatTimeoutMs ?? 30000);
  currentLanguage = settings.uiLanguage || "de";
  applyStaticText();
}

function collectSettings() {
  return {
    notificationsEnabled: !!fields.notificationsEnabled.checked,
    badgeEnabled: !!fields.badgeEnabled.checked,
    trackFocus: !!fields.trackFocus.checked,
    trackVisibility: !!fields.trackVisibility.checked,
    logTitleChanges: !!fields.logTitleChanges.checked,
    trackUnreadChanges: !!fields.trackUnreadChanges.checked,
    maxEvents: Math.max(50, Number.parseInt(fields.maxEvents.value || "500", 10) || 500),
    heartbeatTimeoutMs: Math.max(5000, Number.parseInt(fields.heartbeatTimeoutMs.value || "30000", 10) || 30000),
    uiLanguage: currentLanguage
  };
}

async function loadSettings() {
  const response = await sendMessage({ type: "GET_SETTINGS" });
  applySettings(response.settings || {});
  setStatus(t("loaded"));
}

async function saveSettings() {
  const payload = collectSettings();
  await sendMessage({ type: "SAVE_SETTINGS", payload });
  setStatus(t("saved"));
}

async function toggleLanguage() {
  currentLanguage = currentLanguage === "de" ? "en" : "de";
  applyStaticText();
  await saveSettings();
}

function openInfoModal() {
  fields.infoModal.classList.remove("hidden");
  fields.infoModal.setAttribute("aria-hidden", "false");
}

function closeInfoModal() {
  fields.infoModal.classList.add("hidden");
  fields.infoModal.setAttribute("aria-hidden", "true");
}

async function init() {
  fields.saveSettingsBtn?.addEventListener("click", () => {
    saveSettings().catch((error) => {
      console.error("[WA Guardian] Save settings failed", error);
      setStatus(t("saveFailed", { message: error.message }), true);
    });
  });

  fields.reloadSettingsBtn?.addEventListener("click", () => {
    loadSettings().catch((error) => {
      console.error("[WA Guardian] Reload settings failed", error);
      setStatus(t("loadFailed", { message: error.message }), true);
    });
  });

  fields.languageToggleBtn?.addEventListener("click", () => {
    toggleLanguage().catch((error) => {
      console.error("[WA Guardian] Language toggle failed", error);
      setStatus(t("saveFailed", { message: error.message }), true);
    });
  });

  fields.infoBtn?.addEventListener("click", openInfoModal);
  fields.closeInfoBtn?.addEventListener("click", closeInfoModal);
  fields.infoModal?.addEventListener("click", (event) => {
    if (event.target === fields.infoModal) closeInfoModal();
  });

  await loadSettings();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error("[WA Guardian] Options init failed", error);
    setStatus(t("loadFailed", { message: error.message }), true);
  });
});