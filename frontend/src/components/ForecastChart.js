import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const ForecastChart = ({ data, state, model }) => {
  const [chartType, setChartType] = useState('line');

  if (!data || !data.forecast) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Forecast Data Available</h3>
          <p className="text-gray-500 dark:text-gray-400">Please select a state to view forecast data</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.forecast.map((item) => ({
    date: item.date,
    week: `Week ${item.week}`,
    sales: item.predicted_sales,
    lowerBound: item.lower_bound,
    upperBound: item.upper_bound
  }));

  // Format numbers for display
  const formatSales = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (!chartData || chartData.length === 0) return;
    
    const headers = ['Date,Week,Predicted Sales,Lower Bound,Upper Bound'];
    const rows = chartData.map(item => 
      `${item.date},${item.week},${item.sales.toFixed(2)},${item.lowerBound ? item.lowerBound.toFixed(2) : ''},${item.upperBound ? item.upperBound.toFixed(2) : ''}`
    );
    
    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `forecast_${state.replace(/\s+/g, '_')}_${model}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {formatSales(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickLine={{ stroke: '#e0e0e0' }}
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }}
            />
            <YAxis 
              tickFormatter={formatSales}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Confidence interval */}
            {chartData[0]?.lowerBound && chartData[0]?.upperBound && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="1"
                stroke="none"
                fill="rgba(59, 130, 246, 0.1)"
                name="Upper Bound"
              />
            )}
            
            {chartData[0]?.lowerBound && chartData[0]?.upperBound && (
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="2"
                stroke="none"
                fill="rgba(59, 130, 246, 0.1)"
                name="Lower Bound"
              />
            )}
            
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
              name="Predicted Sales"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(date) => {
              const d = new Date(date);
              return `${d.getMonth()+1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            tickFormatter={formatSales}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            domain={['auto', 'auto']}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Confidence interval lines */}
          {chartData[0]?.lowerBound && (
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="#93c5fd"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Lower Bound"
            />
          )}
          
          {chartData[0]?.upperBound && (
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke="#93c5fd"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Upper Bound"
            />
          )}
          
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6 }}
            name="Predicted Sales"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="card">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sales Forecast - {state}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Next 8 weeks prediction using {model}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Download Button */}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download</span>
          </button>

          {/* Chart Type Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                chartType === 'line'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                chartType === 'area'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {renderChart()}
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Weekly Sales</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatSales(chartData.reduce((sum, item) => sum + item.sales, 0) / chartData.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Peak Week Sales</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatSales(Math.max(...chartData.map(item => item.sales)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total 8-Week Forecast</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatSales(chartData.reduce((sum, item) => sum + item.sales, 0))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
