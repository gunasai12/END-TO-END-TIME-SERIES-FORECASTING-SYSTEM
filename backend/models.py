import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

# Statistical models
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.seasonal import seasonal_decompose

# Machine Learning models
from prophet import Prophet
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Deep Learning
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

# Utilities
import joblib
import os
from datetime import datetime, timedelta

class ForecastingModels:
    def __init__(self, model_save_path: str = "saved_models"):
        self.model_save_path = model_save_path
        self.models = {}
        self.metrics = {}
        self.best_model = None
        self.best_model_name = None
        
        # Create save directory if it doesn't exist
        os.makedirs(model_save_path, exist_ok=True)
    
    def calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate evaluation metrics"""
        # Remove any NaN or infinite values
        mask = np.isfinite(y_true) & np.isfinite(y_pred)
        y_true_clean = y_true[mask]
        y_pred_clean = y_pred[mask]
        
        rmse = np.sqrt(mean_squared_error(y_true_clean, y_pred_clean))
        mae = mean_absolute_error(y_true_clean, y_pred_clean)
        
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y_true_clean - y_pred_clean) / (y_true_clean + 1e-8))) * 100
        
        return {
            'RMSE': rmse,
            'MAE': mae,
            'MAPE': mape
        }
    
    def train_sarima(self, train_data: pd.Series, test_data: pd.Series, 
                    order: Tuple = (1, 1, 1), seasonal_order: Tuple = (1, 1, 1, 7)) -> Dict[str, Any]:
        """Train SARIMA model"""
        try:
            print("Training SARIMA model...")
            
            # Fit SARIMA model
            model = SARIMAX(train_data, order=order, seasonal_order=seasonal_order)
            model_fit = model.fit(disp=False)
            
            # Make predictions
            predictions = model_fit.forecast(steps=len(test_data))
            
            # Calculate metrics
            metrics = self.calculate_metrics(test_data.values, predictions.values)
            
            # Store model and metrics
            self.models['SARIMA'] = model_fit
            self.metrics['SARIMA'] = metrics
            
            # Save model
            joblib.dump(model_fit, os.path.join(self.model_save_path, 'sarima_model.pkl'))
            
            print(f"SARIMA trained successfully. RMSE: {metrics['RMSE']:.2f}")
            
            return {
                'model': model_fit,
                'predictions': predictions,
                'metrics': metrics
            }
            
        except Exception as e:
            print(f"Error training SARIMA: {e}")
            return None
    
    def train_prophet(self, train_data: pd.DataFrame, test_data: pd.DataFrame) -> Dict[str, Any]:
        """Train Facebook Prophet model"""
        try:
            print("Training Prophet model...")
            
            # Prepare data for Prophet
            prophet_train = train_data[['Date', 'Total']].rename(columns={'Date': 'ds', 'Total': 'y'})
            prophet_test = test_data[['Date', 'Total']].rename(columns={'Date': 'ds', 'Total': 'y'})
            
            # Initialize and fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0
            )
            
            model.fit(prophet_train)
            
            # Make predictions
            future = model.make_future_dataframe(periods=len(test_data), freq='D')
            forecast = model.predict(future)
            
            # Extract predictions for test period
            predictions = forecast.tail(len(test_data))['yhat'].values
            
            # Calculate metrics
            metrics = self.calculate_metrics(test_data['Total'].values, predictions)
            
            # Store model and metrics
            self.models['Prophet'] = model
            self.metrics['Prophet'] = metrics
            
            # Save model
            joblib.dump(model, os.path.join(self.model_save_path, 'prophet_model.pkl'))
            
            print(f"Prophet trained successfully. RMSE: {metrics['RMSE']:.2f}")
            
            return {
                'model': model,
                'predictions': predictions,
                'metrics': metrics,
                'forecast': forecast
            }
            
        except Exception as e:
            print(f"Error training Prophet: {e}")
            return None
    
    def train_xgboost(self, train_data: pd.DataFrame, test_data: pd.DataFrame, 
                     feature_cols: List[str]) -> Dict[str, Any]:
        """Train XGBoost model"""
        try:
            print("Training XGBoost model...")
            
            # Prepare training and testing data
            X_train = train_data[feature_cols]
            y_train = train_data['Total']
            X_test = test_data[feature_cols]
            y_test = test_data['Total']
            
            # Initialize and train XGBoost
            model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            
            model.fit(X_train, y_train)
            
            # Make predictions
            predictions = model.predict(X_test)
            
            # Calculate metrics
            metrics = self.calculate_metrics(y_test.values, predictions)
            
            # Store model and metrics
            self.models['XGBoost'] = model
            self.metrics['XGBoost'] = metrics
            
            # Save model
            joblib.dump(model, os.path.join(self.model_save_path, 'xgboost_model.pkl'))
            
            print(f"XGBoost trained successfully. RMSE: {metrics['RMSE']:.2f}")
            
            return {
                'model': model,
                'predictions': predictions,
                'metrics': metrics
            }
            
        except Exception as e:
            print(f"Error training XGBoost: {e}")
            return None
    
    def train_lstm(self, X_train: np.ndarray, y_train: np.ndarray, 
                  X_test: np.ndarray, y_test: np.ndarray, target_scaler: Any = None) -> Dict[str, Any]:
        """Train LSTM model"""
        try:
            print("Training LSTM model...")
            
            # Build LSTM model
            model = Sequential([
                LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
                Dropout(0.2),
                LSTM(50, return_sequences=False),
                Dropout(0.2),
                Dense(25),
                Dense(1)
            ])
            
            # Compile model
            model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')
            
            # Early stopping
            early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
            
            # Train model
            history = model.fit(
                X_train, y_train,
                epochs=100,
                batch_size=32,
                validation_data=(X_test, y_test),
                callbacks=[early_stopping],
                verbose=0
            )
            
            # Make predictions
            predictions = model.predict(X_test).flatten()
            
            # Inverse transform if scaler is provided
            if target_scaler is not None:
                # Reshape for scaler (n_samples, 1)
                predictions = target_scaler.inverse_transform(predictions.reshape(-1, 1)).flatten()
                y_test = target_scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
                
                # Save the scaler for inference
                joblib.dump(target_scaler, os.path.join(self.model_save_path, 'lstm_target_scaler.pkl'))
            
            # Calculate metrics
            metrics = self.calculate_metrics(y_test, predictions)
            
            # Store model and metrics
            self.models['LSTM'] = model
            self.metrics['LSTM'] = metrics
            
            # Save model
            model.save(os.path.join(self.model_save_path, 'lstm_model.h5'))
            
            print(f"LSTM trained successfully. RMSE: {metrics['RMSE']:.2f}")
            
            return {
                'model': model,
                'predictions': predictions,
                'metrics': metrics,
                'history': history
            }
            
        except Exception as e:
            print(f"Error training LSTM: {e}")
            return None
    
    def find_best_model(self) -> Tuple[str, Dict[str, float]]:
        """Find the best model based on RMSE"""
        if not self.metrics:
            return None, None
        
        # Find model with lowest RMSE
        best_model_name = min(self.metrics.keys(), key=lambda x: self.metrics[x]['RMSE'])
        best_metrics = self.metrics[best_model_name]
        
        self.best_model_name = best_model_name
        self.best_model = self.models[best_model_name]
        
        print(f"Best model: {best_model_name} with RMSE: {best_metrics['RMSE']:.2f}")
        
        return best_model_name, best_metrics
    
    def generate_forecast(self, model_name: str, data: pd.DataFrame, 
                         forecast_days: int = 56, feature_cols: List[str] = None, target_scaler: Any = None) -> Dict[str, Any]:
        """Generate forecast using specified model"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.models.keys())}")
        
        model = self.models[model_name]
        
        if model_name == 'SARIMA':
            # SARIMA forecast
            forecast = model.forecast(steps=forecast_days)
            forecast_dates = pd.date_range(start=data['Date'].iloc[-1] + timedelta(days=1), 
                                        periods=forecast_days, freq='D')
            
            return {
                'dates': forecast_dates,
                'forecast': forecast.values,
                'model_name': model_name
            }
        
        elif model_name == 'Prophet':
            # Prophet forecast
            future = model.make_future_dataframe(periods=forecast_days, freq='D')
            forecast = model.predict(future)
            
            # Get only the future part
            future_forecast = forecast.tail(forecast_days)
            
            return {
                'dates': future_forecast['ds'],
                'forecast': future_forecast['yhat'].values,
                'model_name': model_name,
                'lower_bound': future_forecast['yhat_lower'].values,
                'upper_bound': future_forecast['yhat_upper'].values
            }
        
        elif model_name == 'XGBoost':
            # XGBoost forecast (requires feature engineering for future dates)
            if feature_cols is None:
                raise ValueError("Feature columns required for XGBoost forecasting")
            
            # This is a simplified version - in practice, you'd need to 
            # properly engineer features for future dates
            last_values = data[feature_cols].iloc[-1:].values
            forecast = []
            
            for _ in range(forecast_days):
                pred = model.predict(last_values)[0]
                forecast.append(pred)
                # Update features for next prediction (simplified)
                last_values = np.roll(last_values, 1, axis=1)
                last_values[0, 0] = pred
            
            forecast_dates = pd.date_range(start=data['Date'].iloc[-1] + timedelta(days=1), 
                                        periods=forecast_days, freq='D')
            
            return {
                'dates': forecast_dates,
                'forecast': np.array(forecast),
                'model_name': model_name
            }
        
        elif model_name == 'LSTM':
            # LSTM forecast (requires sequence preparation)
            # This is simplified - you'd need proper sequence preparation
            forecast_dates = pd.date_range(start=data['Date'].iloc[-1] + timedelta(days=1), 
                                        periods=forecast_days, freq='D')
            
            # Placeholder - actual implementation would require proper sequence handling
            last_sequence = np.random.randn(1, 30, len(feature_cols) if feature_cols else 10)
            forecast = []
            
            for _ in range(forecast_days):
                pred = model.predict(last_sequence)[0, 0]
                forecast.append(pred)
                last_sequence = np.roll(last_sequence, 1, axis=1)
                last_sequence[0, -1, 0] = pred
                
            forecast_array = np.array(forecast)
            
            # Inverse transform
            if target_scaler is None:
                # Try to load it
                scaler_path = os.path.join(self.model_save_path, 'lstm_target_scaler.pkl')
                if os.path.exists(scaler_path):
                    target_scaler = joblib.load(scaler_path)
            
            if target_scaler is not None:
                forecast_array = target_scaler.inverse_transform(forecast_array.reshape(-1, 1)).flatten()
            
            return {
                'dates': forecast_dates,
                'forecast': forecast_array,
                'model_name': model_name
            }
    
    def get_model_comparison(self) -> pd.DataFrame:
        """Get model comparison table"""
        if not self.metrics:
            return pd.DataFrame()
        
        comparison_df = pd.DataFrame(self.metrics).T
        comparison_df = comparison_df.sort_values('RMSE')
        comparison_df['Status'] = 'Trained'
        
        # Highlight best model
        if self.best_model_name:
            comparison_df.loc[comparison_df.index == self.best_model_name, 'Status'] = 'Best'
        
        return comparison_df
    
    def save_best_model_info(self):
        """Save information about the best model"""
        if self.best_model_name:
            best_model_info = {
                'model_name': self.best_model_name,
                'metrics': self.metrics[self.best_model_name],
                'timestamp': datetime.now().isoformat()
            }
            
            joblib.dump(best_model_info, os.path.join(self.model_save_path, 'best_model_info.pkl'))
    
    def load_model(self, model_name: str) -> Any:
        """Load a saved model"""
        try:
            if model_name == 'LSTM':
                model = tf.keras.models.load_model(os.path.join(self.model_save_path, 'lstm_model.h5'))
            else:
                model = joblib.load(os.path.join(self.model_save_path, f'{model_name.lower()}_model.pkl'))
            
            self.models[model_name] = model
            return model
            
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            return None

if __name__ == "__main__":
    # Example usage
    print("Forecasting models module loaded successfully!")
