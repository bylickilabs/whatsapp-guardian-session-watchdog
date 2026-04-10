// WA Guardian - Session Watchdog
// Copyright (c) 2026 Thorsten Bylicki / BYLICKILABS. All rights reserved.

const els = {
  appTitle: document.getElementById("appTitle"),
  monitoringStatus: document.getElementById("monitoringStatus"),
  modeValue: document.getElementById("modeValue"),
  unreadValue: document.getElementById("unreadValue"),
  eventCountValue: document.getElementById("eventCountValue"),
  statusMessage: document.getElementById("statusMessage"),
  eventList: document.getElementById("eventList"),
  refreshBtn: document.getElementById("refreshBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  clearEventsBtn: document.getElementById("clearEventsBtn"),
  openOptionsBtn: document.getElementById("openOptionsBtn"),
  languageToggleBtn: document.getElementById("languageToggleBtn"),
  infoBtn: document.getElementById("infoBtn"),
  closeInfoBtn: document.getElementById("closeInfoBtn"),
  infoModal: document.getElementById("infoModal"),
  labelStatus: document.getElementById("labelStatus"),
  labelMode: document.getElementById("labelMode"),
  labelUnread: document.getElementById("labelUnread"),
  labelEvents: document.getElementById("labelEvents"),
  recentEventsTitle: document.getElementById("recentEventsTitle"),
  footerText: document.getElementById("footerText"),
  infoTitle: document.getElementById("infoTitle"),
  infoIntro: document.getElementById("infoIntro"),
  infoPurposeLabel: document.getElementById("infoPurposeLabel"),
  infoPurposeText: document.getElementById("infoPurposeText"),
  infoScopeLabel: document.getElementById("infoScopeLabel"),
  infoScopeText: document.getElementById("infoScopeText"),
  infoUseLabel: document.getElementById("infoUseLabel"),
  infoUseText: document.getElementById("infoUseText")
};

const I18N = {
  de: {
    appTitle: "Session Watchdog",
    options: "Optionen",
    info: "Info",
    status: "Status",
    mode: "Modus",
    unread: "Ungelesen",
    events: "Events",
    active: "Aktiv",
    inactive: "Inaktiv",
    unknown: "Unbekannt",
    ready: "Bereit.",
    monitoringActive: "Überwachung aktiv • Letzter Modus: {mode}",
    monitoringInactive: "Überwachung derzeit nicht aktiv.",
    refresh: "Aktualisieren",
    clear: "Leeren",
    recentEvents: "Letzte Ereignisse",
    noEvents: "Keine Ereignisse vorhanden.",
    jsonStart: "JSON-Export wird erstellt ...",
    jsonDone: "JSON-Export erfolgreich erstellt.",
    csvStart: "CSV-Export wird erstellt ...",
    csvDone: "CSV-Export erfolgreich erstellt.",
    clearDone: "Ereignisse wurden gelöscht.",
    loadFailed: "Initialisierung fehlgeschlagen: {message}",
    exportFailed: "Export fehlgeschlagen: {message}",
    clearFailed: "Löschen fehlgeschlagen: {message}",
    infoTitle: "Informationen zur Anwendung",
    infoIntro: "WA Guardian ist eine defensive Browser-Erweiterung zur Überwachung von Zustandsänderungen in WhatsApp Web. Die Anwendung ist auf Transparenz, Kontrolle und Nachvollziehbarkeit innerhalb laufender Browser-Sitzungen ausgelegt.",
    infoPurposeLabel: "Zweck",
    infoPurposeText: "Erkennung von QR-Login-Ansichten, Sitzungswechseln, Fokus-, Sichtbarkeits- und Heartbeat-Ereignissen innerhalb der überwachten Sitzung.",
    infoScopeLabel: "Umfang",
    infoScopeText: "Die Anwendung überwacht Status- und Zustandsinformationen. Sie liest oder exportiert keine Chat-Inhalte und ist auf defensive Auswertung ausgelegt.",
    infoUseLabel: "Verwendung",
    infoUseText: "Die Erweiterung eignet sich für Test-, Analyse- und Awareness-Szenarien auf eigenen oder autorisierten Systemen. Die UI unterstützt Deutsch und Englisch über einen direkten Sprachumschalter.",
    footer: "© 2026 Thorsten Bylicki / BYLICKILABS",
    exportJson: "JSON",
    exportCsv: "CSV",
    filenameBase: "wa-guardian-ereignisse"
  },
  en: {
    appTitle: "Session Watchdog",
    options: "Options",
    info: "Info",
    status: "Status",
    mode: "Mode",
    unread: "Unread",
    events: "Events",
    active: "Active",
    inactive: "Inactive",
    unknown: "Unknown",
    ready: "Ready.",
    monitoringActive: "Monitoring active • Last mode: {mode}",
    monitoringInactive: "Monitoring is currently inactive.",
    refresh: "Refresh",
    clear: "Clear",
    recentEvents: "Recent events",
    noEvents: "No events available.",
    jsonStart: "Preparing JSON export ...",
    jsonDone: "JSON export created successfully.",
    csvStart: "Preparing CSV export ...",
    csvDone: "CSV export created successfully.",
    clearDone: "Events were cleared.",
    loadFailed: "Initialization failed: {message}",
    exportFailed: "Export failed: {message}",
    clearFailed: "Clearing failed: {message}",
    infoTitle: "Application information",
    infoIntro: "WA Guardian is a defensive browser extension for monitoring state changes inside WhatsApp Web. The application is designed for transparency, control and traceability within active browser sessions.",
    infoPurposeLabel: "Purpose",
    infoPurposeText: "Detect QR login views, session transitions, focus, visibility and heartbeat events inside the monitored session.",
    infoScopeLabel: "Scope",
    infoScopeText: "The application monitors status and state information. It does not read or export chat content and is designed for defensive analysis.",
    infoUseLabel: "Use case",
    infoUseText: "The extension is suitable for testing, analysis and awareness scenarios on owned or authorized systems. The UI supports German and English via a direct language switch button.",
    footer: "© 2026 Thorsten Bylicki / BYLICKILABS",
    exportJson: "JSON",
    exportCsv: "CSV",
    filenameBase: "wa-guardian-events"
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
  if (!els.statusMessage) return;
  els.statusMessage.textContent = text || "";
  els.statusMessage.dataset.state = isError ? "error" : "ok";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString(currentLanguage === "de" ? "de-DE" : "en-US");
  } catch {
    return String(value || "");
  }
}

function severityClass(severity) {
  switch (severity) {
    case "critical": return "sev-critical";
    case "high": return "sev-high";
    case "medium": return "sev-medium";
    case "low": return "sev-low";
    default: return "sev-info";
  }
}

async function sendMessage(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || "Unknown error");
  return response;
}

function getModeLabel(mode) {
  if (!mode || mode === "unknown") return t("unknown");
  return mode;
}

function renderEvents(events) {
  if (!els.eventList) return;
  if (!Array.isArray(events) || events.length === 0) {
    els.eventList.innerHTML = `<div class="empty-state">${escapeHtml(t("noEvents"))}</div>`;
    return;
  }

  els.eventList.innerHTML = events.slice(0, 12).map((event) => `
    <article class="event-card ${severityClass(event.severity)}">
      <div class="event-topline">
        <strong>${escapeHtml(event.title || "Event")}</strong>
        <span>${escapeHtml(formatDate(event.timestamp))}</span>
      </div>
      <div class="event-meta">
        <span>${escapeHtml(event.type || "unknown")}</span>
        <span>${escapeHtml(event.severity || "info")}</span>
        <span>${escapeHtml(event.source || "background")}</span>
      </div>
      <div class="event-message">${escapeHtml(event.message || "")}</div>
    </article>
  `).join("");
}

function downloadTextFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function buildTimestampedFilename(extension) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${t("filenameBase")}-${stamp}.${extension}`;
}

function applyStaticText() {
  document.documentElement.lang = currentLanguage;
  els.appTitle.textContent = t("appTitle");
  els.openOptionsBtn.textContent = t("options");
  els.infoBtn.textContent = t("info");
  els.labelStatus.textContent = t("status");
  els.labelMode.textContent = t("mode");
  els.labelUnread.textContent = t("unread");
  els.labelEvents.textContent = t("events");
  els.refreshBtn.textContent = t("refresh");
  els.clearEventsBtn.textContent = t("clear");
  els.recentEventsTitle.textContent = t("recentEvents");
  els.footerText.textContent = t("footer");
  els.infoTitle.textContent = t("infoTitle");
  els.infoIntro.textContent = t("infoIntro");
  els.infoPurposeLabel.textContent = t("infoPurposeLabel");
  els.infoPurposeText.textContent = t("infoPurposeText");
  els.infoScopeLabel.textContent = t("infoScopeLabel");
  els.infoScopeText.textContent = t("infoScopeText");
  els.infoUseLabel.textContent = t("infoUseLabel");
  els.infoUseText.textContent = t("infoUseText");
}

async function loadState() {
  const [stateRes, eventsRes, settingsRes] = await Promise.all([
    sendMessage({ type: "GET_STATE" }),
    sendMessage({ type: "GET_EVENTS" }),
    sendMessage({ type: "GET_SETTINGS" })
  ]);

  currentLanguage = settingsRes.settings?.uiLanguage || "de";
  applyStaticText();

  const state = stateRes.state || {};
  const events = eventsRes.events || [];

  els.monitoringStatus.textContent = state.monitoringActive ? t("active") : t("inactive");
  els.modeValue.textContent = getModeLabel(state.lastKnownMode || "unknown");
  els.unreadValue.textContent = String(state.lastUnreadCount ?? 0);
  els.eventCountValue.textContent = String(events.length || 0);

  setStatus(
    state.monitoringActive
      ? t("monitoringActive", { mode: getModeLabel(state.lastKnownMode || "unknown") })
      : t("monitoringInactive"),
    false
  );

  renderEvents(events);
}

async function saveLanguage(language) {
  const settingsRes = await sendMessage({ type: "GET_SETTINGS" });
  const payload = { ...(settingsRes.settings || {}), uiLanguage: language };
  await sendMessage({ type: "SAVE_SETTINGS", payload });
}

async function toggleLanguage() {
  currentLanguage = currentLanguage === "de" ? "en" : "de";
  await saveLanguage(currentLanguage);
  await loadState();
}

async function handleExportJson() {
  try {
    setStatus(t("jsonStart"));
    const response = await sendMessage({ type: "EXPORT_EVENTS_JSON" });
    downloadTextFile(response.content || "[]", buildTimestampedFilename("json"), "application/json;charset=utf-8");
    setStatus(t("jsonDone"));
  } catch (error) {
    console.error("[WA Guardian] JSON export failed", error);
    setStatus(t("exportFailed", { message: error.message }), true);
  }
}

async function handleExportCsv() {
  try {
    setStatus(t("csvStart"));
    const response = await sendMessage({ type: "EXPORT_EVENTS_CSV" });
    downloadTextFile(response.content || "", buildTimestampedFilename("csv"), "text/csv;charset=utf-8");
    setStatus(t("csvDone"));
  } catch (error) {
    console.error("[WA Guardian] CSV export failed", error);
    setStatus(t("exportFailed", { message: error.message }), true);
  }
}

async function handleClearEvents() {
  try {
    await sendMessage({ type: "CLEAR_EVENTS" });
    await loadState();
    setStatus(t("clearDone"));
  } catch (error) {
    console.error("[WA Guardian] Clear events failed", error);
    setStatus(t("clearFailed", { message: error.message }), true);
  }
}

function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
}

function openInfoModal() {
  els.infoModal.classList.remove("hidden");
  els.infoModal.setAttribute("aria-hidden", "false");
}

function closeInfoModal() {
  els.infoModal.classList.add("hidden");
  els.infoModal.setAttribute("aria-hidden", "true");
}

async function init() {
  els.refreshBtn?.addEventListener("click", () => loadState().catch((error) => setStatus(error.message, true)));
  els.exportJsonBtn?.addEventListener("click", handleExportJson);
  els.exportCsvBtn?.addEventListener("click", handleExportCsv);
  els.clearEventsBtn?.addEventListener("click", handleClearEvents);
  els.openOptionsBtn?.addEventListener("click", openOptionsPage);
  els.languageToggleBtn?.addEventListener("click", () => toggleLanguage().catch((error) => setStatus(error.message, true)));
  els.infoBtn?.addEventListener("click", openInfoModal);
  els.closeInfoBtn?.addEventListener("click", closeInfoModal);
  els.infoModal?.addEventListener("click", (event) => {
    if (event.target === els.infoModal) closeInfoModal();
  });

  await loadState();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error("[WA Guardian] Popup init failed", error);
    setStatus(t("loadFailed", { message: error.message }), true);
  });
});