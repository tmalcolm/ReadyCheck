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
   * Initialize local storage, seeding with default checklist if empty
   */
  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Seed default Cruising Boat Checklist
        const initialList = [CRUISING_BOAT_CHECKLIST];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialList));
      }
    } catch (e) {
      console.error('Failed to initialize local storage:', e);
    }
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

      if (!data.title || typeof data.title !== 'string') {
        throw new Error('Checklist requires a valid Title string');
      }

      // Ensure proper structure
      const newChecklist = {
        id: this.generateId('checklist'),
        title: data.title.trim(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sublists: Array.isArray(data.sublists) ? data.sublists.map(sub => ({
          id: sub.id || this.generateId('sub'),
          name: typeof sub.name === 'string' ? sub.name : '',
          items: Array.isArray(sub.items) ? sub.items.map(item => ({
            id: item.id || this.generateId('item'),
            name: String(item.name || 'Untitled Item'),
            description: typeof item.description === 'string' ? item.description : '',
            checked: !!item.checked
          })) : []
        })) : []
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
