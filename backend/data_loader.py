import os
import re
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
import hashlib
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataLoader:
    def __init__(self):
        self.df: pd.DataFrame = pd.DataFrame()
        self._load_data()

    def _find_data_file(self) -> Optional[str]:
        """Find the first Excel file in the data directory"""
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

        if not os.path.exists(data_dir):
            logger.warning(f"Data directory not found: {data_dir}")
            return None

        for file in os.listdir(data_dir):
            if file.endswith(('.xlsx', '.xls')):
                return os.path.join(data_dir, file)

        return None

    def _load_data(self):
        """Load and process data from Excel file"""
        try:
            data_path = self._find_data_file()
            if not data_path:
                logger.warning("No data file found, using empty dataset")
                self.df = pd.DataFrame()
                return

            logger.info(f"Loading data from: {data_path}")
            raw_df = pd.read_excel(data_path)
            logger.info(f"Loaded {len(raw_df)} raw records")

            # Process data
            self.df = self._clean_and_mask(raw_df)

            logger.info(f"Processed {len(self.df)} records after cleaning")

        except Exception as e:
            logger.error(f"Error loading data: {e}")
            self.df = pd.DataFrame()

    def _clean_and_mask(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean data and mask sensitive information"""

        # 打印原始列名用于调试
        logger.info(f"Original Excel columns: {list(df.columns)}")

        # 关键列的映射（实际列名 -> 标准列名）
        column_rename = {
            'Order No.': 'order_id',
            'Total Weight (Kg)': 'weight_kg',
            'Country': 'country',
            'City': 'city',
            'State': 'state',
            'Description': 'description',
            'Declared Value': 'declared_value',
            'Declared Currency': 'declared_currency',
            'Courier Service Code': 'courier_code',
            'Create Date': 'create_date',
            'Order Customer': 'order_customer',
            'Value_Noisy': 'value_noisy',
            'Desc_Clean': 'desc_clean',
            'L1_Category_ID': 'l1_category_id',
            'L2_Category_ID_Raw': 'l2_category_id_raw',
            'L2_Category_ID': 'l2_category_id',
        }

        # 只重命名存在的列
        rename_map = {k: v for k, v in column_rename.items() if k in df.columns}
        df = df.rename(columns=rename_map)

        logger.info(f"Renamed columns: {list(rename_map.values())}")

        # 检查 order_customer 是否存在
        has_customer_col = 'order_customer' in df.columns
        logger.info(f"Has order_customer column: {has_customer_col}")

        if has_customer_col:
            logger.info(f"Sample order_customer values: {df['order_customer'].dropna().head(5).tolist()}")
            logger.info(f"Unique order_customer count: {df['order_customer'].nunique()}")

        # 检查必需的列
        required_cols = ['order_id', 'country', 'declared_value']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        # Remove rows with missing critical data
        df = df.dropna(subset=['order_id', 'country', 'declared_value'])

        # Ensure numeric columns
        df['declared_value'] = pd.to_numeric(df['declared_value'], errors='coerce')
        df['weight_kg'] = pd.to_numeric(df.get('weight_kg', 0), errors='coerce').fillna(0)
        df['value_noisy'] = pd.to_numeric(df.get('value_noisy', 0), errors='coerce').fillna(0)

        def mask_customer_name(name: str) -> str:
            """保留首尾两个字母，中间固定5个X"""
            name = str(name).strip()
            if len(name) <= 3:
                return name
            return f"{name[:2]}XXXXX{name[-2:]}"

        df['customer_masked'] = df['order_customer'].apply(
            lambda x: mask_customer_name(x)
            if x and x != 'nan' and len(str(x).strip()) > 0
            else 'CUST_UNKNOWN'
        )
        # Calculate value per kg
        df['value_per_kg'] = df['declared_value'] / (df['weight_kg'] + 0.001)

        # Calculate risk score
        df['risk_score'] = 0.0
        df.loc[df['declared_value'] < 1, 'risk_score'] += 0.3
        df.loc[df['weight_kg'] < 0.01, 'risk_score'] += 0.2
        df.loc[df['value_per_kg'] > 1000, 'risk_score'] += 0.1

        # Category risk
        if 'l1_category_id' in df.columns:
            high_risk_categories = [16, 17, 19]
            df.loc[df['l1_category_id'].isin(high_risk_categories), 'risk_score'] += 0.25

        # Remote country risk
        remote_countries = ['FO', 'GL', 'IS', 'RE', 'GP', 'MQ', 'YT', 'PM', 'WF', 'TF', 'NC', 'PF']
        df.loc[df['country'].isin(remote_countries), 'risk_score'] += 0.15

        df['risk_score'] = df['risk_score'].clip(0, 1)
        df['is_high_risk'] = df['risk_score'] > 0.7

        # 脱敏客户信息 - 关键修复部分
        if has_customer_col and df['order_customer'].notna().sum() > 0:
            # 有客户字段，使用哈希生成稳定标识
            logger.info("Using order_customer for customer_masked")

            # 清理客户数据
            df['order_customer'] = df['order_customer'].astype(str).str.strip()

            # 生成哈希

        else:
            # 无客户字段，从 order_id 提取
            logger.info("Using order_id prefix for customer_masked")
            df['customer_masked'] = df['order_id'].str.extract(r'([A-Z]{2}\d{6,})')[0]
            df['customer_masked'] = df['customer_masked'].apply(
                lambda x: f'CUST_{str(x)[2:10]}' if pd.notna(x) else 'CUST_UNKNOWN'
            )

        # 检查生成的 customer_masked
        unique_customers = df['customer_masked'].nunique()
        logger.info(f"Generated {unique_customers} unique customer_masked values")
        logger.info(f"Sample customer_masked: {df['customer_masked'].head(10).tolist()}")

        # Mask order IDs
        df['order_id'] = df['order_id'].apply(
            lambda x: f"{str(x)[:2]}***{str(x)[-2:]}" if pd.notna(x) and len(str(x)) > 4 else str(x)
        )

        # Clean optional columns
        df['product_keyword'] = df.get('desc_clean', df.get('description', 'Unknown')).fillna('Unknown')
        df['logistics_status'] = 'unknown'

        # Ensure category ID is numeric
        if 'l1_category_id' in df.columns:
            df['l1_category_id'] = pd.to_numeric(df['l1_category_id'], errors='coerce').fillna(-1).astype(int)
        else:
            df['l1_category_id'] = -1

        return df

    def get_data(self) -> pd.DataFrame:
        """Get processed dataframe"""
        return self.df.copy()

    def get_summary(self) -> Dict:
        """Get summary statistics"""
        if self.df.empty:
            return {
                "total_orders": 0,
                "total_value": 0,
                "total_weight": 0,
                "avg_value": 0,
                "high_risk_rate": 0,
                "delivered_rate": 0,
                "unique_countries": 0
            }

        total_orders = len(self.df)
        total_value = float(self.df['declared_value'].sum())
        total_weight = float(self.df['weight_kg'].sum())

        return {
            "total_orders": total_orders,
            "total_value": total_value,
            "total_weight": total_weight,
            "avg_value": float(self.df['declared_value'].mean()),
            "high_risk_rate": float(self.df['is_high_risk'].mean()),
            "delivered_rate": 0.0,
            "unique_countries": self.df['country'].nunique()
        }

    def get_country_distribution(self) -> List[Dict]:
        """Get orders grouped by country"""
        if self.df.empty:
            return []

        country_stats = self.df.groupby('country').agg({
            'order_id': 'count',
            'declared_value': 'sum',
            'risk_score': 'mean'
        }).reset_index()

        country_stats.columns = ['country', 'orders', 'total_value', 'avg_risk']
        country_stats = country_stats.sort_values('orders', ascending=False)

        return country_stats.to_dict('records')

    def get_category_distribution(self) -> List[Dict]:
        """Get orders grouped by category"""
        if self.df.empty or 'l1_category_id' not in self.df.columns:
            return []

        cat_stats = self.df.groupby('l1_category_id').agg({
            'order_id': 'count',
            'declared_value': 'sum',
            'risk_score': 'mean',
            'desc_clean': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Unknown'
        }).reset_index()

        cat_stats.columns = ['category_id', 'orders', 'total_value', 'avg_risk', 'category_name']
        cat_stats = cat_stats.sort_values('orders', ascending=False)

        return cat_stats.to_dict('records')

    def get_orders(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get individual orders with pagination"""
        if self.df.empty:
            return []

        df_slice = self.df.iloc[offset:offset + limit]
        return df_slice.to_dict('records')

    def get_customer_statistics(self) -> List[Dict]:
        """Get customer-level aggregated statistics"""
        if self.df.empty or 'customer_masked' not in self.df.columns:
            logger.warning("No customer_masked column available")
            return []

        # 过滤掉 UNKNOWN
        df_valid = self.df[self.df['customer_masked'] != 'CUST_UNKNOWN']

        if len(df_valid) == 0:
            logger.warning("No valid customer data (all CUST_UNKNOWN)")
            return []

        customer_stats = []

        for customer_id, group in df_valid.groupby('customer_masked'):
            country_counts = group['country'].value_counts()
            top_countries = country_counts.head(3).index.tolist()

            stats = {
                'customer': customer_id,
                'orders': len(group),
                'total_value': float(group['declared_value'].sum()),
                'total_weight': float(group['weight_kg'].sum()),
                'top_countries': top_countries,
                'market_share': len(group) / len(self.df) * 100,
                'avg_risk': float(group['risk_score'].mean()),
                'countries_count': group['country'].nunique()
            }
            customer_stats.append(stats)

        customer_stats.sort(key=lambda x: x['orders'], reverse=True)

        logger.info(f"Returning {len(customer_stats)} customer statistics")
        return customer_stats[:20]

    def filter_orders(
            self,
            countries: Optional[List[str]] = None,
            categories: Optional[List[int]] = None,
            min_value: Optional[float] = None,
            max_value: Optional[float] = None,
            risk_level: Optional[str] = None,
            search_term: Optional[str] = None,
            limit: int = 100
    ) -> List[Dict]:
        """Filter orders based on criteria"""
        if self.df.empty:
            return []

        df_filtered = self.df.copy()

        if countries:
            df_filtered = df_filtered[df_filtered['country'].isin(countries)]

        if categories and 'l1_category_id' in df_filtered.columns:
            df_filtered = df_filtered[df_filtered['l1_category_id'].isin(categories)]

        if min_value is not None:
            df_filtered = df_filtered[df_filtered['declared_value'] >= min_value]

        if max_value is not None:
            df_filtered = df_filtered[df_filtered['declared_value'] <= max_value]

        if risk_level:
            if risk_level == 'high':
                df_filtered = df_filtered[df_filtered['risk_score'] > 0.7]
            elif risk_level == 'medium':
                df_filtered = df_filtered[(df_filtered['risk_score'] > 0.4) & (df_filtered['risk_score'] <= 0.7)]
            elif risk_level == 'low':
                df_filtered = df_filtered[df_filtered['risk_score'] <= 0.4]

        if search_term:
            search_lower = search_term.lower()
            mask = (
                    df_filtered['order_id'].str.lower().str.contains(search_lower, na=False) |
                    df_filtered['product_keyword'].str.lower().str.contains(search_lower, na=False) |
                    df_filtered['country'].str.lower().str.contains(search_lower, na=False)
            )
            df_filtered = df_filtered[mask]

        return df_filtered.head(limit).to_dict('records')


# Global instance
data_loader = DataLoader()