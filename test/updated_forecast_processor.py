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

    def get_raw_forecast_table(self) -> List[Dict]:
        """
        Get raw forecast data for table display (without capacity gap calculations)
        Returns data in format suitable for the 4-Week Volume & Weight Forecast table
        """
        results = []

        for _, row in self.df.iterrows():
            # Extract client name for sub-identifier
            name = str(row['client_full']) if pd.notna(row['client_full']) else 'Unknown'

            # Create masked IDs
            masked_id = f"{name[0]}***{name[-1]}" if len(name) > 2 else name
            sub_id = f"{name[:1]}***." if len(name) > 3 else name

            results.append({
                'entity_id': row['Entity_ID'],
                'client_full': name,
                'client_id': masked_id.upper(),
                'client_sub_id': sub_id.upper(),
                'dest': str(row['destination']) if pd.notna(row['destination']) else 'N/A',
                'category': str(row.get('Category', 'Uncategorized')),
                'w1': {
                    'v': int(row['Week +1_Vol']) if pd.notna(row['Week +1_Vol']) else 0,
                    'w': round(float(row['Week +1_Wt']), 2) if pd.notna(row['Week +1_Wt']) else 0.0
                },
                'w2': {
                    'v': int(row['Week +2_Vol']) if pd.notna(row['Week +2_Vol']) else 0,
                    'w': round(float(row['Week +2_Wt']), 2) if pd.notna(row['Week +2_Wt']) else 0.0
                },
                'w3': {
                    'v': int(row['Week +3_Vol']) if pd.notna(row['Week +3_Vol']) else 0,
                    'w': round(float(row['Week +3_Wt']), 2) if pd.notna(row['Week +3_Wt']) else 0.0
                },
                'w4': {
                    'v': int(row['Week +4_Vol']) if pd.notna(row['Week +4_Vol']) else 0,
                    'w': round(float(row['Week +4_Wt']), 2) if pd.notna(row['Week +4_Wt']) else 0.0
                },
                'total_4wk_vol': round(row['total_4wk_vol'], 1),
                'total_4wk_wt': round(row['total_4wk_wt'], 2),
            })

        # Sort by total volume descending (most important customers first)
        results.sort(key=lambda x: x['total_4wk_vol'], reverse=True)
        return results

    def get_chart_aggregates(self) -> Dict:
        """
        Get aggregated data for the overall trend chart
        Returns weekly totals across all entities
        """
        return {
            'w1': {
                'volume': int(self.df['Week +1_Vol'].sum()),
                'weight': round(float(self.df['Week +1_Wt'].sum()), 2)
            },
            'w2': {
                'volume': int(self.df['Week +2_Vol'].sum()),
                'weight': round(float(self.df['Week +2_Wt'].sum()), 2)
            },
            'w3': {
                'volume': int(self.df['Week +3_Vol'].sum()),
                'weight': round(float(self.df['Week +3_Wt'].sum()), 2)
            },
            'w4': {
                'volume': int(self.df['Week +4_Vol'].sum()),
                'weight': round(float(self.df['Week +4_Wt'].sum()), 2)
            }
        }

    def get_forecast_analysis(self) -> List[Dict]:
        """Generate capacity gap analysis for each entity"""
        results = []

        for _, row in self.df.iterrows():
            # Simulate AI prediction (W+1)
            ai_pred = row['Week +1_Vol']

            # Simulate allocated capacity (80% of prediction as baseline)
            allocated_cap = ai_pred * 0.8

            # Calculate gap
            gap = max(0, ai_pred - allocated_cap)

            # Calculate health score based on forecast trend
            w1, w2, w3, w4 = row['Week +1_Vol'], row['Week +2_Vol'], row['Week +3_Vol'], row['Week +4_Vol']
            trend = (w4 - w1) / max(w1, 1) if w1 > 0 else 0

            # Health score: 0-100, higher is better
            if trend > 0.1:
                health_score = 85 + min(15, trend * 50)  # Growing
            elif trend > -0.1:
                health_score = 70 + np.random.randint(10, 20)  # Stable
            else:
                health_score = max(40, 60 + trend * 100)  # Declining

            results.append({
                'entity_id': row['Entity_ID'],
                'client_id': row['client_id'],
                'client_full': row['client_full'],
                'destination': row['destination'],
                'category': row['Category'],
                'ai_pred_w1': round(ai_pred, 1),
                'ai_pred_w2': round(row['Week +2_Vol'], 1),
                'ai_pred_w3': round(row['Week +3_Vol'], 1),
                'ai_pred_w4': round(row['Week +4_Vol'], 1),
                'allocated_cap': round(allocated_cap, 1),
                'gap': round(gap, 1),
                'health_score': round(health_score),
                'total_4wk_vol': round(row['total_4wk_vol'], 1),
                'total_4wk_wt': round(row['total_4wk_wt'], 2),
            })

        # Sort by gap descending
        results.sort(key=lambda x: x['gap'], reverse=True)
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
