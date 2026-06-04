import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class ForecastProcessor:
    def __init__(self, csv_path: str):
        self.df = pd.read_csv(csv_path, encoding='utf-8-sig')
        self._process_data()

    def _process_data(self):
        """Process the forecast CSV data"""
        # Clean column names
        self.df.columns = [c.strip().replace('﻿', '') for c in self.df.columns]

        # Extract client name from Entity_ID (format: "Client_Destination_ID")
        self.df['client_full'] = self.df['Entity_ID'].str.extract(r'^([^_]+(?:_[^_]+)*)_')
        self.df['destination'] = self.df['Entity_ID'].str.extract(r'_([A-Z]{2})_')

        # Calculate 4-week totals
        self.df['total_4wk_vol'] = (
                self.df['Week +1_Vol'] +
                self.df['Week +2_Vol'] +
                self.df['Week +3_Vol'] +
                self.df['Week +4_Vol']
        )
        self.df['total_4wk_wt'] = (
                self.df['Week +1_Wt'] +
                self.df['Week +2_Wt'] +
                self.df['Week +3_Wt'] +
                self.df['Week +4_Wt']
        )

        # Mask client names (first 1 letter + *** + last 1 letter)
        self.df['client_id'] = self.df['client_full'].apply(
            lambda x: f"{str(x)[0]}***{str(x)[-1]}" if pd.notna(x) and len(str(x)) > 2 else str(x)
        )

        logger.info(f"Loaded {len(self.df)} forecast records")

    def get_forecast_analysis(self) -> List[Dict]:
        """Generate forecast data with all 4 weeks in frontend format"""
        results = []

        for _, row in self.df.iterrows():
            # 提取客户全名用于mask
            client_full = row['client_full']

            results.append({
                'entity_id': row['Entity_ID'],
                'client_full': client_full,
                'dest': row['destination'],
                'category': row['Category'],
                # Week data as objects matching frontend format
                'w1': {
                    'v': round(row['Week +1_Vol'], 1),
                    'w': round(row['Week +1_Wt'], 2)
                },
                'w2': {
                    'v': round(row['Week +2_Vol'], 1),
                    'w': round(row['Week +2_Wt'], 2)
                },
                'w3': {
                    'v': round(row['Week +3_Vol'], 1),
                    'w': round(row['Week +3_Wt'], 2)
                },
                'w4': {
                    'v': round(row['Week +4_Vol'], 1),
                    'w': round(row['Week +4_Wt'], 2)
                },
                # 保留原始字段兼容性
                'ai_pred_w1': round(row['Week +1_Vol'], 1),
                'ai_pred_w2': round(row['Week +2_Vol'], 1),
                'ai_pred_w3': round(row['Week +3_Vol'], 1),
                'ai_pred_w4': round(row['Week +4_Vol'], 1),
                'total_4wk_vol': round(row['total_4wk_vol'], 1),
                'total_4wk_wt': round(row['total_4wk_wt'], 2),
            })

        return results

    def get_performance_metrics(self) -> Dict:
        """Generate model performance metrics based on WAPE table"""
        # Simulated performance data matching your provided table
        return {
            'overall_wape': 24.42,  # Weighted average
            'long_tail_wape': 35.26,  # 1-5 orders
            'mid_tier_wape': 24.42,  # 6-20 orders
            'head_wape': 17.23,  # 21-50 orders
            'core_wape': 18.99,  # 50+ orders
            'monthly_error': 10.3,
            'sample_entity': {
                'merchant': 'Shipany Limited',
                'destination': 'TH',
                'category': 'MAT (ID: 484)',
                'avg_weight': 0.248
            }
        }


# Global instance - initialize with your CSV path
forecast_processor = None


def init_forecast_processor(csv_path: str):
    global forecast_processor
    forecast_processor = ForecastProcessor(csv_path)
    return forecast_processor