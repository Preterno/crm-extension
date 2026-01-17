import React, { useState, useEffect, useMemo } from 'react';
import Tabs from './Tabs.jsx';
import DataTable from './DataTable.jsx';
import ExportButtons from './ExportButtons.jsx';
import Toast from './components/Toast.jsx';
import SearchBar from './components/SearchBar.jsx';
import { useToast } from './hooks/useToast.jsx';

async function loadStorageData() {
  const { getData } = await import('../../storage.js');
  return await getData();
}

function App() {
  const [data, setData] = useState({ contacts: [], deals: [], tasks: [], lastSync: 0 });
  const [activeTab, setActiveTab] = useState('contacts');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast, showToast } = useToast();

  const loadData = async () => {
    try {
      const storageData = await loadStorageData();
      setData(storageData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const storageListener = () => {
      loadData();
    };

    const messageListener = (message) => {
      if (message?.type === 'DATA_SYNCED') {
        showToast(`Synced ${message.count} ${message.view}!`, 'success');
        loadData();
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [showToast]);

  const handleExtract = () => {
    setLoading(true);
    setError(null);

    chrome.runtime.sendMessage({ type: 'EXTRACT_DATA' }, (response) => {
      setLoading(false);
      
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message);
        showToast('Extraction failed', 'error');
        return;
      }

      if (response?.error) {
        setError(response.error);
        showToast('Extraction failed', 'error');
        return;
      }

      if (response?.success) {
        showToast(`Extracted ${response.count} ${response.view}!`, 'success');
        loadData();
      } else {
        setError('Extraction failed');
        showToast('Extraction failed', 'error');
      }
    });
  };

  const handleDelete = (id) => {
    chrome.runtime.sendMessage({ 
      type: 'DELETE_ITEM', 
      view: activeTab, 
      id 
    }, (response) => {
      if (chrome.runtime.lastError) {
        showToast('Delete failed', 'error');
        return;
      }

      if (response?.success) {
        showToast('Item deleted', 'success');
        loadData();
      } else {
        showToast('Delete failed', 'error');
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const currentData = data[activeTab] || [];
  const contactsCount = data.contacts?.length || 0;
  const dealsCount = data.deals?.length || 0;
  const tasksCount = data.tasks?.length || 0;

  const filteredData = useMemo(() => {
    if (!searchTerm) return currentData;
    const searchLower = searchTerm.toLowerCase();
    return currentData.filter(item =>
      JSON.stringify(item).toLowerCase().includes(searchLower)
    );
  }, [currentData, searchTerm]);

  return (
    <div className="p-4 space-y-4 relative">
      <Toast toast={toast} />
      
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">CRM Data Extractor</h1>
        <button
          onClick={handleExtract}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white font-medium flex items-center gap-2 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          } transition-colors`}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Extracting...' : 'Extract Now'}
        </button>
      </div>

      <div className="text-sm text-gray-600 bg-white p-3 rounded border">
        Contacts: {contactsCount} | Deals: {dealsCount} | Tasks: {tasksCount} | Last synced: {formatTime(data.lastSync)}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      <DataTable data={filteredData} view={activeTab} onDelete={handleDelete} />

      <ExportButtons data={data} activeTab={activeTab} />
    </div>
  );
}

export default App;