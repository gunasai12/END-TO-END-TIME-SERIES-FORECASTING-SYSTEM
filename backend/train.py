import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict
import warnings
warnings.filterwarnings('ignore')

# Import custom modules
from preprocess import DataPreprocessor
from feature_engineering import FeatureEngineer
from models import ForecastingModels

class ModelTrainer:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.preprocessor = DataPreprocessor(data_path)
        self.feature_engineer = FeatureEngineer()
        self.forecasting_models = ForecastingModels()
        self.results = {}
        
    def prepare_data(self) -> Dict[str, pd.DataFrame]:
        """Prepare data for training"""
        print("=== Data Preparation ===")
        
        # Load and preprocess data
        self.preprocessor.load_data()
        self.preprocessor.handle_missing_dates()
        
        # Get all states
        states = self.preprocessor.get_all_states()
        print(f"Found {len(states)} states: {states[:5]}...")
        
        # Prepare data for each state
        state_data = {}
        
        for state in states:
            print(f"\nProcessing {state}...")
            
            # Get state data
            data = self.preprocessor.get_state_data(state)
            
            # Feature engineering
            featured_data = self.feature_engineer.engineer_features(data)
            
            # Time series split (80% train, 20% test)
            split_idx = int(len(featured_data) * 0.8)
            train_data = featured_data.iloc[:split_idx]
            test_data = featured_data.iloc[split_idx:]
            
            state_data[state] = {
                'original': data,
                'featured': featured_data,
                'train': train_data,
                'test': test_data
            }
            
            print(f"  Train size: {len(train_data)}, Test size: {len(test_data)}")
        
        self.state_data = state_data
        return state_data
    
    def train_models_for_state(self, state: str) -> Dict[str, any]:
        """Train all models for a specific state"""
        print(f"\n=== Training Models for {state} ===")
        
        data = self.state_data[state]
        train_data = data['train']
        test_data = data['test']
        
        # Get feature columns for ML models
        feature_cols = self.feature_engineer.get_feature_columns(train_data)
        
        results = {}
        
        # 1. Train SARIMA
        try:
            sarima_result = self.forecasting_models.train_sarima(
                train_data['Total'], 
                test_data['Total']
            )
            if sarima_result:
                results['SARIMA'] = sarima_result
        except Exception as e:
            print(f"SARIMA failed for {state}: {e}")
        
        # 2. Train Prophet
        try:
            prophet_result = self.forecasting_models.train_prophet(train_data, test_data)
            if prophet_result:
                results['Prophet'] = prophet_result
        except Exception as e:
            print(f"Prophet failed for {state}: {e}")
        
        # 3. Train XGBoost
        try:
            xgb_result = self.forecasting_models.train_xgboost(
                train_data, test_data, feature_cols
            )
            if xgb_result:
                results['XGBoost'] = xgb_result
        except Exception as e:
            print(f"XGBoost failed for {state}: {e}")
        
        # 4. Train LSTM
        try:
            # Prepare LSTM sequences
            X_train, y_train = self.feature_engineer.prepare_lstm_sequences(
                train_data, sequence_length=30, feature_cols=feature_cols
            )
            X_test, y_test = self.feature_engineer.prepare_lstm_sequences(
                test_data, sequence_length=30, feature_cols=feature_cols
            )
            
            if len(X_train) > 0 and len(X_test) > 0:
                target_scaler = self.feature_engineer.scalers['lstm_target_scaler']
                lstm_result = self.forecasting_models.train_lstm(X_train, y_train, X_test, y_test, target_scaler)
                if lstm_result:
                    results['LSTM'] = lstm_result
        except Exception as e:
            print(f"LSTM failed for {state}: {e}")
        
        # Find best model for this state
        best_model_name, best_metrics = self.forecasting_models.find_best_model()
        
        results['best_model'] = {
            'name': best_model_name,
            'metrics': best_metrics
        }
        
        print(f"Best model for {state}: {best_model_name} (RMSE: {best_metrics['RMSE']:.2f})")
        
        return results
    
    def train_all_states(self, max_states: int = None) -> Dict[str, Dict]:
        """Train models for all states"""
        print("=== Training Models for All States ===")
        
        states = list(self.state_data.keys())
        if max_states:
            states = states[:max_states]
        
        all_results = {}
        
        for i, state in enumerate(states):
            print(f"\n{'='*50}")
            print(f"Training state {i+1}/{len(states)}: {state}")
            print(f"{'='*50}")
            
            try:
                state_results = self.train_models_for_state(state)
                all_results[state] = state_results
                
                # Reset models for next state
                self.forecasting_models = ForecastingModels()
                
            except Exception as e:
                print(f"Failed to train models for {state}: {e}")
                all_results[state] = {'error': str(e)}
        
        self.results = all_results
        return all_results
    
    def generate_forecasts(self, forecast_days: int = 56) -> Dict[str, Dict]:
        """Generate forecasts for all states using their best models"""
        print(f"\n=== Generating {forecast_days}-day Forecasts ===")
        
        forecasts = {}
        
        for state, results in self.results.items():
            if 'error' in results:
                continue
            
            try:
                best_model_name = results['best_model']['name']
                data = self.state_data[state]['featured']
                
                # Load the best model for this state
                model_path = f"saved_models/{best_model_name.lower()}_model.pkl"
                if best_model_name == 'LSTM':
                    model_path = "saved_models/lstm_model.h5"
                
                # Create new model instance for this state
                state_models = ForecastingModels()
                loaded_model = state_models.load_model(best_model_name)
                
                if loaded_model:
                    # Generate forecast
                    feature_cols = self.feature_engineer.get_feature_columns(data)
                    # Get target_scaler if needed
                    kwargs = {}
                    if best_model_name == 'LSTM':
                        if 'lstm_target_scaler' in self.feature_engineer.scalers:
                            kwargs['target_scaler'] = self.feature_engineer.scalers['lstm_target_scaler']

                    forecast_result = state_models.generate_forecast(
                        best_model_name, data, forecast_days, feature_cols, **kwargs
                    )
                    
                    forecasts[state] = {
                        'forecast': forecast_result,
                        'best_model': best_model_name,
                        'metrics': results['best_model']['metrics']
                    }
                    
                    print(f"Generated forecast for {state} using {best_model_name}")
                
            except Exception as e:
                print(f"Failed to generate forecast for {state}: {e}")
        
        return forecasts
    
    def get_summary_statistics(self) -> Dict:
        """Get summary statistics across all states"""
        if not self.results:
            return {}
        
        summary = {
            'total_states': len(self.results),
            'successful_states': 0,
            'model_performance': {},
            'best_models_count': {}
        }
        
        all_rmse = []
        all_mae = []
        all_mape = []
        
        for state, results in self.results.items():
            if 'error' in results:
                continue
            
            summary['successful_states'] += 1
            
            if 'best_model' in results:
                metrics = results['best_model']['metrics']
                best_model_name = results['best_model']['name']
                
                all_rmse.append(metrics['RMSE'])
                all_mae.append(metrics['MAE'])
                all_mape.append(metrics['MAPE'])
                
                # Count best models
                if best_model_name not in summary['best_models_count']:
                    summary['best_models_count'][best_model_name] = 0
                summary['best_models_count'][best_model_name] += 1
        
        if all_rmse:
            summary['model_performance'] = {
                'avg_rmse': np.mean(all_rmse),
                'avg_mae': np.mean(all_mae),
                'avg_mape': np.mean(all_mape),
                'std_rmse': np.std(all_rmse),
                'min_rmse': np.min(all_rmse),
                'max_rmse': np.max(all_rmse)
            }
        
        return summary
    
    def save_results(self, output_path: str = "results"):
        """Save training results, removing heavy model objects for LFS compatibility"""
        import os
        import joblib
        import json
        
        os.makedirs(output_path, exist_ok=True)
        
        # Create a light version of the results without the actual model objects
        light_model_results = {}
        for state, state_data in self.results.items():
            if 'error' in state_data:
                light_model_results[state] = state_data
                continue
                
            light_state_data = {}
            for key, value in state_data.items():
                if key == 'best_model':
                    light_state_data[key] = value
                else:
                    # Strip the actual 'model' object if it exists
                    if isinstance(value, dict):
                        light_model_result = value.copy()
                        if 'model' in light_model_result:
                            del light_model_result['model']
                        light_state_data[key] = light_model_result
                    else:
                        light_state_data[key] = value
            light_model_results[state] = light_state_data

        # Save light results
        joblib.dump(light_model_results, os.path.join(output_path, "training_results.pkl"))
        
        # Save summary
        summary = self.get_summary_statistics()
        with open(os.path.join(output_path, "summary.json"), 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"Results saved to {output_path} (Model objects stripped for efficiency)")


def main():
    """Main training function"""
    print("Starting Time Series Forecasting Model Training")
    print("=" * 60)
    
    # Initialize trainer
    trainer = ModelTrainer("../data/Forecasting Case- Study.xlsx - Sheet1.csv")
    
    # Prepare data
    state_data = trainer.prepare_data()
    
    # Train models (limiting to first 5 states for demo)
    results = trainer.train_all_states(max_states=5)
    
    # Generate forecasts
    forecasts = trainer.generate_forecasts(forecast_days=56)
    
    # Get summary
    summary = trainer.get_summary_statistics()
    
    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    print(f"Total states processed: {summary.get('total_states', 0)}")
    print(f"Successful states: {summary.get('successful_states', 0)}")
    
    if 'model_performance' in summary:
        perf = summary['model_performance']
        print(f"Average RMSE: {perf['avg_rmse']:.2f}")
        print(f"Average MAE: {perf['avg_mae']:.2f}")
        print(f"Average MAPE: {perf['avg_mape']:.2f}%")
    
    if 'best_models_count' in summary:
        print("\nBest model distribution:")
        for model, count in summary['best_models_count'].items():
            print(f"  {model}: {count} states")
    
    # Save results
    trainer.save_results()
    
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    main()
