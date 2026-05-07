import React, { useState } from 'react';

const APIDisplay = ({ state, sampleRequest, sampleResponse }) => {
  const [copiedSection, setCopiedSection] = useState('');

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  const requestExample = {
    method: 'POST',
    url: 'http://localhost:8000/predict',
    headers: {
      'Content-Type': 'application/json'
    },
    body: sampleRequest
  };

  const curlExample = `curl -X POST "http://localhost:8000/predict" \\
     -H "Content-Type: application/json" \\
     -d '${formatJSON(sampleRequest)}'`;

  const pythonExample = `import requests

url = "http://localhost:8000/predict"
payload = ${formatJSON(sampleRequest)}

response = requests.post(url, json=payload)
forecast = response.json()

print(f"State: {forecast['state']}")
print(f"Model: {forecast['model']}")
print(f"RMSE: {forecast['metrics']['RMSE']}")
print(f"Forecast for next week: {forecast['forecast'][7]['predicted_sales']}")`;

  const javascriptExample = `const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${formatJSON(sampleRequest)})
});

const forecast = await response.json();
console.log('State:', forecast.state);
console.log('Model:', forecast.model);
console.log('RMSE:', forecast.metrics.RMSE);
console.log('Forecast for next week:', forecast.forecast[7].predicted_sales);`;

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Integration</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Sample API requests and responses for {state}
        </p>
      </div>

      {/* Request/Response Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Request</h4>
            <button
              onClick={() => copyToClipboard(formatJSON(requestExample), 'request')}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              {copiedSection === 'request' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto h-64">
            <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
              {formatJSON(requestExample)}
            </pre>
          </div>
        </div>

        {/* Response */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Response</h4>
            <button
              onClick={() => copyToClipboard(formatJSON(sampleResponse), 'response')}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              {copiedSection === 'response' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto h-64 overflow-y-auto">
            <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
              {formatJSON(sampleResponse)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDisplay;
