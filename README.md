COMING SOON

# WA Guardian - Session Watchdog

A Manifest V3 browser extension for defensive **WhatsApp Web** session monitoring, event logging, QR login detection, heartbeat supervision, bilingual UI support, and transparent visibility into selected browser session changes.

## Table of Contents

- [Overview](#overview)
- [Purpose](#purpose)
- [Main Features](#main-features)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Permissions](#permissions)
- [Privacy and Security Model](#privacy-and-security-model)
- [Events and Export](#events-and-export)
- [Localization](#localization)
- [Troubleshooting](#troubleshooting)
- [Opera Submission Note](#opera-submission-note)
- [Versioning](#versioning)
- [Copyright and Rights](#copyright-and-rights)
- [Contact and Links](#contact-and-links)

## Overview

**WA Guardian - Session Watchdog** is a security-oriented browser extension that makes selected changes inside a local **WhatsApp Web** session more transparent and easier to review. The extension is not intended to extract private conversations, but to monitor specific operational states and browser-level session indicators.

The project was designed to improve visibility into relevant session changes and to record them in a structured, exportable way.

## Purpose

The extension is intended to:

- make WhatsApp Web session states more transparent
- identify relevant browser session changes
- detect QR login / re-linking views
- record focus, visibility, title, and unread count changes
- store event information locally in a structured format
- provide a bilingual user interface with direct operational controls

## Main Features

- Defensive monitoring of **WhatsApp Web**
- Detection of **QR login** screens
- Detection of active sessions
- Detection of possible logout or reset states
- Monitoring of:
  - page title changes
  - unread counter changes
  - tab focus changes
  - tab visibility changes
  - heartbeat timeout conditions
- Structured event logging
- Export of event logs as:
  - JSON
  - CSV
- Popup UI with current status and event overview
- Options page for persistent preferences
- Fully bilingual user interface in **German and English**
- Language switch button
- Info button with application information

## Project Structure

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

## Requirements

- Chromium-based browser with **Manifest V3** support
- Google Chrome, Chromium, Microsoft Edge, or Opera
- Access to `https://web.whatsapp.com/*`

## Installation

### Load as unpacked extension

1. Download or clone the repository.
2. Make sure all project files are located directly inside the project folder.
3. Open the browser extension management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the project folder.
7. Reload `https://web.whatsapp.com/` using **Ctrl + F5**.

### ZIP packaging note

If the extension is packaged as a ZIP file, `manifest.json` must be placed directly in the **root of the ZIP archive**. It must not be nested inside an extra top-level folder.

## Usage

After loading the extension successfully:

1. Open **WhatsApp Web**.
2. Click the extension icon in the browser toolbar.
3. Review the current monitoring status in the popup.
4. Use the **language switch button** to change between German and English.
5. Use the **Info button** to open application information.
6. Open the **Options** page to adjust the behavior.
7. Export event logs if needed.

## Architecture

### `manifest.json`
Defines:
- Manifest V3 setup
- permissions
- host permissions
- background service worker
- popup
- options page
- content script injection target

### `background.js`
Responsible for:
- receiving events from the content script
- state and event persistence
- badge updates
- notification handling
- export generation
- heartbeat supervision
- delivering state data to popup and options

### `content.js`
Responsible for:
- observing the WhatsApp Web tab
- detecting mode changes
- recognizing QR login, active session, and unknown states
- collecting focus, visibility, title, and unread count changes
- sending normalized events to the service worker

### `popup.html` / `popup.js`
Responsible for:
- rendering the current monitoring status
- showing recent events
- export controls
- language switching
- info section / info button
- direct toolbar interaction

### `options.html` / `options.js`
Responsible for:
- application configuration
- persistent settings management
- language handling
- notification and logging preferences

## Permissions

The extension uses the following permissions:

- `storage`  
  for settings, state, and event log persistence

- `tabs`  
  for identifying and tracking WhatsApp Web tabs

- `notifications`  
  for medium and high severity notifications

Host permission:

- `https://web.whatsapp.com/*`  
  required to run the content script on WhatsApp Web

## Privacy and Security Model

WA Guardian is designed as a **defensive local monitoring tool**.

The application is intended to:
- observe session states
- record technical metadata
- make relevant operational changes visible

The application is **not intended to**:
- extract private messages for third parties
- bypass WhatsApp protections
- compromise other accounts
- monitor other people without authorization

All captured data remains in local extension storage unless the application is intentionally modified.

## Events and Export

The extension can export event logs in the following formats:

- **JSON** for structured machine-readable analysis
- **CSV** for documentation, spreadsheet import, and operational review

Typical event types include:

- `mode_changed`
- `qr_login_detected`
- `session_active`
- `session_logged_out`
- `title_changed`
- `unread_count_changed`
- `visibility_changed`
- `focus_changed`
- `heartbeat_timeout`

## Localization

The application includes a complete user interface in:

- German
- English

The selected language is stored persistently and reused across popup and options.

## Troubleshooting

### Popup does not open

Check:
- `manifest.json` contains `action.default_popup`
- `popup.html` exists in the correct path
- `popup.js` does not throw runtime errors

### Options page does not open

Check:
- `manifest.json` contains `options_page`
- `options.html` exists in the correct path
- `options.js` loads correctly

### Status remains `unknown`

Check:
- `content.js` is actually injected into `web.whatsapp.com`
- the extension was reloaded after code changes
- the WhatsApp Web tab was reloaded using **Ctrl + F5**

### Old code still appears in logs

This usually means the browser is still running a previous unpacked build. Reload the extension from the extensions UI and then hard refresh the target tab.

### Export does not work

Check:
- export buttons are correctly wired in `popup.js`
- `background.js` answers `EXPORT_EVENTS_JSON` and `EXPORT_EVENTS_CSV`
- `popup.js` actually creates a file download from the returned content

## Opera Submission Note

For Opera uploads, make sure that:

- the package is uploaded as an **extension**, not as a wallpaper/persona
- `manifest.json` is located directly in the ZIP root
- the ZIP does not contain an extra project folder layer

## Versioning

Current baseline version:

- **1.0.0**

Recommended scheme:

- `1.0.0`
- `1.0.1`
- `...`

## Copyright and Rights

**WA Guardian - Session Watchdog**  
Copyright (c) 2026 Thorsten Bylicki / BYLICKILABS. All rights reserved.

Project / Publisher:  
**BYLICKILABS**

GitHub:  
`https://github.com/bylickilabs`

## Contact and Links

- GitHub profile: `https://github.com/bylickilabs`
- WhatsApp Web: `https://web.whatsapp.com/`
