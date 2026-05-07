import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const ModelComparison = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">No model data available</p>
        </div>
      </div>
    );
  }

  // Define descriptive badges for each model
  const getModelBadge = (modelName, status) => {
    if (status === 'Best') return { text: 'Best', color: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300 border-success-200' };
    
    switch (modelName) {
      case 'LSTM': return { text: 'Deep Learning', color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 border-primary-200' };
      case 'XGBoost': return { text: 'High Accuracy', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200' };
      case 'Prophet': return { text: 'Seasonal', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200' };
      case 'SARIMA': return { text: 'Baseline', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200' };
      default: return { text: 'Model', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200' };
    }
  };

  // Format RMSE values for display
  const formatRMSE = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{data.model}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              RMSE: <span className="font-medium text-gray-900">{data.rmse.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
            <p className="text-sm text-gray-600">
              MAE: <span className="font-medium text-gray-900">{data.mae.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
            <p className="text-sm text-gray-600">
              MAPE: <span className="font-medium text-gray-900">{data.mape.toFixed(2)}%</span>
            </p>
            <p className="text-sm text-gray-600">
              States: <span className="font-medium text-gray-900">{data.states_trained}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Colors for bars
  const getBarColor = (status, index) => {
    if (status === 'Best') return '#22c55e'; // success-500
    if (index === 1) return '#3b82f6'; // primary-500
    if (index === 2) return '#f59e0b'; // warning-500
    return '#6b7280'; // gray-500
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Model Comparison</h3>
        <p className="text-sm text-gray-600 mt-1">Performance metrics across all models</p>
      </div>

      {/* Bar Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="model" 
              tick={{ fontSize: 11 }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              tickFormatter={formatRMSE}
              tick={{ fontSize: 11 }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rmse" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.status, index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Model Table */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RMSE
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAE
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MAPE
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((model, index) => (
              <tr key={model.model} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    {model.status === 'Best' && (
                      <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{model.model}</span>
                    {(() => {
                      const badge = getModelBadge(model.model, model.status);
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
                          {badge.text}
                        </span>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatRMSE(model.rmse)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatRMSE(model.mae)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {model.mape.toFixed(2)}%
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`status-${model.status === 'Best' ? 'success' : 'warning'}`}>
                    {model.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-success-500 rounded-full mr-1"></div>
              <span>Best Model</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary-500 rounded-full mr-1"></div>
              <span>2nd Best</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-warning-500 rounded-full mr-1"></div>
              <span>3rd Best</span>
            </div>
          </div>
          <div>
            Lower RMSE = Better Performance
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelComparison;
