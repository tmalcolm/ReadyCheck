# Bluetooth Checklist Progressive Web App (PWA)

A fully responsive, offline-first Progressive Web App (PWA) built with HTML5, Vanilla CSS3, and ES6+ JavaScript. Designed for mobile and desktop devices, pre-loaded with a comprehensive **Cruising Boat Checklist**, supporting instant auto-save to LocalStorage and Bluetooth file sharing via the Web Share API.

## Features

- **Pre-loaded Cruising Boat Dataset**: Includes 7 sublists (Engine & Mechanical, Rigging & Deck, Hull & Bilge, Electronics & Navigation, Safety Gear, Weather Planning, Final Departure).
- **Ocean Glassmorphism UI**: Modern responsive design with light/dark theme toggle, micro-animations, and 44px+ touch targets.
- **Alphabetical Sorting & Search**: Automatically sorts checklists by title with live search filtering.
- **Interactive Viewing & Auto-Save**: Dynamic progress bars, instant LocalStorage persistence, and visual save state badges.
- **Comprehensive Editing**: Add, edit, delete sublists and items with drag-and-drop reordering.
- **100% Offline PWA Capability**: Powered by Service Worker (`sw.js`) and Web Manifest (`manifest.json`).
- **Bluetooth & File Sharing**: Uses `navigator.share` on Android/mobile for direct Bluetooth/Quick Share `.json` file transmission, plus manual JSON import/export.

## Quick Start / Running Locally

### Option 1: PowerShell Local Server (Recommended)
Run the bundled PowerShell script:
```powershell
.\start_server.ps1
```
Then open `http://localhost:8080` in your browser.

### Option 2: npm script
```bash
npm start
```
or
```bash
npm run serve
```

## Directory Structure

```
checklist/
├── css/
│   └── styles.css
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon.svg
├── js/
│   ├── app.js
│   ├── bluetooth-share.js
│   ├── cruising-boat-data.js
│   └── storage.js
├── CHAT_HISTORY.md
├── walkthrough.md
├── generate_icons.ps1
├── index.html
├── manifest.json
├── package.json
├── README.md
├── start_server.ps1
└── sw.js
```

## Chat & Development History

See [walkthrough.md](file:///C:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/walkthrough.md) or [CHAT_HISTORY.md](file:///C:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/CHAT_HISTORY.md) for full implementation details.
