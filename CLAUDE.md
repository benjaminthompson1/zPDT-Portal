# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zADE Portal** is a static single-page web application (SPA) serving as a centralized access portal for IBM z/OS mainframe resources in a personal homelab ("Ben's Big Iron Lab", ADCD z32a / z/OS 3.2). It is deployed as a WAR file on IBM Liberty running on z/OS.

Tech stack: pure HTML5, CSS3, and vanilla JavaScript (ES2017). No build framework, no npm, no bundler — the SPA has zero runtime dependencies beyond CDN-hosted IBM Plex fonts and Font Awesome icons.

## Packaging & Deployment

There is no compile/transpile step — packaging just zips the static files into a WAR.

```powershell
# Preferred — build.ps1 verifies required files exist, builds zADE-Portal.war,
# writes a timestamped backup (zADE-Portal-yyyyMMdd-HHmmss.war), and prints FTP steps.
.\build.ps1
```

```powershell
# Manual equivalent (Windows) from repo root
Compress-Archive -Path index.html, assets\*, WEB-INF\* -DestinationPath zADE-Portal.war -Force
```

```bash
# Manual equivalent (Unix)
zip -r zADE-Portal.war index.html assets/ WEB-INF/
```

Deployment: transfer `zADE-Portal.war` to the Liberty server's `dropins/` directory (`/global/wlpCfg/servers/wlps01a/dropins`) **in binary mode** (FTP binary). Liberty auto-deploys. The app is served at `https://zade.mainframehome.net/zADE-Portal/`.

`WEB-INF/web.xml` is a minimal Jakarta EE 5.0 servlet descriptor — Liberty needs it to recognize the WAR as a web application.

## Architecture

All application code lives in three files:

- [index.html](index.html) — full SPA markup; 5 content sections (System Management, Documentation & Reference, Tools, APIs, Repositories) plus fixed shell header, two modals (Help, Lab Info), and a footer
- [assets/css/main.css](assets/css/main.css) — all styles; built on IBM Carbon Design tokens defined as CSS custom properties at `:root`; no external CSS framework
- [assets/js/main.js](assets/js/main.js) — all interactivity

`main.js` is a single IIFE (`'use strict'`, no globals). The `SERVICE_LIST` array (8 endpoints) drives all status polling — add/remove a monitored service by editing that array *and* adding a matching `status-dot` element with the same `id` in `index.html`.

- **Service status polling** — `checkService()` probes each endpoint HEAD-first with a GET fallback (some servers reject HEAD), 8 s timeout via `AbortController`, `no-cors` mode. `checkAllServices()` runs them **sequentially** (not parallel) to avoid hammering the network, updating a "Checking N/8…" progress label. Manual re-poll via the Refresh button or **Alt+R**.
- **Status caching** — results are persisted to `localStorage` for 5 minutes (`loadCachedStatus`/`saveCachedStatus`). On load, cached dots render instantly and a background re-check fires after 2 s; with no valid cache it polls immediately.
- **Scroll handling** — a single `scroll` listener throttled with `requestAnimationFrame` does both scroll-spy (sets `aria-current` on the active nav link via section `offsetTop`) and back-to-top visibility (after 400 px). Note: this is a manual listener, **not** `IntersectionObserver`.
- **Hamburger menu** — responsive nav collapse/expand (breakpoint: 768 px); auto-closes on nav-link click and on outside click
- **Copy-to-clipboard** — copies API endpoint URLs (`data-copy` attribute) with icon swap animation; toast on failure
- **Modal management** — shared `initModal()` wires Help and Lab Info dialogs; toggles the `hidden` attribute + `visible` class for CSS transitions; Escape key and backdrop-click dismiss
- **Keyboard shortcuts** — Alt+H (Help), Alt+I (Lab Info), Alt+R (Refresh), Escape (close dialog)
- **Toast notifications** — `showNotification()`; also surfaced by global `error`/`unhandledrejection` handlers, which suppress noise from the status fetches

### CSS conventions

- Design tokens: 12 IBM Carbon colour ramps + spacing scale (`--spacing-02` … `--spacing-09`) defined in `:root`
- Component naming follows IBM Carbon conventions (e.g. `.cds--header`, `.bx--tile`)
- Responsive breakpoint: hamburger menu at `max-width: 768px`
- No inline styles in HTML; all overrides go in `main.css`

## Key Constraints

- **No inline scripts or styles** — keeps the page CSP-friendly
- **Air-gap compatibility** — Font Awesome and IBM Plex fonts can be swapped to self-hosted copies if the z/OS environment has no internet access (CDN URLs are in `index.html` `<head>`)
- **Binary FTP transfer** — WAR must be transferred in binary mode; ASCII mode corrupts the ZIP structure Liberty depends on

## Companion docs

- [SECURITY.md](SECURITY.md) — Liberty CSP/security-header config, SRI hash regeneration, optional auth, air-gap self-hosting. Consult before changing CDN `<link>` tags or the security posture.
- [README.md](README.md) — full deploy walkthrough (FTP/SFTP/scp), IBM Carbon token reference table, post-deploy verification checklist.
- [AGENTS.md](AGENTS.md) — condensed agent-facing notes; keep it in sync with this file when constraints change.
