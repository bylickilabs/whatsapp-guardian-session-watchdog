# WA Guardian - Session Watchdog [DE/EN]

Eine Manifest-V3-Browser-Erweiterung zur defensiven Überwachung von **WhatsApp Web**-Sitzungen, zur Ereignisprotokollierung, zur Erkennung von QR-Login-Zuständen, zum Heartbeat-Monitoring, zum Export von Ereignisdaten sowie zur transparenten Anzeige sicherheitsrelevanter Zustandsänderungen.

## Inhaltsverzeichnis

- [Überblick](#überblick)
- [Zielsetzung](#zielsetzung)
- [Hauptfunktionen](#hauptfunktionen)
- [Projektstruktur](#projektstruktur)
- [Systemvoraussetzungen](#systemvoraussetzungen)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [Architektur](#architektur)
- [Berechtigungen](#berechtigungen)
- [Datenschutz und Sicherheitsansatz](#datenschutz-und-sicherheitsansatz)
- [Ereignisse und Export](#ereignisse-und-export)
- [Sprachunterstützung](#sprachunterstützung)
- [Fehlerbehebung](#fehlerbehebung)
- [Hinweis zur Opera-Veröffentlichung](#hinweis-zur-opera-veröffentlichung)
- [Versionierung](#versionierung)
- [Copyright und Rechte](#copyright-und-rechte)
- [Kontakt und Links](#kontakt-und-links)

## Überblick

**WA Guardian - Session Watchdog** ist eine sicherheitsorientierte Browser-Erweiterung, die Zustandsänderungen innerhalb einer lokalen **WhatsApp Web**-Sitzung sichtbar und nachvollziehbar macht. Der Fokus liegt nicht auf dem Auslesen privater Kommunikation, sondern auf der defensiven Beobachtung ausgewählter Sitzungszustände und Browserereignisse.

Die Anwendung wurde mit dem Ziel entwickelt, sicherheitsrelevante Änderungen innerhalb einer laufenden Browser-Sitzung früher zu erkennen, übersichtlicher darzustellen und strukturiert zu protokollieren.

## Zielsetzung

Die Erweiterung soll:

- laufende WhatsApp-Web-Sitzungen transparent machen
- relevante Zustandswechsel sichtbar erfassen
- QR-Login-Ansichten und mögliche Neukopplungszustände erkennen
- Fokus-, Sichtbarkeits- und Titeländerungen protokollieren
- Ereignisse lokal dokumentieren und exportierbar machen
- eine klare, verständliche und bilinguale Oberfläche bereitstellen

## Hauptfunktionen

- Defensives Monitoring von **WhatsApp Web**
- Erkennung von **QR-Login**-Ansichten
- Erkennung aktiver Sitzungen
- Erkennung möglicher Logout- oder Rücksetz-Zustände
- Überwachung von:
  - Seitentiteländerungen
  - Änderungen der ungelesenen Anzahl
  - Fokuswechseln des Tabs
  - Sichtbarkeitswechseln des Tabs
  - Heartbeat-Timeouts
- Strukturierte Ereignisprotokollierung
- Export der Ereignisliste als:
  - JSON
  - CSV
- Popup-Ansicht mit Status und Event-Überblick
- Einstellungsseite für persistente Optionen
- Vollständige Oberfläche in **Deutsch und Englisch**
- Sprachumschaltung per Button
- Info-Button mit Informationen über die Anwendung

## Projektstruktur

```text
manifest.json
background.js
content.js
popup.html
popup.js
options.html
options.js
styles.css
icons/
README.md
```

## Systemvoraussetzungen

- Chromium-basierter Browser mit **Manifest V3**
- Google Chrome, Chromium, Microsoft Edge oder Opera
- Zugriff auf `https://web.whatsapp.com/*`

## Installation

### Als entpackte Erweiterung laden

1. Repository herunterladen oder klonen.
2. Sicherstellen, dass sich alle Projektdateien direkt im Projektordner befinden.
3. Erweiterungsverwaltung des Browsers öffnen:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`
4. **Entwicklermodus** aktivieren.
5. **Entpackte Erweiterung laden** auswählen.
6. Den Projektordner auswählen.
7. `https://web.whatsapp.com/` danach mit **Strg + F5** neu laden.

### Hinweis für ZIP-Pakete

Wenn das Projekt als ZIP archiviert wird, muss sich die Datei `manifest.json` direkt im **Root der ZIP-Datei** befinden. Sie darf nicht in einem zusätzlichen Unterordner liegen.

## Verwendung

Nach dem erfolgreichen Laden der Erweiterung:

1. **WhatsApp Web** öffnen.
2. Das Erweiterungssymbol in der Browserleiste anklicken.
3. Den aktuellen Überwachungsstatus im Popup einsehen.
4. Über den **Sprachbutton** zwischen Deutsch und Englisch wechseln.
5. Über den **Info-Button** Informationen zur Anwendung aufrufen.
6. Über die **Optionen** das Verhalten anpassen.
7. Bei Bedarf Ereignisse als JSON oder CSV exportieren.

## Architektur

### `manifest.json`
Definiert:
- Manifest-V3-Konfiguration
- Berechtigungen
- Host-Berechtigungen
- Background-Service-Worker
- Popup
- Options-Seite
- Ziel der Content-Script-Injektion

### `background.js`
Zuständig für:
- Empfang von Ereignissen aus dem Content Script
- Status- und Event-Speicherung
- Badge-Aktualisierung
- Benachrichtigungen
- Exportfunktionen
- Heartbeat-Monitoring
- Weitergabe von Zustandsdaten an Popup und Optionen

### `content.js`
Zuständig für:
- Beobachtung der WhatsApp-Web-Seite
- Erkennung von Moduswechseln
- Erkennung von QR-Login, aktiver Sitzung und unbekanntem Zustand
- Erfassung von Fokus-, Sichtbarkeits-, Titel- und Zähleränderungen
- Versand normalisierter Ereignisse an den Service Worker

### `popup.html` / `popup.js`
Zuständig für:
- Darstellung des aktuellen Status
- Anzeige aktueller Ereignisse
- Export-Funktionen
- Sprachumschaltung
- Info-Bereich / Info-Button
- Bedienung direkt aus der Toolbar

### `options.html` / `options.js`
Zuständig für:
- Konfiguration der Anwendung
- persistente Speicherung von Einstellungen
- Sprachverwaltung
- Anpassung von Benachrichtigungen und Logging-Verhalten

## Berechtigungen

Die Erweiterung verwendet folgende Berechtigungen:

- `storage`  
  zur Speicherung von Einstellungen, Zuständen und Ereignisprotokollen

- `tabs`  
  zur Erkennung und Überwachung von WhatsApp-Web-Tabs

- `notifications`  
  für Benachrichtigungen bei relevanten Ereignissen mittlerer und hoher Priorität

Host-Berechtigung:

- `https://web.whatsapp.com/*`  
  für das Laden des Content Scripts auf WhatsApp Web

## Datenschutz und Sicherheitsansatz

WA Guardian ist als **defensives Werkzeug** konzipiert.

Die Anwendung soll:
- Sitzungszustände beobachten
- technische Metadaten erfassen
- sicherheitsrelevante Änderungen transparent machen

Die Anwendung ist **nicht** dafür gedacht:
- private Nachrichten für Dritte auszulesen
- Schutzmechanismen von WhatsApp zu umgehen
- fremde Konten zu kompromittieren
- andere Personen ohne Zustimmung zu überwachen

Alle erfassten Daten werden lokal im Erweiterungsspeicher gehalten, sofern die Anwendung nicht absichtlich erweitert oder verändert wird.

## Ereignisse und Export

Die Anwendung kann Ereignisprotokolle in folgenden Formaten exportieren:

- **JSON** für strukturierte maschinenlesbare Auswertung
- **CSV** für Dokumentation, Tabellenkalkulation und operative Analyse

Typische Event-Typen sind:

- `mode_changed`
- `qr_login_detected`
- `session_active`
- `session_logged_out`
- `title_changed`
- `unread_count_changed`
- `visibility_changed`
- `focus_changed`
- `heartbeat_timeout`

## Sprachunterstützung

Die Anwendung enthält eine vollständige Oberfläche in:

- Deutsch
- Englisch

Die ausgewählte Sprache wird persistent gespeichert und sowohl im Popup als auch in den Optionen wiederverwendet.

## Fehlerbehebung

### Popup öffnet sich nicht

Prüfen:
- `manifest.json` enthält `action.default_popup`
- `popup.html` liegt am richtigen Pfad
- `popup.js` erzeugt keinen Laufzeitfehler

### Optionen öffnen sich nicht

Prüfen:
- `manifest.json` enthält `options_page`
- `options.html` liegt am richtigen Pfad
- `options.js` läuft fehlerfrei

### Status bleibt auf `unknown`

Prüfen:
- `content.js` wird wirklich auf `web.whatsapp.com` geladen
- die Erweiterung wurde nach Änderungen neu geladen
- der WhatsApp-Web-Tab wurde mit **Strg + F5** aktualisiert

### Alte Logs oder alte Codepfade tauchen weiter auf

In diesem Fall läuft meist noch eine ältere, entpackte Version der Erweiterung. Erweiterung im UI neu laden und anschließend den Ziel-Tab hart aktualisieren.

### Export funktioniert nicht

Prüfen:
- Export-Buttons sind korrekt mit `popup.js` verdrahtet
- `background.js` beantwortet `EXPORT_EVENTS_JSON` und `EXPORT_EVENTS_CSV`
- `popup.js` erzeugt aus dem Rückgabewert tatsächlich einen Datei-Download

## Hinweis zur Opera-Veröffentlichung

Bei Opera-Uploads ist darauf zu achten, dass:

- das Paket als **Extension** und nicht als Wallpaper/Persona hochgeladen wird
- `manifest.json` direkt im ZIP-Root liegt
- keine zusätzliche oberste Projektebene innerhalb der ZIP vorhanden ist

## Versionierung

Aktuelle Basisversion:

- **1.0.0**

Empfohlenes Schema:

- `1.0.0`
- `1.0.1`
- `...`

## Copyright und Rechte

**WA Guardian - Session Watchdog**  
Copyright (c) 2026 Thorsten Bylicki / BYLICKILABS. All rights reserved.

Projekt / Publisher:  
**BYLICKILABS**

GitHub:  
`https://github.com/bylickilabs`

## Kontakt und Links

- GitHub-Profil: `https://github.com/bylickilabs`
- WhatsApp Web: `https://web.whatsapp.com/`
