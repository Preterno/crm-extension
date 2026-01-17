import { mergeData, deleteItem } from './storage.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_DATA') {
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      
      if (!tab) {
        sendResponse({
          success: false,
          view: null,
          count: 0,
          lastSync: 0,
          error: 'No active tab found'
        });
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'START_EXTRACTION' }).catch(() => {});

      chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' }, async (response) => {
        
        if (chrome.runtime.lastError) {
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACTION_FAILED' }).catch(() => {});
          sendResponse({
            success: false,
            view: null,
            count: 0,
            lastSync: 0,
            error: chrome.runtime.lastError.message
          });
          return;
        }

        if (response?.error) {
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACTION_FAILED' }).catch(() => {});
          sendResponse({
            success: false,
            view: response.view,
            count: 0,
            lastSync: 0,
            error: response.error
          });
          return;
        }

        if (response?.view && response?.data) {
          try {
            const result = await mergeData(response.view, response.data);
            
            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACTION_SUCCESS' }).catch(() => {});
            
            sendResponse({
              success: true,
              view: response.view,
              count: result.count,
              lastSync: result.lastSync
            });

            chrome.runtime.sendMessage({
              type: 'DATA_SYNCED',
              view: response.view,
              count: result.count,
              lastSync: result.lastSync
            }).catch(() => {});
          } catch (err) {
            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACTION_FAILED' }).catch(() => {});
            sendResponse({
              success: false,
              view: response.view,
              count: 0,
              lastSync: 0,
              error: err.message
            });
          }
        } else {
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACTION_FAILED' }).catch(() => {});
          sendResponse({
            success: false,
            view: null,
            count: 0,
            lastSync: 0,
            error: 'No supported view detected'
          });
        }
      });
    });

    return true;
  }

  if (request.type === 'DELETE_ITEM') {
    (async () => {
      try {
        const result = await deleteItem(request.view, request.id);
        sendResponse({
          success: true,
          view: request.view,
          count: result.count,
          lastSync: result.lastSync
        });

        chrome.runtime.sendMessage({
          type: 'DATA_SYNCED',
          view: request.view,
          count: result.count,
          lastSync: result.lastSync
        }).catch(() => {});
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message
        });
      }
    })();

    return true;
  }
});
