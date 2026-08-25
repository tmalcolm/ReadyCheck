# Walkthrough - Bluetooth Checklist Progressive Web App (PWA)

The **Bluetooth Checklist Progressive Web App (PWA)** has been built using HTML5, Vanilla CSS3, and ES6+ JavaScript. It is optimized for mobile & desktop devices, fully installable on Android, operates **100% offline**, and supports Bluetooth sharing via Web Share API and JSON file transfer.

## Accomplished Features

### 1. Automatic Startup Loading from JSON Folder
- **Dynamic Startup Fetch**: When the app starts up, it automatically loads all checklist files located in the `json/` directory.
- **Manifest Indexing**: Uses `json/index.json` to discover JSON files dynamically with a built-in fallback array for maximum reliability.
- **Pre-loaded Checklists**:
  1. Cruising Boat Checklist (`json/cruising_boat.json`)
  2. Pegasus Aft Deck Checklists (`json/pegasus_aftdeck.json`)
  3. Pegasus Fore Deck Checklists (`json/pegasus_foredeck.json`)
  4. Pegasus Helm Checklists (`json/pegasus_helm.json`)
  5. Pegasus Master List (`json/pegasus_master_list_all_stations.json`)
  6. Pegasus Port Winch Checklists (`json/pegasus_port_winch.json`)
  7. Pegasus Starboard Winch Checklists (`json/pegasus_starboard_winch.json`)

### 2. Modern Splash Screen & UI/UX
- Animated initial splash screen displaying logo, title, and loading indicator.
- Dark/Light mode toggle switch.
- Responsive ocean dark glassmorphism design system.
- Touch-friendly 44px+ touch targets for mobile accessibility.

### 3. Main Screen (Alphabetical List)
- Automatically displays all saved checklists sorted **alphabetically by title**.
- Dynamic search/filter bar.
- Each checklist card includes:
  - Title and section/item count.
  - Interactive progress bar (% completed).
  - Graphical **Bluetooth Share** icon button.
  - View, Edit, and Delete (with confirmation modal) buttons.
- "+ New Checklist" button.
- "📥 Import JSON" button to load shared checklist files.
- "📚 Presets" button to re-fetch and restore defaults from the `json/` folder.

### 4. Interactive Viewing Screen & Instant Auto-Save
- Clear view of all items grouped by Sub List with checkbox controls.
- **Instant Auto-Save**: Toggling any item between checked and unchecked instantly saves state to local storage and updates progress metrics with visual "Saved" badge feedback.
- "Reset" button to uncheck all items.

### 5. Comprehensive Editing Screen
- Edit Checklist Title and Sub List names.
- Add and delete sublists.
- Add and delete checklist items with optional item descriptions.
- **Reordering**: Move Up / Move Down buttons as well as drag-and-drop handles for mobile & desktop reordering.
- "Save All Changes" vs "Discard All Changes" buttons with confirmation safeguards.

### 6. 100% Offline Capability & Service Worker Caching
- Service Worker (`sw.js`) caches all assets including `json/index.json` and all `json/*.json` files.
- Network status badge in header (`Online` / `Offline Mode`).
- Detects `online` and `offline` network state transitions dynamically.

### 7. Bluetooth & File Sharing Integration
- Graphical Share icon on each card and on the view screen.
- Calls Web Share API (`navigator.share`) on Android with a `.json` File attachment. On Android, selecting **Bluetooth** or **Quick Share** from the native share sheet directly transmits the checklist over Bluetooth.
- Fallback file download and JSON import handler to load received `.json` files.

---

## File Map

| File Path | Description |
| :--- | :--- |
| [index.html](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/index.html) | HTML5 shell containing splash screen, main screen, view screen, edit screen, and modals. |
| [css/styles.css](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/css/styles.css) | Custom CSS design system, dark/light theme tokens, splash animation, glassmorphism cards. |
| [json/index.json](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/json/index.json) | JSON manifest index listing all checklist files in the json directory. |
| [json/cruising_boat.json](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/json/cruising_boat.json) | JSON file for the preloaded Cruising Boat Checklist. |
| [js/storage.js](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/js/storage.js) | LocalStorage controller, startup JSON folder fetching, alphabetical sorting, JSON import/export. |
| [js/bluetooth-share.js](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/js/bluetooth-share.js) | Web Share API integration for Bluetooth transmission and JSON file download fallbacks. |
| [js/app.js](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/js/app.js) | Main UI controller handling splash screen fade out, screen transitions, drag & drop, and modals. |
| [manifest.json](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/manifest.json) | Web App Manifest for Android PWA installation. |
| [sw.js](file:///c:/Users/pyjam/.gemini/antigravity-ide/scratch/checklist/sw.js) | Service Worker providing cache-first offline capability for app assets and JSON checklists. |

---

## Verification & Testing

1. Launch `start_server.ps1` (`http://localhost:8080`).
2. All 7 checklists in `json/` (`Cruising Boat Checklist`, `Pegasus Aft Deck Checklists`, `Pegasus Fore Deck Checklists`, `Pegasus Helm Checklists`, `Pegasus Master List - All Stations`, `Pegasus Port Winch Checklists`, `Pegasus Starboard Winch Checklists`) automatically populate on app startup.
3. Clicking "Restore Presets" re-fetches and restores all default checklists directly from the `json/` folder.
