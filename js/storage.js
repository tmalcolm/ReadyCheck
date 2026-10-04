/**
 * Storage Module - Local Storage Management & JSON Utilities
 */

const STORAGE_KEY = 'pwa_checklists_v1';

const Storage = {
  /**
   * Helper to generate unique IDs
   */
  generateId(prefix = 'id') {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Known list of JSON files in the json/ folder (used as fallback if index.json fetch fails)
   */
  jsonFiles: [
    'adult_in_charge_checklist.json',
    'cruising_boat.json',
    'pegasus_aftdeck.json',
    'pegasus_foredeck.json',
    'pegasus_helm.json',
    'pegasus_master_list_all_stations.json',
    'pegasus_port_winch.json',
    'pegasus_starboard_winch.json',
    'scout_in_charge_checklist.json'
  ],

  /**
   * Helper to compare version numbers (returns true if onlineVersion > localVersion)
   */
  isVersionGreater(vOnline, vLocal) {
    const parse = (v) => String(v !== undefined && v !== null ? v : '1').split('.').map(n => parseInt(n, 10) || 0);
    const onlineParts = parse(vOnline);
    const localParts = parse(vLocal);
    const maxLen = Math.max(onlineParts.length, localParts.length);
    for (let i = 0; i < maxLen; i++) {
      const o = onlineParts[i] || 0;
      const l = localParts[i] || 0;
      if (o > l) return true;
      if (o < l) return false;
    }
    return false;
  },

  /**
   * Check each locally stored default checklist against online checklist version (when online)
   */
  async checkOnlineDefaultChecklistVersions() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return [];
    }

    const updates = [];
    try {
      let fileList = [...this.jsonFiles];
      try {
        const indexRes = await fetch(`json/index.json?t=${Date.now()}`, { cache: 'no-store' });
        if (indexRes.ok) {
          const files = await indexRes.json();
          if (Array.isArray(files) && files.length > 0) {
            files.forEach(f => {
              if (!fileList.includes(f)) fileList.push(f);
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch json/index.json for version check:', err);
      }

      const localLists = this.getAllChecklists();

      for (const filename of fileList) {
        try {
          const path = filename.startsWith('json/') ? filename : `json/${filename}`;
          const res = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const onlineData = await res.json();
            if (onlineData && (onlineData.title || onlineData.Title)) {
              onlineData.title = onlineData.title || onlineData.Title;
              onlineData.sublists = onlineData.sublists || onlineData.Sublists || [];
              onlineData.versionNumber = onlineData.versionNumber || onlineData.VersionNumber || 1;

              const localMatch = localLists.find(l =>
                (onlineData.id && l.id === onlineData.id) ||
                (l.title && onlineData.title && l.title.toLowerCase() === onlineData.title.toLowerCase())
              );

              if (localMatch) {
                const localVersion = localMatch.versionNumber || localMatch.VersionNumber || 1;
                if (this.isVersionGreater(onlineData.versionNumber, localVersion)) {
                  updates.push({
                    filename,
                    localChecklist: localMatch,
                    onlineChecklist: onlineData,
                    localVersion,
                    onlineVersion: onlineData.versionNumber
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn(`Failed checking online checklist version for ${filename}:`, e);
        }
      }
    } catch (e) {
      console.error('Error checking online default checklist versions:', e);
    }

    return updates;
  },

  /**
   * Replace a local checklist with new downloaded online version
   */
  replaceLocalChecklist(onlineChecklist) {
    try {
      const lists = this.getAllChecklists();
      const existingIndex = lists.findIndex(l =>
        (onlineChecklist.id && l.id === onlineChecklist.id) ||
        (l.title && onlineChecklist.title && l.title.toLowerCase() === onlineChecklist.title.toLowerCase())
      );

      const updatedChecklist = {
        ...onlineChecklist,
        versionNumber: onlineChecklist.versionNumber || 1,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        lists[existingIndex] = updatedChecklist;
      } else {
        lists.push(updatedChecklist);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
      return updatedChecklist;
    } catch (e) {
      console.error('Error replacing local checklist:', e);
      throw e;
    }
  },

  /**
   * Initialize local storage, seeding with preloaded default checklists if missing
   */
  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let lists = raw ? JSON.parse(raw) : [];

      const defaults = (typeof PRELOADED_CHECKLISTS !== 'undefined' && Array.isArray(PRELOADED_CHECKLISTS))
        ? PRELOADED_CHECKLISTS
        : (typeof CRUISING_BOAT_CHECKLIST !== 'undefined' ? [CRUISING_BOAT_CHECKLIST] : []);

      let updated = false;
      defaults.forEach(defaultList => {
        const exists = lists.some(l => l.id === defaultList.id || l.title.toLowerCase() === defaultList.title.toLowerCase());
        if (!exists) {
          lists.push({ ...defaultList, versionNumber: defaultList.versionNumber || 1 });
          updated = true;
        }
      });

      // Ensure every stored list has a default versionNumber if missing
      lists.forEach(l => {
        if (l.versionNumber === undefined || l.versionNumber === null) {
          l.versionNumber = 1;
          updated = true;
        }
      });

      if (!raw || updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
      }
    } catch (e) {
      console.error('Failed to initialize local storage:', e);
    }
  },

  /**
   * Load all checklists from the json folder when app starts
   */
  async loadJsonFolderChecklists() {
    try {
      let fileList = [...this.jsonFiles];
      try {
        const indexRes = await fetch('json/index.json');
        if (indexRes.ok) {
          const files = await indexRes.json();
          if (Array.isArray(files) && files.length > 0) {
            files.forEach(f => {
              if (!fileList.includes(f)) fileList.push(f);
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch json/index.json, using default file list fallback:', err);
      }

      const fetchedLists = [];
      for (const filename of fileList) {
        try {
          const path = filename.startsWith('json/') ? filename : `json/${filename}`;
          const res = await fetch(path);
          if (res.ok) {
            const data = await res.json();
            if (data && (data.title || data.Title) && (Array.isArray(data.sublists) || Array.isArray(data.Sublists))) {
              data.title = data.title || data.Title;
              data.sublists = data.sublists || data.Sublists || [];
              data.versionNumber = data.versionNumber || data.VersionNumber || 1;
              fetchedLists.push(data);
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch checklist JSON: ${filename}`, e);
        }
      }

      // Fallback to JS variable defaults if fetch returns empty (e.g. file:// protocol without server)
      if (fetchedLists.length === 0) {
        if (typeof PRELOADED_CHECKLISTS !== 'undefined' && Array.isArray(PRELOADED_CHECKLISTS)) {
          fetchedLists.push(...PRELOADED_CHECKLISTS);
        } else if (typeof CRUISING_BOAT_CHECKLIST !== 'undefined') {
          fetchedLists.push(CRUISING_BOAT_CHECKLIST);
        }
      }

      // Seed local storage with fetched checklists if missing
      const raw = localStorage.getItem(STORAGE_KEY);
      let lists = raw ? JSON.parse(raw) : [];
      let updated = false;

      fetchedLists.forEach(checklist => {
        const exists = lists.some(l => l.id === checklist.id || l.title.toLowerCase() === checklist.title.toLowerCase());
        if (!exists) {
          lists.push({ ...checklist, versionNumber: checklist.versionNumber || 1 });
          updated = true;
        }
      });

      lists.forEach(l => {
        if (l.versionNumber === undefined || l.versionNumber === null) {
          l.versionNumber = 1;
          updated = true;
        }
      });

      if (!raw || updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
      }

      return lists;
    } catch (e) {
      console.error('Error loading checklists from json folder:', e);
      this.init(); // Fallback to basic init
      return this.getAllChecklists();
    }
  },

  /**
   * Re-seed or restore all preloaded default checklists from the json folder
   */
  async resetDefaults() {
    let fetchedLists = [];
    try {
      let fileList = this.jsonFiles;
      try {
        const indexRes = await fetch('json/index.json');
        if (indexRes.ok) {
          const files = await indexRes.json();
          if (Array.isArray(files) && files.length > 0) fileList = files;
        }
      } catch (err) {
        console.warn('Could not fetch json/index.json for resetDefaults:', err);
      }

      for (const filename of fileList) {
        try {
          const path = filename.startsWith('json/') ? filename : `json/${filename}`;
          const res = await fetch(path);
          if (res.ok) {
            const data = await res.json();
            if (data && data.title && Array.isArray(data.sublists)) {
              data.versionNumber = data.versionNumber || data.VersionNumber || 1;
              fetchedLists.push(data);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    if (fetchedLists.length === 0) {
      fetchedLists = (typeof PRELOADED_CHECKLISTS !== 'undefined' && Array.isArray(PRELOADED_CHECKLISTS))
        ? PRELOADED_CHECKLISTS
        : (typeof CRUISING_BOAT_CHECKLIST !== 'undefined' ? [CRUISING_BOAT_CHECKLIST] : []);
    }

    let lists = this.getAllChecklists();
    fetchedLists.forEach(defaultList => {
      const index = lists.findIndex(l => l.id === defaultList.id || l.title.toLowerCase() === defaultList.title.toLowerCase());
      if (index >= 0) {
        lists[index] = JSON.parse(JSON.stringify(defaultList));
      } else {
        lists.push(JSON.parse(JSON.stringify(defaultList)));
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    return lists;
  },

  /**
   * Retrieve all checklists, sorted alphabetically by Title
   */
  getAllChecklists() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const lists = raw ? JSON.parse(raw) : [];
      // Alphabetical sorting by title (case-insensitive)
      return lists.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    } catch (e) {
      console.error('Error fetching checklists from storage:', e);
      return [];
    }
  },

  /**
   * Get a single checklist by ID
   */
  getChecklistById(id) {
    const lists = this.getAllChecklists();
    return lists.find(list => list.id === id) || null;
  },

  /**
   * Save or update a checklist
   */
  saveChecklist(checklist) {
    try {
      const lists = this.getAllChecklists();
      const existingIndex = lists.findIndex(l => l.id === checklist.id);
      
      const updatedChecklist = {
        ...checklist,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        lists[existingIndex] = updatedChecklist;
      } else {
        lists.push(updatedChecklist);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
      return updatedChecklist;
    } catch (e) {
      console.error('Error saving checklist:', e);
      throw e;
    }
  },

  /**
   * Delete a checklist by ID
   */
  deleteChecklist(id) {
    try {
      const lists = this.getAllChecklists();
      const filtered = lists.filter(l => l.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Error deleting checklist:', e);
      return false;
    }
  },

  /**
   * Duplicate / Copy an existing checklist
   */
  copyChecklist(id) {
    const original = this.getChecklistById(id);
    if (!original) return null;

    // Create deep clone
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = this.generateId('checklist');
    clone.title = `${original.title} (Copy)`;
    clone.createdAt = new Date().toISOString();
    clone.updatedAt = new Date().toISOString();

    // Regenerate unique IDs for sublists & items, and reset checked states
    clone.sublists = clone.sublists.map(sub => ({
      ...sub,
      id: this.generateId('sub'),
      items: sub.items.map(item => ({
        ...item,
        id: this.generateId('item'),
        checked: false
      }))
    }));

    return this.saveChecklist(clone);
  },

  /**
   * Auto-save item checked state change immediately
   */
  updateItemCheckedState(checklistId, itemId, checked) {
    const list = this.getChecklistById(checklistId);
    if (!list) return null;

    let found = false;
    for (const sub of list.sublists) {
      for (const item of sub.items) {
        if (item.id === itemId) {
          item.checked = !!checked;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      return this.saveChecklist(list);
    }
    return null;
  },

  /**
   * Serialize checklist to a clean, formatted JSON string
   */
  exportToJSON(checklist) {
    // Return clean JSON without runtime noise
    return JSON.stringify(checklist, null, 2);
  },

  /**
   * Validate and import JSON payload into local storage
   */
  importFromJSON(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

      // Validate required schema
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format');
      }

      const title = data.title || data.Title;
      if (!title || typeof title !== 'string') {
        throw new Error('Checklist requires a valid Title string');
      }

      const sublists = data.sublists || data.Sublists || [];

      // Ensure proper structure
      const newChecklist = {
        id: this.generateId('checklist'),
        title: title.trim(),
        createdAt: data.createdAt || data.CreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sublists: Array.isArray(sublists) ? sublists.map(sub => {
          const subName = sub.name || sub.Name || sub.title || sub.Title || '';
          const items = sub.items || sub.Items || [];
          return {
            id: sub.id || sub.Id || this.generateId('sub'),
            name: typeof subName === 'string' ? subName : '',
            items: Array.isArray(items) ? items.map(item => {
              const itemName = item.name || item.Name || item.nAme || item.namE || 'Untitled Item';
              const itemDesc = item.description || item.Description || '';
              const itemId = item.id || item.Id || this.generateId('item');
              return {
                id: itemId,
                name: String(itemName),
                description: typeof itemDesc === 'string' ? itemDesc : '',
                checked: !!item.checked
              };
            }) : []
          };
        }) : []
      };

      return this.saveChecklist(newChecklist);
    } catch (err) {
      console.error('Import validation failed:', err);
      throw new Error(`Failed to import checklist: ${err.message}`);
    }
  }
};

// Initialize Storage on file load
Storage.init();
