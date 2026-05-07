import React from 'react';

const Header = ({ onTrainModels, training, modelsTrained, darkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gradient">
              Time Series Forecasting System
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Advanced Sales Forecasting with Machine Learning
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${modelsTrained ? 'bg-success-500' : 'bg-warning-500'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {modelsTrained ? 'Models Ready' : 'Models Not Trained'}
              </span>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!modelsTrained && (
                <button
                  onClick={onTrainModels}
                  disabled={training}
                  className="btn-primary flex items-center space-x-2"
                >
                  {training ? (
                    <>
                      <div className="loading-spinner w-4 h-4 border-2"></div>
                      <span>Training...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Train Models</span>
                    </>
                  )}
                </button>
              )}
              
              {modelsTrained && (
                <button
                  onClick={onTrainModels}
                  disabled={training}
                  className="btn-secondary flex items-center space-x-2"
                >
                  {training ? (
                    <>
                      <div className="loading-spinner w-4 h-4 border-2"></div>
                      <span>Retraining...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Retrain Models</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
