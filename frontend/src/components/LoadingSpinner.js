import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = null }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {text && <p className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
