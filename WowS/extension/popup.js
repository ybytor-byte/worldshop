// ==========================================================================
// Global Shopper — Extension Popup Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('extension-toggle');

    // Load initial state
    chrome.storage.local.get(['enabled'], (result) => {
        if (result.enabled !== undefined) {
            toggle.checked = result.enabled;
        } else {
            toggle.checked = true; // default true
        }
    });

    // Handle toggle action
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        
        // Save state in chrome.storage
        chrome.storage.local.set({ enabled }, () => {
            // Notify active tab content scripts
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    try {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'toggleExtension',
                            enabled: enabled
                        });
                    } catch (e) {
                        // Skip tabs where content script isn't loaded (e.g. chrome:// tabs)
                    }
                });
            });
        });
    });
});
