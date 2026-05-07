import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple
import holidays
from sklearn.preprocessing import MinMaxScaler

class FeatureEngineer:
    def __init__(self):
        self.scalers = {}
        self.us_holidays = holidays.US()
        
    def create_lag_features(self, df: pd.DataFrame, target_col: str = 'Total') -> pd.DataFrame:
        """Create lag features for time series"""
        df = df.copy()
        
        # Sort by date to ensure correct lag calculation
        df = df.sort_values('Date')
        
        # Create lag features
        lag_periods = [1, 7, 30]  # 1 day, 1 week, 1 month
        
        for lag in lag_periods:
            df[f'lag_{lag}'] = df[target_col].shift(lag)
        
        return df
    
    def create_rolling_features(self, df: pd.DataFrame, target_col: str = 'Total', windows: List[int] = [7]) -> pd.DataFrame:
        """Create rolling statistical features"""
        df = df.copy()
        
        # Sort by date
        df = df.sort_values('Date')
        
        for window in windows:
            df[f'rolling_mean_{window}'] = df[target_col].rolling(window=window).mean()
            df[f'rolling_std_{window}'] = df[target_col].rolling(window=window).std()
            df[f'rolling_min_{window}'] = df[target_col].rolling(window=window).min()
            df[f'rolling_max_{window}'] = df[target_col].rolling(window=window).max()
        
        return df
    
    def create_date_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create date-based features"""
        df = df.copy()
        
        # Ensure Date is datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Basic date features
        df['day_of_week'] = df['Date'].dt.dayofweek  # Monday=0, Sunday=6
        df['day_of_month'] = df['Date'].dt.day
        df['week_of_year'] = df['Date'].dt.isocalendar().week
        df['month'] = df['Date'].dt.month
        df['quarter'] = df['Date'].dt.quarter
        df['year'] = df['Date'].dt.year
        df['day_of_year'] = df['Date'].dt.dayofyear
        
        # Cyclical features for better seasonality capture
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['day_of_year_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
        df['day_of_year_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
        
        # Weekend indicator
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        return df
    
    def create_holiday_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create holiday-related features"""
        df = df.copy()
        
        # Ensure Date is datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Check if date is a holiday
        df['is_holiday'] = df['Date'].apply(lambda x: int(x in self.us_holidays))
        
        # Days to next holiday
        holiday_dates = list(self.us_holidays.keys())
        holiday_dates = [pd.Timestamp(date) for date in holiday_dates]
        
        def days_to_next_holiday(date):
            future_holidays = [h for h in holiday_dates if h > date]
            if future_holidays:
                return (min(future_holidays) - date).days
            else:
                return 999  # Large number if no future holiday
        
        df['days_to_next_holiday'] = df['Date'].apply(days_to_next_holiday)
        
        # Days since last holiday
        def days_since_last_holiday(date):
            past_holidays = [h for h in holiday_dates if h <= date]
            if past_holidays:
                return (date - max(past_holidays)).days
            else:
                return 999  # Large number if no past holiday
        
        df['days_since_last_holiday'] = df['Date'].apply(days_since_last_holiday)
        
        return df
    
    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features"""
        df = df.copy()
        
        # Interaction between lag features and rolling features
        if 'lag_1' in df.columns and 'rolling_mean_7' in df.columns:
            df['lag_1_rolling_mean_7_ratio'] = df['lag_1'] / (df['rolling_mean_7'] + 1e-8)
        
        # Weekend and holiday interaction
        if 'is_weekend' in df.columns and 'is_holiday' in df.columns:
            df['is_weekend_or_holiday'] = ((df['is_weekend'] == 1) | (df['is_holiday'] == 1)).astype(int)
        
        return df
    
    def engineer_features(self, df: pd.DataFrame, target_col: str = 'Total') -> pd.DataFrame:
        """Main feature engineering pipeline"""
        df = df.copy()
        
        # Create all feature types
        df = self.create_lag_features(df, target_col)
        df = self.create_rolling_features(df, target_col)
        df = self.create_date_features(df)
        df = self.create_holiday_features(df)
        df = self.create_interaction_features(df)
        
        # Drop rows with NaN values created by lag/rolling features
        df = df.dropna()
        
        print(f"Feature engineering completed. Features created: {len(df.columns)}")
        print(f"Final dataset shape: {df.shape}")
        
        return df
    
    def prepare_lstm_sequences(self, df: pd.DataFrame, target_col: str = 'Total', 
                            sequence_length: int = 30, feature_cols: List[str] = None) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare sequences for LSTM model"""
        if feature_cols is None:
            # Use all numeric columns except target and date
            feature_cols = [col for col in df.select_dtypes(include=[np.number]).columns 
                          if col != target_col]
        
        # Scale features and target separately
        feature_scaler = MinMaxScaler()
        target_scaler = MinMaxScaler()
        
        scaled_features = feature_scaler.fit_transform(df[feature_cols])
        scaled_target = target_scaler.fit_transform(df[[target_col]])
        
        # Store scalers for later use
        self.scalers['lstm_feature_scaler'] = feature_scaler
        self.scalers['lstm_target_scaler'] = target_scaler
        
        # Combine back for sequence creation
        scaled_data = np.hstack((scaled_features, scaled_target))
        
        # Create sequences
        X, y = [], []
        
        for i in range(sequence_length, len(scaled_data)):
            X.append(scaled_data[i-sequence_length:i, :-1])  # All features except target
            y.append(scaled_data[i, -1])  # Target value
        
        return np.array(X), np.array(y)
    
    def get_feature_columns(self, df: pd.DataFrame, exclude_cols: List[str] = None) -> List[str]:
        """Get list of feature columns for modeling"""
        if exclude_cols is None:
            exclude_cols = ['Date', 'State', 'Category', 'Total']
        
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        return feature_cols
    
    def create_future_features(self, last_date: pd.Timestamp, forecast_days: int = 56) -> pd.DataFrame:
        """Create feature template for future dates"""
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), 
                                   periods=forecast_days, freq='D')
        
        future_df = pd.DataFrame({'Date': future_dates})
        
        # Create date features for future dates
        future_df = self.create_date_features(future_df)
        future_df = self.create_holiday_features(future_df)
        
        return future_df

if __name__ == "__main__":
    # Example usage
    from preprocess import DataPreprocessor
    
    # Load and preprocess data
    preprocessor = DataPreprocessor("../data/Forecasting Case- Study.xlsx - Sheet1.csv")
    preprocessor.load_data()
    preprocessor.handle_missing_dates()
    
    # Get data for one state as example
    states = preprocessor.get_all_states()
    sample_state = states[0]
    state_data = preprocessor.get_state_data(sample_state)
    
    # Engineer features
    engineer = FeatureEngineer()
    featured_data = engineer.engineer_features(state_data)
    
    print(f"\nSample state: {sample_state}")
    print(f"Original data shape: {state_data.shape}")
    print(f"Featured data shape: {featured_data.shape}")
    print(f"Feature columns: {engineer.get_feature_columns(featured_data)}")
