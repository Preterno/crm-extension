// --- Utilities ---
function hash(str) {
    return str.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
  }
  
  // --- Deduplication ---
  function dedupeById(list) {
    const seen = new Map();
    const result = [];
    
    for (const item of list) {
      let id = item.id;
  
      // Fallback hash for items without id (e.g. tasks)
      if (id == null) {
        if (item.title && (item.relatedTo || item.due)) {
          const hashStr = `${item.title}${item.relatedTo ?? ''}${item.due ?? ''}`;
          id = String(hash(hashStr));
        } else {
          // Skip items that cannot be uniquely identified
          continue;
        }
      }
  
      const key = String(id);
      if (!seen.has(key)) {
        seen.set(key, true);
        result.push({ ...item, id: key });
      }
    }
  
    return result;
  }
  
  // --- Storage Get ---
  async function getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['activecampaign_data'], (result) => {
        resolve(result.activecampaign_data ?? {
          contacts: [],
          deals: [],
          tasks: [],
          lastSync: 0
        });
      });
    });
  }
  
  // --- Storage Set ---
  async function setData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ activecampaign_data: data }, () => {
        resolve();
      });
    });
  }
  
  // --- Merge Logic ---
  async function mergeData(view, items) {
    const current = await getData();
    const deduped = dedupeById(items);

    const updated = {
      ...current,
      [view]: deduped,
      lastSync: Date.now()
    };

    await setData(updated);

    return {
      count: deduped.length,
      lastSync: updated.lastSync
    };
  }

  // --- Delete Item ---
  async function deleteItem(view, id) {
    const current = await getData();
    const items = current[view] || [];

    let filtered;
    
    if (id != null) {
      filtered = items.filter(item => String(item.id) !== String(id));
    } else {
      filtered = items;
    }

    const updated = {
      ...current,
      [view]: filtered,
      lastSync: Date.now()
    };

    await setData(updated);

    return {
      count: filtered.length,
      lastSync: updated.lastSync
    };
  }

  // --- ES Module Exports ---
  export {
    dedupeById,
    getData,
    setData,
    mergeData,
    deleteItem
  };
  