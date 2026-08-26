/**
 * Main Application Controller (PWA Checklist App)
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let currentChecklist = null; // Currently viewing or editing checklist
  let editDraft = null;       // Draft state while editing
  let activeScreen = 'main';  // 'main', 'view', 'edit'

  // DOM Element Cache
  const splashScreen = document.getElementById('splash-screen');
  const mainScreen = document.getElementById('screen-main');
  const viewScreen = document.getElementById('screen-view');
  const editScreen = document.getElementById('screen-edit');

  const searchInput = document.getElementById('search-input');
  const checklistListContainer = document.getElementById('checklist-list');
  const btnNewChecklist = document.getElementById('btn-new-checklist');
  const btnImportChecklist = document.getElementById('btn-import-checklist');
  const btnRestorePresets = document.getElementById('btn-restore-presets');
  const fileImportInput = document.getElementById('file-import-input');

  // View Screen Elements
  const viewTitle = document.getElementById('view-title');
  const viewProgressFill = document.getElementById('view-progress-fill');
  const viewProgressText = document.getElementById('view-progress-text');
  const viewSublistsContainer = document.getElementById('view-sublists-container');
  const btnBackMain = document.getElementById('btn-back-main');
  const btnViewEdit = document.getElementById('btn-view-edit');
  const btnViewCopy = document.getElementById('btn-view-copy');
  const btnViewShare = document.getElementById('btn-view-share');
  const btnViewReset = document.getElementById('btn-view-reset');
  const autoSaveBadge = document.getElementById('auto-save-badge');

  // Edit Screen Elements
  const editTitleInput = document.getElementById('edit-title-input');
  const editSublistsContainer = document.getElementById('edit-sublists-container');
  const btnAddSublist = document.getElementById('btn-add-sublist');
  const btnSaveEdit = document.getElementById('btn-save-edit');
  const btnDiscardEdit = document.getElementById('btn-discard-edit');

  // Modal Elements
  const modalConfirm = document.getElementById('modal-confirm');
  const modalConfirmTitle = document.getElementById('modal-confirm-title');
  const modalConfirmMsg = document.getElementById('modal-confirm-msg');
  const btnModalConfirmCancel = document.getElementById('btn-modal-confirm-cancel');
  const btnModalConfirmAction = document.getElementById('btn-modal-confirm-action');
  let modalConfirmCallback = null;

  // Theme Toggle & Network Status
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const networkStatusDot = document.getElementById('network-status-dot');
  const networkStatusText = document.getElementById('network-status-text');

  function updateNetworkStatus() {
    if (!networkStatusDot || !networkStatusText) return;
    if (navigator.onLine) {
      networkStatusDot.style.backgroundColor = 'var(--accent-emerald)';
      networkStatusText.textContent = 'Online';
    } else {
      networkStatusDot.style.backgroundColor = 'var(--accent-amber)';
      networkStatusText.textContent = 'Offline Mode';
    }
  }

  /* ==========================================================================
     Initialization & Splash Screen
     ========================================================================== */
  async function initApp() {
    // Register Service Worker for PWA offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[ServiceWorker] Registered successfully:', reg.scope);
      }).catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    }

    updateNetworkStatus();

    // Load all checklists from the json folder when app starts
    await Storage.loadJsonFolderChecklists();

    // Hide Splash Screen after brief load delay
    setTimeout(() => {
      splashScreen.classList.add('hidden');
      renderMainScreen();
    }, 900);

    bindEvents();
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  function bindEvents() {
    // Online / Offline Status Listeners
    window.addEventListener('online', () => {
      updateNetworkStatus();
      showToast('Back online', 'success');
    });

    window.addEventListener('offline', () => {
      updateNetworkStatus();
      showToast('App is operating in 100% Offline Mode', 'info');
    });

    // Theme Toggle
    btnThemeToggle.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', newTheme);
      showToast(`Switched to ${newTheme} mode`, 'info');
    });

    // Main Screen Search
    searchInput.addEventListener('input', () => renderMainScreen());

    // Main Screen Buttons
    btnNewChecklist.addEventListener('click', createNewChecklist);
    btnImportChecklist.addEventListener('click', () => fileImportInput.click());
    if (btnRestorePresets) {
      btnRestorePresets.addEventListener('click', () => {
        showModalConfirm(
          'Restore Defaults',
          'Restore all default preloaded checklists from the JSON folder? Any custom changes to default checklists will be reset.',
          async () => {
            await Storage.resetDefaults();
            showToast('Preloaded checklists restored!', 'success');
            renderMainScreen();
          }
        );
      });
    }
    fileImportInput.addEventListener('change', handleFileImport);

    // View Screen Buttons
    btnBackMain.addEventListener('click', () => navigateTo('main'));
    btnViewEdit.addEventListener('click', () => {
      if (currentChecklist) startEditingChecklist(currentChecklist);
    });
    btnViewCopy.addEventListener('click', () => {
      if (currentChecklist) {
        const copied = Storage.copyChecklist(currentChecklist.id);
        if (copied) {
          showToast(`Created copy "${copied.title}"`, 'success');
          openChecklist(copied.id);
        }
      }
    });
    btnViewShare.addEventListener('click', () => {
      if (currentChecklist) BluetoothShare.shareChecklist(currentChecklist, showToast);
    });
    btnViewReset.addEventListener('click', resetViewChecklistItems);

    // Edit Screen Buttons
    btnAddSublist.addEventListener('click', addSublistToEditDraft);
    btnSaveEdit.addEventListener('click', saveEditChanges);
    btnDiscardEdit.addEventListener('click', promptDiscardEditChanges);

    // Confirmation Modal Buttons
    btnModalConfirmCancel.addEventListener('click', closeModal);
    btnModalConfirmAction.addEventListener('click', () => {
      if (modalConfirmCallback) modalConfirmCallback();
      closeModal();
    });
  }

  /* ==========================================================================
     Navigation & Routing
     ========================================================================== */
  function navigateTo(screenName) {
    activeScreen = screenName;
    mainScreen.classList.remove('active');
    viewScreen.classList.remove('active');
    editScreen.classList.remove('active');

    if (screenName === 'main') {
      mainScreen.classList.add('active');
      currentChecklist = null;
      editDraft = null;
      renderMainScreen();
    } else if (screenName === 'view') {
      viewScreen.classList.add('active');
      renderViewScreen();
    } else if (screenName === 'edit') {
      editScreen.classList.add('active');
      renderEditScreen();
    }
  }

  /* ==========================================================================
     Main Screen Logic
     ========================================================================== */
  function renderMainScreen() {
    const filterText = searchInput.value.toLowerCase().trim();
    const checklists = Storage.getAllChecklists();
    
    const filtered = checklists.filter(list => 
      list.title.toLowerCase().includes(filterText)
    );

    checklistListContainer.innerHTML = '';

    if (filtered.length === 0) {
      checklistListContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3>No Checklists Found</h3>
          <p>${filterText ? 'No checklists match your search.' : 'Create your first checklist to get started!'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(list => {
      const stats = calculateChecklistStats(list);
      const card = document.createElement('div');
      card.className = 'checklist-card';

      card.innerHTML = `
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHTML(list.title)}</h3>
            <div class="card-meta">
              <span>${list.sublists.length} section${list.sublists.length === 1 ? '' : 's'}</span>
              <span>•</span>
              <span>${stats.total} total item${stats.total === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div class="card-actions">
            <!-- Graphical Share Icon Button for Bluetooth / System Share -->
            <button class="btn-icon btn-share" title="Share via Bluetooth" data-action="share" data-id="${list.id}">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
              </svg>
            </button>
            <!-- Copy Icon -->
            <button class="btn-icon" title="Copy Checklist" data-action="copy" data-id="${list.id}">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
              </svg>
            </button>
            <!-- Edit Icon -->
            <button class="btn-icon" title="Edit Checklist" data-action="edit" data-id="${list.id}">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <!-- Delete Icon -->
            <button class="btn-icon btn-danger" title="Delete Checklist" data-action="delete" data-id="${list.id}">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${stats.percent}%;"></div>
        </div>

        <div class="card-footer">
          <span class="progress-text">${stats.checked} / ${stats.total} completed (${stats.percent}%)</span>
          <button class="btn btn-primary btn-open" data-action="open" data-id="${list.id}">View Checklist</button>
        </div>
      `;

      // Event delegation for card actions
      card.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'open') {
          openChecklist(id);
        } else if (action === 'copy') {
          const copied = Storage.copyChecklist(id);
          if (copied) {
            showToast(`Created copy "${copied.title}"`, 'success');
            renderMainScreen();
          }
        } else if (action === 'share') {
          const l = Storage.getChecklistById(id);
          if (l) BluetoothShare.shareChecklist(l, showToast);
        } else if (action === 'edit') {
          const l = Storage.getChecklistById(id);
          if (l) startEditingChecklist(l);
        } else if (action === 'delete') {
          confirmDeleteChecklist(id);
        }
      });

      checklistListContainer.appendChild(card);
    });
  }

  function createNewChecklist() {
    const newChecklist = {
      id: Storage.generateId('checklist'),
      title: 'Untitled Checklist',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sublists: [
        {
          id: Storage.generateId('sub'),
          name: 'General Items',
          items: [
            {
              id: Storage.generateId('item'),
              name: 'Sample Checklist Item',
              description: 'Optional item description goes here.',
              checked: false
            }
          ]
        }
      ]
    };

    startEditingChecklist(newChecklist, true);
  }

  function confirmDeleteChecklist(id) {
    const list = Storage.getChecklistById(id);
    if (!list) return;

    showModalConfirm(
      'Delete Checklist',
      `Are you sure you want to delete "${list.title}"? This action cannot be undone.`,
      () => {
        Storage.deleteChecklist(id);
        showToast(`Deleted "${list.title}"`, 'info');
        renderMainScreen();
      }
    );
  }

  /* ==========================================================================
     Viewing Screen Logic (Auto-Save on Checkbox Toggle)
     ========================================================================== */
  function openChecklist(id) {
    currentChecklist = Storage.getChecklistById(id);
    if (!currentChecklist) return;
    navigateTo('view');
  }

  function renderViewScreen() {
    if (!currentChecklist) return;

    viewTitle.textContent = currentChecklist.title;
    const stats = calculateChecklistStats(currentChecklist);
    viewProgressFill.style.width = `${stats.percent}%`;
    viewProgressText.textContent = `${stats.checked} of ${stats.total} completed (${stats.percent}%)`;

    viewSublistsContainer.innerHTML = '';

    currentChecklist.sublists.forEach(sub => {
      const subCard = document.createElement('div');
      subCard.className = 'sublist-card';

      const subHeader = document.createElement('div');
      subHeader.className = 'sublist-header';
      subHeader.innerHTML = `
        <span>${escapeHTML(sub.name || 'Items')}</span>
        <span class="sublist-count">${sub.items.filter(i => i.checked).length}/${sub.items.length}</span>
      `;
      subCard.appendChild(subHeader);

      const itemsGroup = document.createElement('div');
      itemsGroup.className = 'checklist-items-group';

      sub.items.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = `checklist-item-row ${item.checked ? 'checked' : ''}`;

        itemRow.innerHTML = `
          <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''} aria-label="${escapeHTML(item.name)}">
          <div class="item-details">
            <span class="item-name">${escapeHTML(item.name)}</span>
            ${item.description ? `<span class="item-description">${escapeHTML(item.description)}</span>` : ''}
          </div>
        `;

        const checkbox = itemRow.querySelector('.item-checkbox');

        // Toggle handler with Auto-Save Requirement
        const handleToggle = (e) => {
          if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
          }
          item.checked = checkbox.checked;
          itemRow.classList.toggle('checked', item.checked);

          // Auto-save item state instantly in LocalStorage
          Storage.updateItemCheckedState(currentChecklist.id, item.id, item.checked);

          // Trigger Auto-Save Feedback Notification
          triggerAutoSaveFeedback();

          // Refresh progress stats
          const newStats = calculateChecklistStats(currentChecklist);
          viewProgressFill.style.width = `${newStats.percent}%`;
          viewProgressText.textContent = `${newStats.checked} of ${newStats.total} completed (${newStats.percent}%)`;
          subHeader.querySelector('.sublist-count').textContent = `${sub.items.filter(i => i.checked).length}/${sub.items.length}`;
        };

        itemRow.addEventListener('click', handleToggle);

        itemsGroup.appendChild(itemRow);
      });

      subCard.appendChild(itemsGroup);
      viewSublistsContainer.appendChild(subCard);
    });
  }

  function triggerAutoSaveFeedback() {
    autoSaveBadge.style.opacity = '1';
    setTimeout(() => {
      autoSaveBadge.style.opacity = '0.6';
    }, 1000);
  }

  function resetViewChecklistItems() {
    if (!currentChecklist) return;

    showModalConfirm(
      'Reset All Items',
      'Uncheck all completed items in this checklist?',
      () => {
        currentChecklist.sublists.forEach(sub => {
          sub.items.forEach(item => item.checked = false);
        });
        Storage.saveChecklist(currentChecklist);
        showToast('Checklist progress reset', 'info');
        renderViewScreen();
      }
    );
  }

  /* ==========================================================================
     Edit Screen Logic (Add, Edit, Delete, Reorder, Save, Discard)
     ========================================================================== */
  function startEditingChecklist(checklist, isNew = false) {
    // Clone deep draft copy so Discard restores original state
    editDraft = JSON.parse(JSON.stringify(checklist));
    editDraft._isNew = isNew;
    navigateTo('edit');
  }

  function renderEditScreen() {
    if (!editDraft) return;

    editTitleInput.value = editDraft.title;

    // Handle Title input change
    editTitleInput.oninput = (e) => {
      editDraft.title = e.target.value;
    };

    editSublistsContainer.innerHTML = '';

    editDraft.sublists.forEach((sub, subIdx) => {
      const subCard = document.createElement('div');
      subCard.className = 'edit-sublist-card';

      subCard.innerHTML = `
        <div class="edit-sublist-header">
          <input type="text" class="edit-sublist-input" value="${escapeHTML(sub.name)}" placeholder="Sub List Name (optional)">
          <button class="btn-icon btn-danger" title="Delete Sub List" data-action="delete-sub" data-sub-idx="${subIdx}">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>

        <div class="edit-items-list" data-sub-idx="${subIdx}"></div>

        <button class="btn btn-secondary btn-add-item" style="align-self: flex-start; margin-top: 0.5rem;" data-action="add-item" data-sub-idx="${subIdx}">
          + Add Item
        </button>
      `;

      // Sublist Name Change
      const subInput = subCard.querySelector('.edit-sublist-input');
      subInput.oninput = (e) => {
        sub.name = e.target.value;
      };

      // Items Container
      const itemsList = subCard.querySelector('.edit-items-list');

      sub.items.forEach((item, itemIdx) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'edit-item-row';
        itemRow.draggable = true;

        itemRow.innerHTML = `
          <div class="drag-handle" title="Drag to reorder">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
            </svg>
          </div>

          <div class="edit-item-fields">
            <input type="text" class="edit-item-name-input" value="${escapeHTML(item.name)}" placeholder="Item Name">
            <input type="text" class="edit-item-desc-input" value="${escapeHTML(item.description || '')}" placeholder="Item Description (optional)">
          </div>

          <div class="reorder-btns">
            <button class="btn btn-secondary btn-icon-sm" title="Move Up" data-action="move-up" data-sub-idx="${subIdx}" data-item-idx="${itemIdx}" ${itemIdx === 0 ? 'disabled' : ''}>▲</button>
            <button class="btn btn-secondary btn-icon-sm" title="Move Down" data-action="move-down" data-sub-idx="${subIdx}" data-item-idx="${itemIdx}" ${itemIdx === sub.items.length - 1 ? 'disabled' : ''}>▼</button>
          </div>

          <button class="btn-icon btn-danger" title="Delete Item" data-action="delete-item" data-sub-idx="${subIdx}" data-item-idx="${itemIdx}">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        `;

        // Item Inputs Listeners
        const nameInput = itemRow.querySelector('.edit-item-name-input');
        const descInput = itemRow.querySelector('.edit-item-desc-input');

        nameInput.oninput = (e) => { item.name = e.target.value; };
        descInput.oninput = (e) => { item.description = e.target.value; };

        // HTML5 Drag and Drop Handlers for item reordering
        itemRow.addEventListener('dragstart', (e) => {
          itemRow.classList.add('dragging');
          e.dataTransfer.setData('text/plain', JSON.stringify({ subIdx, itemIdx }));
        });

        itemRow.addEventListener('dragend', () => {
          itemRow.classList.remove('dragging');
        });

        itemRow.addEventListener('dragover', (e) => {
          e.preventDefault();
        });

        itemRow.addEventListener('drop', (e) => {
          e.preventDefault();
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.subIdx === subIdx && data.itemIdx !== itemIdx) {
            // Swap items
            const movedItem = sub.items.splice(data.itemIdx, 1)[0];
            sub.items.splice(itemIdx, 0, movedItem);
            renderEditScreen();
          }
        });

        itemsList.appendChild(itemRow);
      });

      // Event delegation for sublist buttons
      subCard.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const sIdx = parseInt(btn.dataset.subIdx, 10);
        const iIdx = parseInt(btn.dataset.itemIdx, 10);

        if (action === 'delete-sub') {
          editDraft.sublists.splice(sIdx, 1);
          renderEditScreen();
        } else if (action === 'add-item') {
          editDraft.sublists[sIdx].items.push({
            id: Storage.generateId('item'),
            name: '',
            description: '',
            checked: false
          });
          renderEditScreen();
        } else if (action === 'delete-item') {
          editDraft.sublists[sIdx].items.splice(iIdx, 1);
          renderEditScreen();
        } else if (action === 'move-up') {
          if (iIdx > 0) {
            const arr = editDraft.sublists[sIdx].items;
            [arr[iIdx - 1], arr[iIdx]] = [arr[iIdx], arr[iIdx - 1]];
            renderEditScreen();
          }
        } else if (action === 'move-down') {
          const arr = editDraft.sublists[sIdx].items;
          if (iIdx < arr.length - 1) {
            [arr[iIdx], arr[iIdx + 1]] = [arr[iIdx + 1], arr[iIdx]];
            renderEditScreen();
          }
        }
      });

      editSublistsContainer.appendChild(subCard);
    });
  }

  function addSublistToEditDraft() {
    if (!editDraft) return;
    editDraft.sublists.push({
      id: Storage.generateId('sub'),
      name: `Sub List ${editDraft.sublists.length + 1}`,
      items: []
    });
    renderEditScreen();
  }

  function saveEditChanges() {
    if (!editDraft) return;

    // Validation
    const cleanTitle = editDraft.title.trim();
    if (!cleanTitle) {
      showToast('Checklist title cannot be empty', 'error');
      editTitleInput.focus();
      return;
    }

    editDraft.title = cleanTitle;
    delete editDraft._isNew;

    // Save to storage
    const saved = Storage.saveChecklist(editDraft);
    showToast(`Saved "${saved.title}"`, 'success');

    currentChecklist = saved;
    navigateTo('view');
  }

  function promptDiscardEditChanges() {
    showModalConfirm(
      'Discard All Changes',
      'Are you sure you want to discard all changes made to this checklist?',
      () => {
        showToast('Changes discarded', 'info');
        if (editDraft && editDraft._isNew) {
          navigateTo('main');
        } else if (currentChecklist) {
          navigateTo('view');
        } else {
          navigateTo('main');
        }
      }
    );
  }

  /* ==========================================================================
     JSON File Import Handler
     ========================================================================== */
  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = Storage.importFromJSON(event.target.result);
        showToast(`Imported "${imported.title}"`, 'success');
        renderMainScreen();
        openChecklist(imported.id);
      } catch (err) {
        showToast(err.message, 'error');
      }
      fileImportInput.value = '';
    };
    reader.readAsText(file);
  }

  /* ==========================================================================
     Utility & Modal Helpers
     ========================================================================== */
  function calculateChecklistStats(checklist) {
    let total = 0;
    let checked = 0;

    if (checklist && checklist.sublists) {
      checklist.sublists.forEach(sub => {
        if (sub.items) {
          sub.items.forEach(item => {
            total++;
            if (item.checked) checked++;
          });
        }
      });
    }

    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, percent };
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showModalConfirm(title, message, onConfirm) {
    modalConfirmTitle.textContent = title;
    modalConfirmMsg.textContent = message;
    modalConfirmCallback = onConfirm;
    modalConfirm.classList.add('active');
  }

  function closeModal() {
    modalConfirm.classList.remove('active');
    modalConfirmCallback = null;
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Launch App
  initApp();
});
