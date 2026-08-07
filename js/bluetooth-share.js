/**
 * Bluetooth & JSON Sharing Controller
 * Handles Web Share API (Android Bluetooth File Transfer), Web Bluetooth, and File Import/Export
 */

const BluetoothShare = {
  /**
   * Check if Web Share API with File sharing is supported
   */
  canNativeShareFiles() {
    if (navigator.share && navigator.canShare) {
      const dummyFile = new File(['{}'], 'test.json', { type: 'application/json' });
      return navigator.canShare({ files: [dummyFile] });
    }
    return false;
  },

  /**
   * Main function to initiate Bluetooth / System sharing for a checklist
   */
  async shareChecklist(checklist, onNotificationCallback = null) {
    const notify = (msg, type = 'info') => {
      if (onNotificationCallback) onNotificationCallback(msg, type);
      else console.log(`[Share ${type}] ${msg}`);
    };

    const jsonContent = Storage.exportToJSON(checklist);
    const safeTitle = checklist.title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const fileName = `${safeTitle}.json`;

    // 1. Try Web Share API (Triggers Android Bluetooth / Quick Share option)
    try {
      const file = new File([jsonContent], fileName, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: checklist.title,
          text: `Checklist: ${checklist.title}`,
          files: [file]
        });
        notify(`Shared "${checklist.title}" via system share / Bluetooth`, 'success');
        return true;
      } else if (navigator.share) {
        // Share text if file share not supported by browser build
        await navigator.share({
          title: checklist.title,
          text: jsonContent
        });
        notify(`Shared "${checklist.title}" text data`, 'success');
        return true;
      }
    } catch (err) {
      // User cancelled share or browser error
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed or aborted:', err);
      } else {
        return false;
      }
    }

    // 2. Fallback: Prompt user to download JSON file for Bluetooth transfer or copy payload
    this.downloadJSONFile(checklist);
    notify(`Exported "${fileName}" for manual Bluetooth transfer`, 'info');
    return false;
  },

  /**
   * Helper to trigger `.json` file download on device
   */
  downloadJSONFile(checklist) {
    const jsonContent = Storage.exportToJSON(checklist);
    const safeTitle = checklist.title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_checklist.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Web Bluetooth API optional helper (for direct GATT device communication if supported)
   */
  async requestBluetoothDevice() {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Use Android Bluetooth share or file import instead.');
    }
    
    return await navigator.bluetooth.requestDevice({
      acceptAllDevices: true
    });
  }
};
