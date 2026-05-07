import React, { useState } from 'react';

const StateSelector = ({ states, selectedState, onStateSelect, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStateClick = (state) => {
    if (!loading) {
      onStateSelect(state);
    }
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select State</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Choose a state to view sales forecast</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
            placeholder="Search states..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* States List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredStates.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No states found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredStates.map((state) => (
              <button
                key={state}
                onClick={() => handleStateClick(state)}
                disabled={loading}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedState === state
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-medium border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-transparent'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{state}</span>
                  {selectedState === state && (
                    <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected State Info */}
      {selectedState && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selected:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedState}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateSelector;
