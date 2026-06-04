import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging
import os

logger = logging.getLogger(__name__)


class ForecastProcessor:
    def __init__(self, csv_path: str):
        self.df = pd.read_csv(csv_path, encoding='utf-8-sig')
        self.id_mapping, self.desc_mapping = self._load_category_mapping()
        # Get all available fake_mapping values for random assignment
        self.all_fake_mappings = list(set(self.id_mapping.values()))
        # Cache for random assignments to ensure consistency
        self.random_assignment_cache = {}
        self._process_data()

    def _load_category_mapping(self) -> tuple[Dict[int, str], Dict[str, str]]:
        """
        Load category mappings from CSV
        Returns: (id_mapping, description_mapping)
        - id_mapping: L1_Category_ID -> fake_mapping
        - description_mapping: Product description -> fake_mapping
        """
        try:
            # Try to find the mapping CSV file
            possible_paths = [
                os.path.join(os.path.dirname(__file__), '..', 'data', '3PL_L1_Category_Mapping.csv'),
                os.path.join(os.getcwd(), 'data', '3PL_L1_Category_Mapping.csv'),
                os.path.join(os.getcwd(), '..', 'data', '3PL_L1_Category_Mapping.csv'),
            ]

            mapping_path = None
            for path in possible_paths:
                normalized = os.path.normpath(path)
                if os.path.exists(normalized):
                    mapping_path = normalized
                    break

            if not mapping_path:
                logger.warning("Category mapping file not found, using default category names")
                return {}, {}

            # Read mapping CSV
            mapping_df = pd.read_csv(mapping_path, encoding='utf-8-sig')

            # Debug: print actual columns
            logger.info(f"CSV columns: {list(mapping_df.columns)}")
            logger.info(f"CSV shape: {mapping_df.shape}")
            logger.info(f"First row sample:\n{mapping_df.head(1).to_dict('records')}")

            # Create two mappings:
            # 1. ID-based: L1_Category_ID -> fake_mapping (for "L1大类X_xxx" format)
            # 2. Description-based: Product description -> fake_mapping (for matching Top_Descriptions)
            id_mapping = {}
            desc_mapping = {}

            for idx, row in mapping_df.iterrows():
                try:
                    cat_id = int(row['L1_Category_ID'])
                    fake_name = str(row['fake_mapping']).strip()
                    top_descriptions = str(row.get('Top_Descriptions', '')).strip()

                    if fake_name and fake_name not in ['nan', '', 'None']:
                        # ID-based mapping
                        id_mapping[cat_id] = fake_name

                        # Description-based mapping - split by " / " and map each description
                        if top_descriptions and top_descriptions != 'nan':
                            descriptions = [d.strip() for d in top_descriptions.split('/')]
                            for desc in descriptions:
                                if desc:
                                    desc_mapping[desc.upper()] = fake_name
                                    # Also map with "类" suffix
                                    desc_mapping[desc.upper() + '类'] = fake_name

                except (KeyError, ValueError, IndexError) as e:
                    logger.warning(f"Error processing mapping row {idx}: {e}")
                    continue

            logger.info(f"Loaded {len(id_mapping)} ID mappings and {len(desc_mapping)} description mappings")
            return id_mapping, desc_mapping

        except Exception as e:
            logger.error(f"Error loading category mapping: {e}")
            return {}, {}

    def _process_data(self):
        """Process the forecast CSV data"""
        # Clean column names
        self.df.columns = [c.strip().replace('﻿', '') for c in self.df.columns]

        # Extract client name from Entity_ID (format: "Client_Destination_ID")
        self.df['client_full'] = self.df['Entity_ID'].str.extract(r'^([^_]+(?:_[^_]+)*)_')
        self.df['destination'] = self.df['Entity_ID'].str.extract(r'_([A-Z]{2})_')

        # Debug: Show sample of available columns and Category values
        logger.info(f"Forecast CSV columns: {list(self.df.columns)}")
        if 'Category' in self.df.columns:
            unique_categories = self.df['Category'].unique()
            logger.info(f"Found {len(unique_categories)} unique categories in forecast data")
            logger.info(f"Sample categories: {list(unique_categories[:10])}")
        else:
            logger.warning("No 'Category' column found in forecast CSV!")

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

    def _get_category_name(self, original_category: str) -> str:
        """
        Get fake category name from mapping with guaranteed assignment
        Handles three formats:
        1. "L1大类X_长尾杂项" (L2 category) -> use ID mapping
        2. "PRODUCT NAME类" (L1 category) -> use description mapping
        3. "PRODUCT NAME" (L1 category) -> use description mapping

        If no match found, randomly assign to a fake_mapping (consistent for same category)
        """
        import re

        if pd.isna(original_category):
            # Random assignment for uncategorized
            if "Uncategorized" not in self.random_assignment_cache:
                self.random_assignment_cache["Uncategorized"] = self._get_random_fake_mapping("Uncategorized")
            return self.random_assignment_cache["Uncategorized"]

        original_category = str(original_category).strip()

        # Pattern 1: "L1大类X_xxx" format - extract ID (L2 category)
        match = re.match(r'L1大类(\d+)_', original_category)
        if match:
            cat_id = int(match.group(1))
            if cat_id in self.id_mapping:
                return self.id_mapping[cat_id]
            # L2 category but ID not in mapping - use random assignment
            if original_category not in self.random_assignment_cache:
                self.random_assignment_cache[original_category] = self._get_random_fake_mapping(original_category)
            return self.random_assignment_cache[original_category]

        # Pattern 2 & 3: Try description mapping (L1 category)
        # Try exact match first (case-insensitive)
        upper_cat = original_category.upper()
        if upper_cat in self.desc_mapping:
            return self.desc_mapping[upper_cat]

        # Try without "类" suffix
        if upper_cat.endswith('类'):
            base_name = upper_cat[:-1]  # Remove last character
            if base_name in self.desc_mapping:
                return self.desc_mapping[base_name]

        # If not found in mapping, randomly assign to a fake_mapping
        # Use cache to ensure consistency
        if original_category not in self.random_assignment_cache:
            self.random_assignment_cache[original_category] = self._get_random_fake_mapping(original_category)
            logger.info(f"Random assignment: '{original_category}' -> '{self.random_assignment_cache[original_category]}'")

        return self.random_assignment_cache[original_category]

    def _get_random_fake_mapping(self, category_key: str) -> str:
        """
        Get a consistent random fake_mapping for a given category
        Uses hash to ensure same category always gets same assignment
        """
        if not self.all_fake_mappings:
            return "Uncategorized"

        # Use hash for deterministic "random" assignment
        hash_value = hash(category_key)
        index = hash_value % len(self.all_fake_mappings)
        return self.all_fake_mappings[index]

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

            # Get category name from mapping
            # Use the Category column from the forecast CSV
            original_category = row.get('Category', '')
            category_name = self._get_category_name(original_category)

            results.append({
                'entity_id': row['Entity_ID'],
                'client_full': name,
                'client_id': masked_id.upper(),
                'client_sub_id': sub_id.upper(),
                'dest': str(row['destination']) if pd.notna(row['destination']) else 'N/A',
                'category': category_name,  # Use mapped name
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

            # Get category name from mapping
            original_category = row.get('Category', '')
            category_name = self._get_category_name(original_category)

            results.append({
                'entity_id': row['Entity_ID'],
                'client_id': row['client_id'],
                'client_full': row['client_full'],
                'destination': row['destination'],
                'category': category_name,  # Use mapped name
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
        """
        Generate model performance metrics based on WAPE table
        Returns WAPE by volume tier (matching the image)
        """
        return {
            'long_tail_wape': 35.26,   # 1-5 orders (Long-tail)
            'mid_tier_wape': 24.42,    # 6-20 orders (Mid-tier)
            'head_wape': 17.23,        # 21-50 orders (Head)
            'core_wape': 18.99,        # 50+ orders (Core)
        }


# Global instance - initialize with your CSV path
forecast_processor = None


def init_forecast_processor(csv_path: str):
    global forecast_processor
    forecast_processor = ForecastProcessor(csv_path)
    return forecast_processor
