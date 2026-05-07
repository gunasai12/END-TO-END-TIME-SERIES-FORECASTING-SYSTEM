# End-to-End Time Series Forecasting System

A production-ready full-stack time series forecasting system for predicting next 8 weeks sales for each state using historical sales data. The system features multiple ML models, automatic model selection, REST API backend, and a modern React dashboard.

## 🚀 Features

### Backend
- **Data Preprocessing Pipeline**: Handles missing dates, missing values, and data cleaning
- **Feature Engineering**: Lag features, rolling statistics, date features, and holiday features
- **Multiple Forecasting Models**: SARIMA, Facebook Prophet, XGBoost, and LSTM Neural Network
- **Automatic Model Selection**: Compares models using RMSE, MAE, and MAPE metrics
- **REST API**: FastAPI backend with comprehensive endpoints
- **Model Persistence**: Saves trained models for future use

### Frontend
- **Modern Dashboard**: Responsive React.js dashboard with Tailwind CSS
- **Interactive Visualizations**: Recharts-based forecasting charts
- **Real-time Updates**: Dynamic data loading and state management
- **Model Comparison**: Visual comparison of model performance
- **API Integration**: Built-in API documentation and examples

## 📊 Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern, fast web framework for building APIs
- **Pandas & NumPy** - Data manipulation and numerical computing
- **Scikit-learn** - Machine learning library
- **Statsmodels** - Statistical models and tests
- **Prophet** - Facebook's time series forecasting library
- **XGBoost** - Gradient boosting framework
- **TensorFlow/Keras** - Deep learning for LSTM models
- **Joblib** - Model serialization

### Frontend
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library
- **Axios** - HTTP client for API requests

## 📁 Project Structure

```
forecasting-system/
│
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── train.py              # Model training script
│   ├── preprocess.py         # Data preprocessing
│   ├── feature_engineering.py # Feature engineering
│   ├── models.py             # Forecasting models
│   ├── app/                  # Application modules
│   ├── models/               # Saved model files
│   ├── saved_models/         # Trained models storage
│   └── results/              # Training results
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   ├── App.js            # Main application
│   │   └── index.js          # Entry point
│   ├── public/               # Static files
│   ├── package.json          # Frontend dependencies
│   └── tailwind.config.js    # Tailwind configuration
│
├── data/
│   └── sales.xlsx            # Sales dataset
│
├── requirements.txt          # Python dependencies
└── README.md                # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd forecasting-system
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Prepare Data
Place your sales dataset (Excel file) in the `data/` directory:
- The dataset should contain columns: `State`, `Date`, `Total`, `Category`
- Update the filename in `backend/train.py` and `backend/app.py` if different

#### Train Models
```bash
cd backend
python train.py
```

This will:
- Load and preprocess the data
- Train all forecasting models for each state
- Save the best models automatically
- Generate performance metrics

#### Start the Backend Server
```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Start the Development Server
```bash
npm start
```

The dashboard will be available at `http://localhost:3000`

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status and health check |
| GET | `/states` | Get list of available states |
| POST | `/train` | Train forecasting models |
| POST | `/predict` | Get sales prediction for a state |
| GET | `/forecast/{state}` | Get 8-week forecast for a state |
| GET | `/models` | Get model comparison metrics |
| GET | `/summary` | Get training summary |
| GET | `/health` | Health check endpoint |

### Example API Usage

#### Get Forecast for a State
```bash
curl -X GET "http://localhost:8000/forecast/California"
```

#### Make Prediction
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "state": "California",
       "days": 56
     }'
```

#### Train Models
```bash
curl -X POST "http://localhost:8000/train?max_states=5"
```

## 🎯 Usage Guide

### 1. Initial Setup
1. Start the backend server
2. Start the frontend application
3. Open the dashboard in your browser

### 2. Training Models
1. Click the "Train Models" button in the dashboard
2. Wait for training to complete (may take several minutes)
3. View training results and model comparison

### 3. Viewing Forecasts
1. Select a state from the state selector panel
2. View the 8-week forecast chart
3. Examine model performance metrics
4. Switch between different chart types (Line/Area)

### 4. API Integration
1. Use the built-in API examples for integration
2. Copy code snippets for your preferred language
3. Test endpoints using the provided examples

## 📈 Model Details

### SARIMA (Seasonal AutoRegressive Integrated Moving Average)
- Handles seasonality and trends
- Automatically tunes p,d,q parameters
- Best for stationary time series with clear seasonal patterns

### Facebook Prophet
- Robust to missing data and outliers
- Automatically detects seasonal patterns
- Includes holiday effects
- Best for business time series with multiple seasonalities

### XGBoost
- Gradient boosting framework
- Uses engineered features (lags, rolling statistics)
- Handles non-linear relationships
- Best for complex patterns with feature interactions

### LSTM (Long Short-Term Memory)
- Deep learning approach
- Captures long-term dependencies
- Uses sequence data
- Best for complex temporal patterns

## 📊 Evaluation Metrics

- **RMSE (Root Mean Square Error)**: Measures the average magnitude of errors
- **MAE (Mean Absolute Error)**: Measures the average absolute difference
- **MAPE (Mean Absolute Percentage Error)**: Measures percentage accuracy

The system automatically selects the best model based on the lowest RMSE score.

## 🔧 Configuration

### Backend Configuration
- Modify `backend/app.py` to change API settings
- Update `backend/train.py` to adjust training parameters
- Change model hyperparameters in `backend/models.py`

### Frontend Configuration
- Modify `frontend/src/services/api.js` to change API endpoints
- Update `frontend/tailwind.config.js` for styling customization
- Adjust chart settings in component files

## 🚀 Deployment

### Backend Deployment
```bash
# Install production server
pip install gunicorn

# Run production server
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
serve -s build -l 3000
```

## 🐛 Troubleshooting

### Common Issues

1. **Models not training**: Check data format and file paths
2. **API connection errors**: Ensure backend is running on correct port
3. **Frontend not loading**: Check Node.js version and dependencies
4. **Memory issues**: Reduce `max_states` parameter during training

### Performance Optimization
- Use GPU for LSTM training (install TensorFlow GPU)
- Reduce training data size for faster iteration
- Cache model predictions for repeated requests

## 📝 Development

### Adding New Models
1. Implement model class in `backend/models.py`
2. Add training logic to `train.py`
3. Update API endpoints if needed
4. Add frontend visualization components

### Extending Features
- Add new features in `feature_engineering.py`
- Implement custom metrics in `models.py`
- Create new dashboard components in `frontend/src/components/`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Updates

Version 1.0.0 includes:
- Complete forecasting pipeline
- Four ML models (SARIMA, Prophet, XGBoost, LSTM)
- REST API backend
- Modern React dashboard
- Comprehensive documentation

---

**Happy Forecasting! 🚀**
