import JSZip from 'jszip';

function ExportButtons({ data, activeTab }) {
  const exportJSON = () => {
    const currentData = data[activeTab] || [];
    const json = JSON.stringify(currentData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const currentData = data[activeTab] || [];
    if (currentData.length === 0) return;

    const columns = Object.keys(currentData[0] || {});
    const csvRows = [
      columns.join(','),
      ...currentData.map(row =>
        columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          if (Array.isArray(value)) return JSON.stringify(value.join(', '));
          if (typeof value === 'object') return JSON.stringify(value);
          const str = String(value);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      )
    ];

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activecampaign_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllCSV = async () => {
    const zip = new JSZip();

    const views = ['contacts', 'deals', 'tasks'];
    
    for (const view of views) {
      const viewData = data[view] || [];
      if (viewData.length === 0) continue;

      const columns = Object.keys(viewData[0] || {});
      const csvRows = [
        columns.join(','),
        ...viewData.map(row =>
          columns.map(col => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            if (Array.isArray(value)) return JSON.stringify(value.join(', '));
            if (typeof value === 'object') return JSON.stringify(value);
            const str = String(value);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          }).join(',')
        )
      ];

      const csv = csvRows.join('\n');
      zip.file(`${view}.csv`, csv);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activecampaign_export.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <button
          onClick={exportJSON}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors text-sm"
        >
          Export JSON
        </button>
        <button
          onClick={exportCSV}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors text-sm"
        >
          Export CSV
        </button>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={exportAllJSON}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors text-sm"
        >
          Export All JSON
        </button>
        <button
          onClick={exportAllCSV}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors text-sm"
        >
          Export All CSV
        </button>
      </div>
    </div>
  );
}

export default ExportButtons;