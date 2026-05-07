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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
              {formatJSON(sampleResponse)}
            </pre>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Code Examples</h4>
        
        <div className="space-y-4">
          {/* cURL Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">cURL</span>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {copiedSection === 'curl' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">{curlExample}</pre>
            </div>
          </div>

          {/* Python Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Python</span>
              <button
                onClick={() => copyToClipboard(pythonExample, 'python')}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {copiedSection === 'python' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">{pythonExample}</pre>
            </div>
          </div>

          {/* JavaScript Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">JavaScript</span>
              <button
                onClick={() => copyToClipboard(javascriptExample, 'javascript')}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {copiedSection === 'javascript' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">{javascriptExample}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Available Endpoints</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded mr-2">GET</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">/</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get API status and health check</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-success-600 bg-success-100 dark:bg-success-900/30 px-2 py-1 rounded mr-2">POST</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">/train</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Train forecasting models</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-success-600 bg-success-100 dark:bg-success-900/30 px-2 py-1 rounded mr-2">POST</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">/predict</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get sales prediction for a state</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded mr-2">GET</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">/forecast/{'{state}'}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get 8-week forecast for a state</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded mr-2">GET</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">/models</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get model comparison metrics</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded mr-2">GET</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">/states</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get list of available states</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDisplay;
