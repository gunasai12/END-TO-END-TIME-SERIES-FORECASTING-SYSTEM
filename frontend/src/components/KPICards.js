import React from 'react';

const KPICards = ({ bestModel, rmse, forecastHorizon, statesCovered }) => {
  const kpis = [
    {
      title: 'Best Model',
      value: bestModel,
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'primary',
      trend: null
    },
    {
      title: 'RMSE',
      value: rmse.toLocaleString(),
      icon: (
        <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'success',
      trend: null
    },
    {
      title: 'Forecast Horizon',
      value: `${forecastHorizon} days`,
      icon: (
        <svg className="w-8 h-8 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'warning',
      trend: null
    },
    {
      title: 'States Covered',
      value: statesCovered,
      icon: (
        <svg className="w-8 h-8 text-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'info',
      trend: null
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      primary: 'from-primary-500 to-primary-600',
      success: 'from-success-500 to-success-600',
      warning: 'from-warning-500 to-warning-600',
      info: 'from-blue-500 to-blue-600'
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-card group hover:scale-105 transform transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="metric-label">{kpi.title}</p>
              <p className="metric-value mt-2">{kpi.value}</p>
              {kpi.trend && (
                <div className="mt-2 flex items-center text-sm">
                  <span className={`inline-flex items-center ${kpi.trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {kpi.trend > 0 ? (
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    {Math.abs(kpi.trend)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className={`ml-4 p-3 rounded-lg bg-gradient-to-br ${getColorClasses(kpi.color)} text-white shadow-lg group-hover:shadow-xl transition-all duration-200`}>
              {kpi.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
