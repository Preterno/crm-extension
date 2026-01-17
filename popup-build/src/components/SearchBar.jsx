import { useState, useEffect } from 'react';

function SearchBar({ value, onChange }) {
  const [debouncedValue, setDebouncedValue] = useState(value || '');

  useEffect(() => {
    setDebouncedValue(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(debouncedValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedValue, onChange]);

  return (
    <div className="relative">
      <input
        type="text"
        value={debouncedValue}
        onChange={(e) => setDebouncedValue(e.target.value)}
        placeholder="Search…"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {debouncedValue && (
        <button
          onClick={() => setDebouncedValue('')}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
