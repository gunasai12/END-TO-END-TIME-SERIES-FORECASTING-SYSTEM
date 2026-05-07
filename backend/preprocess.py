import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

class DataPreprocessor:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.data = None
        self.processed_data = None
        
    def load_data(self) -> pd.DataFrame:
        """Load and initial data cleaning"""
        try:
            self.data = pd.read_csv(self.file_path)
            
            # Clean column names
            self.data.columns = self.data.columns.str.strip()
            
            # Convert Total column to numeric (remove commas and spaces)
            if 'Total' in self.data.columns:
                self.data['Total'] = self.data['Total'].astype(str).str.replace(',', '').str.strip()
                self.data['Total'] = pd.to_numeric(self.data['Total'], errors='coerce')
            
            # Convert Date column
            if 'Date' in self.data.columns:
                self.data['Date'] = pd.to_datetime(self.data['Date'], format='%m/%d/%Y', errors='coerce')
            
            # Drop rows with missing critical values
            self.data = self.data.dropna(subset=['State', 'Date', 'Total'])
            
            print(f"Loaded {len(self.data)} records")
            print(f"Date range: {self.data['Date'].min()} to {self.data['Date'].max()}")
            print(f"States: {self.data['State'].nunique()}")
            
            return self.data
            
        except Exception as e:
            print(f"Error loading data: {e}")
            raise
    
    def handle_missing_dates(self) -> pd.DataFrame:
        """Fill missing dates for each state"""
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")
        
        # Get unique states and date range
        states = self.data['State'].unique()
        min_date = self.data['Date'].min()
        max_date = self.data['Date'].max()
        
        # Create complete date range
        all_dates = pd.date_range(start=min_date, end=max_date, freq='D')
        
        # Create complete dataframe with all combinations
        complete_data = []
        
        for state in states:
            state_data = self.data[self.data['State'] == state].copy()
            
            # Create complete date range for this state
            state_df = pd.DataFrame({
                'Date': all_dates,
                'State': state
            })
            
            # Merge with actual data
            state_df = state_df.merge(state_data, on=['State', 'Date'], how='left')
            
            # Forward fill missing values (assuming sales are similar to previous day)
            if 'Total' in state_df.columns:
                state_df['Total'] = state_df['Total'].fillna(method='ffill').fillna(method='bfill')
            
            # Fill category if missing
            if 'Category' in state_df.columns:
                state_df['Category'] = state_df['Category'].fillna(state_df['Category'].mode().iloc[0] if not state_df['Category'].mode().empty else 'Unknown')
            
            complete_data.append(state_df)
        
        self.processed_data = pd.concat(complete_data, ignore_index=True)
        
        # Sort by state and date
        self.processed_data = self.processed_data.sort_values(['State', 'Date']).reset_index(drop=True)
        
        print(f"After handling missing dates: {len(self.processed_data)} records")
        
        return self.processed_data
    
    def validate_data(self) -> Dict:
        """Validate data quality"""
        if self.processed_data is None:
            raise ValueError("Data not processed. Call handle_missing_dates() first.")
        
        validation_results = {
            'total_records': len(self.processed_data),
            'unique_states': self.processed_data['State'].nunique(),
            'date_range': {
                'start': self.processed_data['Date'].min(),
                'end': self.processed_data['Date'].max()
            },
            'missing_values': self.processed_data.isnull().sum().to_dict(),
            'negative_sales': (self.processed_data['Total'] < 0).sum(),
            'zero_sales': (self.processed_data['Total'] == 0).sum()
        }
        
        return validation_results
    
    def get_state_data(self, state: str) -> pd.DataFrame:
        """Get data for a specific state"""
        if self.processed_data is None:
            raise ValueError("Data not processed. Call handle_missing_dates() first.")
        
        state_data = self.processed_data[self.processed_data['State'] == state].copy()
        return state_data.sort_values('Date').reset_index(drop=True)
    
    def get_all_states(self) -> List[str]:
        """Get list of all states"""
        if self.processed_data is None:
            raise ValueError("Data not processed. Call handle_missing_dates() first.")
        
        return sorted(self.processed_data['State'].unique().tolist())
    
    def save_processed_data(self, output_path: str):
        """Save processed data to CSV"""
        if self.processed_data is None:
            raise ValueError("Data not processed. Call handle_missing_dates() first.")
        
        self.processed_data.to_csv(output_path, index=False)
        print(f"Processed data saved to {output_path}")

if __name__ == "__main__":
    # Example usage
    preprocessor = DataPreprocessor("../data/Forecasting Case- Study.xlsx - Sheet1.csv")
    preprocessor.load_data()
    preprocessor.handle_missing_dates()
    
    # Validate data
    validation = preprocessor.validate_data()
    print("\nData Validation Results:")
    for key, value in validation.items():
        print(f"{key}: {value}")
    
    # Save processed data
    preprocessor.save_processed_data("../data/processed_sales_data.csv")
