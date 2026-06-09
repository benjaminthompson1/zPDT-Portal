# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build & Deployment

**WAR packaging (PowerShell):**
```powershell
Compress-Archive -Path index.html, assets\*, WEB-INF\* -DestinationPath zADE-Portal.war -Force
```

**WAR packaging (Unix):**
```bash
zip -r zADE-Portal.war index.html assets/ WEB-INF/
```

**Critical:** Transfer WAR to Liberty in **binary mode** (FTP/SFTP). ASCII mode corrupts the ZIP structure and Liberty will fail to deploy.

## Architecture Constraints

- **Zero build tools** — no npm, no bundler, no transpilation. Pure HTML5/CSS3/ES2017.
- **Zero runtime dependencies** — only CDN-hosted fonts (IBM Plex, Font Awesome). Can be swapped to self-hosted for air-gapped environments.
- **No inline scripts/styles** — all JS in `assets/js/main.js`, all CSS in `assets/css/main.css`. Enables strict CSP (`script-src 'self'`).
- **Single-file architecture** — entire app is 3 files: `index.html`, `assets/css/main.css`, `assets/js/main.js`.

## Non-Obvious Patterns

- **Service status polling** uses `mode: 'no-cors'` with HEAD fallback to GET (some servers reject HEAD). 8s timeout per service.
- **Status checks are sequential** (not parallel) to avoid network hammering — see `checkAllServices()` in `main.js`.
- **IBM Carbon tokens** defined as CSS custom properties in `:root` — no Carbon framework, just token values.
- **WEB-INF/web.xml** uses Jakarta EE 5.0 namespace (`https://jakarta.ee/xml/ns/jakartaee`) — Liberty requires this for WAR recognition.
- **Modal animations** use `hidden` attribute + `visible` class with CSS transitions — `hidden` prevents tab focus, `visible` triggers slide-in.

## Code Style

- **JavaScript:** ES2017 syntax, IIFE-wrapped, no globals, `async/await` for async operations
- **CSS:** IBM Carbon naming conventions (`.cds--header`, `.bx--tile`), custom properties for all colors/spacing
- **HTML:** Semantic HTML5, ARIA labels throughout, no inline styles/scripts
- **Responsive breakpoint:** 768px (hamburger menu)

## Existing Rules

The CLAUDE.md file contains comprehensive project documentation and should be consulted for deployment details, architecture overview, and environment-specific information.