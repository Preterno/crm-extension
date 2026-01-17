function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'contacts', label: 'Contacts' },
    { id: 'deals', label: 'Deals' },
    { id: 'tasks', label: 'Tasks' }
  ];

  return (
    <div className="flex space-x-1 border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;