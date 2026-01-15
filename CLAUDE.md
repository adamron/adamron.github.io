# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal tools PWA hosted at adamron.github.io. Pure HTML/CSS/JS with no build process, no dependencies, and no frameworks.

## Development

**Local server:** `python3 -m http.server 8000`

No npm, no build step, no tests, no linting. Edit files directly and refresh browser.

**Node version:** 22 (see .nvmrc)

## Architecture

### Tool Structure
Each tool is a self-contained HTML file at `tools/[tool-name]/index.html` with embedded CSS and JS. The main `index.html` is a landing page with tile navigation to each tool.

### PWA Configuration
- **manifest.json** - App metadata, icons, display settings
- **sw.js** - Service Worker with cache-first strategy (bump `CACHE_NAME` version when updating cached assets)
- Apple-specific meta tags in HTML for iOS homescreen installation

### Design System
- Dark theme: background `#1a1a2e`, text `#eee`
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...`
- Responsive grid layouts with CSS Grid
- Mobile-first with media queries at 480px breakpoint

## Adding a New Tool

1. Create `tools/[tool-name]/index.html` as a self-contained page
2. Add a tile link in the main `index.html` nav section
3. Add the new path to the `urlsToCache` array in `sw.js`
4. Bump the cache version in `sw.js`
