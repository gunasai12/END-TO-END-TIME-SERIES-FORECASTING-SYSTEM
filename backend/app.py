from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Import custom modules
from preprocess import DataPreprocessor
from feature_engineering import FeatureEngineer
from models import ForecastingModels

# Initialize FastAPI app
app = FastAPI(
    title="Time Series Forecasting API",
    description="API for sales forecasting using multiple ML models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
preprocessor = None
feature_engineer = None
forecasting_models = None
training_results = None
available_states = []

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    state: str
    model: Optional[str] = None
    days: Optional[int] = 56

class PredictionResponse(BaseModel):
    state: str
    model: str
    forecast: List[Dict[str, Any]]
    metrics: Dict[str, float]
    status: str

class ModelInfo(BaseModel):
    name: str
    rmse: float
    mae: float
    mape: float
    status: str

class APIStatus(BaseModel):
    status: str
    timestamp: str
    models_trained: bool
    available_states: int

@app.on_event("startup")
async def startup_event():
    """Initialize the API on startup"""
    global preprocessor, feature_engineer, forecasting_models, training_results, available_states
    
    try:
        # Initialize components
        data_path = "../data/Forecasting Case- Study.xlsx - Sheet1.csv"
        
        if os.path.exists(data_path):
            preprocessor = DataPreprocessor(data_path)
            preprocessor.load_data()
            preprocessor.handle_missing_dates()
            available_states = preprocessor.get_all_states()
            
            feature_engineer = FeatureEngineer()
            forecasting_models = ForecastingModels()
            
            # Try to load existing training results
            if os.path.exists("results/training_results.pkl"):
                training_results = joblib.load("results/training_results.pkl")
                
        print("API initialized successfully")
        
    except Exception as e:
        print(f"Error initializing API: {e}")

@app.get("/", response_model=APIStatus)
async def get_api_status():
    """Get API status"""
    return APIStatus(
        status="active",
        timestamp=datetime.now().isoformat(),
        models_trained=training_results is not None,
        available_states=len(available_states)
    )

@app.get("/states")
async def get_available_states():
    """Get list of available states"""
    if not available_states:
        raise HTTPException(status_code=404, detail="No states available. Data not loaded.")
    
    return {
        "states": available_states,
        "count": len(available_states)
    }

@app.post("/train")
async def train_models(max_states: Optional[int] = 5):
    """Train forecasting models"""
    try:
        global training_results
        
        if not preprocessor:
            raise HTTPException(status_code=500, detail="Data not loaded")
        
        # Import trainer
        from train import ModelTrainer
        
        # Initialize trainer
        trainer = ModelTrainer("../data/Forecasting Case- Study.xlsx - Sheet1.csv")
        trainer.prepare_data()
        
        # Train models
        results = trainer.train_all_states(max_states=max_states)
        
        # Generate forecasts
        forecasts = trainer.generate_forecasts(forecast_days=56)
        
        # Store results
        training_results = {
            'model_results': results,
            'forecasts': forecasts,
            'summary': trainer.get_summary_statistics()
        }
        
        # Save results
        trainer.save_results()
        
        return {
            "status": "success",
            "message": f"Models trained for {len(results)} states",
            "summary": training_results['summary']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/predict", response_model=PredictionResponse)
async def get_prediction(request: PredictionRequest):
    """Get sales prediction for a state"""
    try:
        if request.state not in available_states:
            raise HTTPException(status_code=404, detail=f"State {request.state} not found")
        
        if not training_results:
            raise HTTPException(status_code=400, detail="Models not trained. Call /train first.")
        
        # Get state data
        state_data = preprocessor.get_state_data(request.state)
        featured_data = feature_engineer.engineer_features(state_data)
        
        # Get best model for this state
        if request.state not in training_results['model_results']:
            raise HTTPException(status_code=404, detail=f"No trained model for state {request.state}")
        
        state_results = training_results['model_results'][request.state]
        best_model_name = state_results['best_model']['name']
        model_to_use = request.model if request.model else best_model_name
        
        # Load the model
        model_path = f"saved_models/{model_to_use.lower()}_model.pkl"
        if model_to_use == 'LSTM':
            model_path = "saved_models/lstm_model.h5"
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail=f"Model file not found for {model_to_use}")
        
        # Create model instance and load
        state_models = ForecastingModels()
        loaded_model = state_models.load_model(model_to_use)
        
        if not loaded_model:
            raise HTTPException(status_code=500, detail=f"Failed to load model {model_to_use}")
        
        # Generate forecast
        feature_cols = feature_engineer.get_feature_columns(featured_data)
        forecast_result = state_models.generate_forecast(
            model_to_use, featured_data, request.days, feature_cols
        )
        
        # Format forecast data
        forecast_data = []
        for i, (date, value) in enumerate(zip(forecast_result['dates'], forecast_result['forecast'])):
            forecast_entry = {
                "date": date.strftime("%Y-%m-%d"),
                "predicted_sales": float(value),
                "week": i // 7 + 1
            }
            
            # Add confidence intervals if available
            if 'lower_bound' in forecast_result:
                forecast_entry["lower_bound"] = float(forecast_result['lower_bound'][i])
                forecast_entry["upper_bound"] = float(forecast_result['upper_bound'][i])
            
            forecast_data.append(forecast_entry)
        
        # Get metrics
        metrics = state_results['best_model']['metrics']
        
        return PredictionResponse(
            state=request.state,
            model=model_to_use,
            forecast=forecast_data,
            metrics=metrics,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/forecast/{state}")
async def get_state_forecast(state: str, days: int = 56):
    """Get forecast for a specific state"""
    try:
        if state not in available_states:
            raise HTTPException(status_code=404, detail=f"State {state} not found")
        
        if not training_results:
            raise HTTPException(status_code=400, detail="Models not trained. Call /train first.")
        
        # Check if forecast exists
        if state not in training_results['forecasts']:
            raise HTTPException(status_code=404, detail=f"No forecast available for state {state}")
        
        forecast_data = training_results['forecasts'][state]
        
        # Format response
        response = {
            "state": state,
            "best_model": forecast_data['best_model'],
            "metrics": forecast_data['metrics'],
            "forecast": []
        }
        
        # Format forecast data
        forecast_result = forecast_data['forecast']
        for i, (date, value) in enumerate(zip(forecast_result['dates'], forecast_result['forecast'])):
            response["forecast"].append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_sales": float(value),
                "week": i // 7 + 1
            })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast retrieval failed: {str(e)}")

@app.get("/models")
async def get_model_comparison():
    """Get model comparison metrics"""
    try:
        if not training_results:
            raise HTTPException(status_code=400, detail="Models not trained. Call /train first.")
        
        # Aggregate model performance across all states
        model_performance = {}
        
        for state, state_results in training_results['model_results'].items():
            if 'error' in state_results:
                continue
            
            for model_name, model_data in state_results.items():
                if model_name == 'best_model':
                    continue
                
                if model_name not in model_performance:
                    model_performance[model_name] = {
                        'rmse_values': [],
                        'mae_values': [],
                        'mape_values': [],
                        'states_count': 0
                    }
                
                if 'metrics' in model_data:
                    metrics = model_data['metrics']
                    model_performance[model_name]['rmse_values'].append(metrics['RMSE'])
                    model_performance[model_name]['mae_values'].append(metrics['MAE'])
                    model_performance[model_name]['mape_values'].append(metrics['MAPE'])
                    model_performance[model_name]['states_count'] += 1
        
        # Calculate average metrics
        comparison = []
        for model_name, data in model_performance.items():
            if data['rmse_values']:
                avg_rmse = np.mean(data['rmse_values'])
                avg_mae = np.mean(data['mae_values'])
                avg_mape = np.mean(data['mape_values'])
                
                comparison.append({
                    "model": model_name,
                    "rmse": round(avg_rmse, 2),
                    "mae": round(avg_mae, 2),
                    "mape": round(avg_mape, 2),
                    "states_trained": data['states_count'],
                    "status": "Trained"
                })
        
        # Sort by RMSE
        comparison.sort(key=lambda x: x['rmse'])
        
        # Mark best model
        if comparison:
            comparison[0]['status'] = "Best"
        
        return {
            "model_comparison": comparison,
            "total_states": len(available_states),
            "trained_states": training_results['summary']['successful_states']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model comparison failed: {str(e)}")

@app.get("/summary")
async def get_training_summary():
    """Get training summary"""
    try:
        if not training_results:
            raise HTTPException(status_code=400, detail="Models not trained. Call /train first.")
        
        summary = training_results['summary']
        
        return {
            "training_summary": summary,
            "available_states": available_states,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary retrieval failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_loaded": preprocessor is not None,
        "models_trained": training_results is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
