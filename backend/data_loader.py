"""
数据加载模块 - 处理真实3PL数据
"""
import pandas as pd
import numpy as np
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path


class DataLoader:
    def __init__(self):
        # 尝试多个可能的数据路径
        possible_paths = [
            Path(__file__).parent.parent / "data" / "3pl_data_with_categories.xlsx",
            Path(__file__).parent.parent.parent / "data" / "3pl_data_with_categories.xlsx",
            Path("data") / "3pl_data_with_categories.xlsx",
            Path("../data") / "3pl_data_with_categories.xlsx",
        ]

        self.file_path = None
        for path in possible_paths:
            if path.exists():
                self.file_path = path
                print(f"✅ 找到数据文件: {path.absolute()}")
                break

        self._df: Optional[pd.DataFrame] = None
        self._load_data()

    def _load_data(self):
        """加载并预处理数据"""
        if self.file_path and self.file_path.exists():
            try:
                self._df = pd.read_excel(self.file_path, sheet_name='Sheet1')
                print(f"✅ 成功加载 {len(self._df)} 条真实数据")
            except Exception as e:
                print(f"❌ 读取Excel失败: {e}")
                self._df = self._generate_mock_data()
        else:
            print("⚠️ 未找到数据文件，使用模拟数据")
            print(f"   查找路径: {[str(p) for p in [self.file_path] if self.file_path]}")
            self._df = self._generate_mock_data()

        self._clean_and_mask()

    def _generate_mock_data(self) -> pd.DataFrame:
        """生成模拟数据"""
        np.random.seed(42)
        n = 500

        return pd.DataFrame({
            'Order No.': [f"UQ{np.random.randint(380000000, 380999999)}SG" for _ in range(n)],
            'Country': np.random.choice(['FO', 'LI', 'GL', 'IS', 'CL', 'CH', 'CZ', 'ID'], n),
            'L1_Category_ID': np.random.choice([0, 2, 8, 12, 16], n),
            'L2_Category_ID': np.random.randint(1, 500, n),
            'Total Weight (Kg)': np.random.exponential(0.08, n).clip(0.001, 5),
            'Declared Value': np.random.exponential(5, n).clip(0.5, 50),
            'Declared Currency': ['USD'] * n,
            'Create Date': pd.date_range(start='2026-01-16', periods=n, freq='H'),
            'Desc_Clean': np.random.choice([
                'phone case', 'screen protector', 'earrings', 'ring', 'necklace',
                'integrated circuit', 'speaker parts', 'toys', 'key chain'
            ], n),
        })

    def _clean_and_mask(self):
        """数据清洗和脱敏"""
        df = self._df.copy()

        # 重命名
        column_mapping = {
            'Order No.': 'order_id',
            'Country': 'country',
            'L1_Category_ID': 'l1_category_id',
            'L2_Category_ID': 'l2_category_id',
            'Total Weight (Kg)': 'weight_kg',
            'Declared Value': 'declared_value',
            'Declared Currency': 'currency',
            'Create Date': 'create_date',
            'Desc_Clean': 'product_keyword',
        }
        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        # 确保关键字段
        for col in ['order_id', 'country', 'l1_category_id', 'declared_value', 'weight_kg']:
            if col not in df.columns:
                df[col] = None

        # 脱敏
        df['customer_masked'] = 'CUST_HIDDEN'

        # 删除敏感字段
        for col in ['City', 'State', 'Order Customer', 'Description']:
            if col in df.columns:
                df = df.drop(columns=[col])

        # 计算字段
        df['value_per_kg'] = df['declared_value'] / df['weight_kg'].replace(0, 0.001)
        df['risk_score'] = self._calculate_risk(df)
        df['is_high_risk'] = df['risk_score'] > 0.7

        # 物流状态
        df['logistics_status'] = np.random.choice(
            ['delivered', 'in_transit', 'customs_hold', 'exception', 'returned'],
            len(df), p=[0.75, 0.15, 0.05, 0.03, 0.02]
        )

        self._df = df

    def _calculate_risk(self, df: pd.DataFrame) -> pd.Series:
        score = pd.Series(0.0, index=df.index)
        score += (df['declared_value'] < 1).astype(float) * 0.3
        score += (df['weight_kg'] < 0.01).astype(float) * 0.2

        sensitive_cats = [16, 17, 19]
        score += df['l1_category_id'].isin(sensitive_cats).astype(float) * 0.25

        remote = ['FO', 'GL', 'IS', 'PF', 'MH']
        score += df['country'].isin(remote).astype(float) * 0.15

        value_density = df['declared_value'] / df['weight_kg'].replace(0, 0.001)
        score += (value_density > 1000).astype(float) * 0.1

        return score.clip(0, 1)

    # ============ 查询接口 ============

    def get_summary(self) -> Dict:
        return {
            'total_orders': len(self._df),
            'total_value': float(self._df['declared_value'].sum()),
            'total_weight': float(self._df['weight_kg'].sum()),
            'avg_value': float(self._df['declared_value'].mean()),
            'high_risk_rate': float((self._df['risk_score'] > 0.7).mean()),
            'delivered_rate': float((self._df['logistics_status'] == 'delivered').mean()),
            'unique_countries': self._df['country'].nunique(),
        }

    def get_countries(self) -> List[str]:
        return sorted(self._df['country'].dropna().unique().tolist())

    def get_categories(self) -> List[Dict]:
        cats = sorted(self._df['l1_category_id'].dropna().unique().tolist())
        mapping = {
            0: "服装纺织", 1: "工具五金", 2: "电子电器",
            3: "运动户外", 6: "钟表眼镜", 7: "灯具照明",
            8: "手机数码", 12: "家居用品", 13: "手机配件",
            14: "美妆个护", 15: "电脑办公", 16: "珠宝首饰",
            17: "美容健康", 18: "箱包手袋", 19: "其他"
        }
        return [{'id': c, 'name': mapping.get(c, f'类目{c}')} for c in cats]

    def get_country_dist(self) -> List[Dict]:
        stats = self._df.groupby('country').agg({
            'order_id': 'count',
            'declared_value': 'sum',
            'risk_score': 'mean'
        }).reset_index()
        stats.columns = ['country', 'orders', 'total_value', 'avg_risk']
        return stats.sort_values('orders', ascending=False).to_dict('records')

    def get_category_dist(self) -> List[Dict]:
        stats = self._df.groupby('l1_category_id').agg({
            'order_id': 'count',
            'declared_value': ['sum', 'mean'],
            'risk_score': 'mean'
        }).reset_index()
        stats.columns = ['category_id', 'orders', 'total_value', 'avg_value', 'avg_risk']

        mapping = {
            0: "服装纺织", 1: "工具五金", 2: "电子电器",
            3: "运动户外", 6: "钟表眼镜", 7: "灯具照明",
            8: "手机数码", 12: "家居用品", 13: "手机配件",
            14: "美妆个护", 15: "电脑办公", 16: "珠宝首饰",
            17: "美容健康", 18: "箱包手袋", 19: "其他"
        }
        stats['category_name'] = stats['category_id'].map(mapping).fillna('未知')
        return stats.to_dict('records')

    def get_orders(self, **filters) -> List[Dict]:
        df = self._df.copy()

        if filters.get('countries'):
            df = df[df['country'].isin(filters['countries'])]
        if filters.get('categories'):
            df = df[df['l1_category_id'].isin(filters['categories'])]
        if filters.get('risk_threshold'):
            df = df[df['risk_score'] >= filters['risk_threshold']]

        cols = ['order_id', 'country', 'l1_category_id', 'product_keyword',
                'declared_value', 'weight_kg', 'risk_score', 'logistics_status']
        available = [c for c in cols if c in df.columns]

        return df[available].head(filters.get('limit', 100)).to_dict('records')


# 全局实例
data_loader = DataLoader()