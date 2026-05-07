import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import StateSelector from './components/StateSelector';
import ForecastChart from './components/ForecastChart';
import ModelComparison from './components/ModelComparison';
import APIDisplay from './components/APIDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { apiService } from './services/api';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [modelComparison, setModelComparison] = useState(null);
  const [trainingSummary, setTrainingSummary] = useState(null);
  const [error, setError] = useState('');
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Get API status
      const status = await apiService.getStatus();
      setApiStatus(status);
      
      if (status.models_trained) {
        // Load existing data
        await loadExistingData();
      } else {
        // Get available states
        const statesData = await apiService.getStates();
        setStates(statesData.states);
      }
      
    } catch (err) {
      setError('Failed to initialize application');
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingData = async () => {
    try {
      const [statesData, summaryData] = await Promise.all([
        apiService.getStates(),
        apiService.getSummary()
      ]);
      
      setStates(statesData.states);
      setTrainingSummary(summaryData.training_summary);
      
      // Select first state by default and load its specific data
      if (statesData.states.length > 0) {
        const initialState = statesData.states[0];
        setSelectedState(initialState);
        
        const [forecast, comparison] = await Promise.all([
          apiService.getForecast(initialState),
          apiService.getModelComparison(initialState)
        ]);
        
        setForecastData(forecast);
        setModelComparison(comparison);
      }
      
    } catch (err) {
      console.error('Error loading existing data:', err);
    }
  };

  const handleTrainModels = async () => {
    try {
      setTraining(true);
      setError('');
      
      const result = await apiService.trainModels(50); // Train for all states (up to 50)
      
      // Reload data after training
      await loadExistingData();
      
    } catch (err) {
      setError('Failed to train models');
      console.error('Training error:', err);
    } finally {
      setTraining(false);
    }
  };

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    await Promise.all([
      loadForecastData(state),
      loadStateModelComparison(state)
    ]);
  };

  const loadStateModelComparison = async (state) => {
    try {
      const comparisonData = await apiService.getModelComparison(state);
      setModelComparison(comparisonData);
    } catch (err) {
      console.error('Error loading state model comparison:', err);
    }
  };


  const loadForecastData = async (state) => {
    try {
      setLoadingForecast(true);
      const forecast = await apiService.getForecast(state);
      setForecastData(forecast);
    } catch (err) {
      console.error('Error loading forecast:', err);
      setForecastData(null);
    } finally {
      setLoadingForecast(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" text="Initializing Dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Full Screen Overlay for Training */}
      {training && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full">
            <LoadingSpinner size="large" text="Training Models (This may take a minute)..." />
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        onTrainModels={handleTrainModels} 
        training={training}
        modelsTrained={apiStatus?.models_trained}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800">Error</h3>
                <div className="mt-2 text-sm text-danger-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {trainingSummary && (
          <div className="mb-8">
            <KPICards 
              bestModel={modelComparison?.model_comparison?.[0]?.model || 'N/A'}
              rmse={modelComparison?.model_comparison?.[0]?.rmse || 0}
              forecastHorizon={56}
              statesCovered={trainingSummary?.successful_states || 0}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - State Selection and Models */}
          <div className="lg:col-span-1 space-y-6">
            {/* State Selector */}
            <StateSelector
              states={states}
              selectedState={selectedState}
              onStateSelect={handleStateSelect}
              loading={training}
            />

            {/* Model Comparison */}
            {modelComparison && (
              <ModelComparison data={modelComparison.model_comparison} />
            )}
          </div>

          {/* Right Column - Forecast Chart */}
          <div className="lg:col-span-2 relative">
            {loadingForecast && (
              <div className="absolute inset-0 z-10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <LoadingSpinner size="large" text="Loading Forecast..." />
              </div>
            )}
            {forecastData ? (
              <ForecastChart 
                data={forecastData}
                state={selectedState}
                model={forecastData.best_model}
              />
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Forecast Data</h3>
                  <p className="text-gray-500">
                    {apiStatus?.models_trained 
                      ? 'Select a state to view forecast data' 
                      : 'Train models to see forecast data'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* API Integration */}
        {selectedState && forecastData && (
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-6 w-1 bg-primary-600 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Integration</h2>
            </div>
            <APIDisplay 
              state={selectedState}
              sampleRequest={{
                state: selectedState,
                days: 56
              }}
              sampleResponse={forecastData}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
