function DataTable({ data, view, onDelete }) {
  if (!data || data.length === 0) {
    const viewLabels = {
      contacts: 'contacts',
      deals: 'deals',
      tasks: 'tasks'
    };
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded border">
        <p className="text-lg font-medium">No {viewLabels[view] || 'data'} found.</p>
        <p className="text-sm mt-2">Click "Extract Now" to sync data from ActiveCampaign.</p>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});

  return (
    <div className="overflow-x-auto bg-white rounded border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col}
                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map(col => (
                <td
                  key={col}
                  className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap"
                >
                  {formatCellValue(row[col])}
                </td>
              ))}
              <td className="px-4 py-2 text-sm">
                <button
                  onClick={() => onDelete(row.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete item"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default DataTable;