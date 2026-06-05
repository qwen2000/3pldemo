import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class OperationAnalyzer:
    def __init__(self, forecast_csv_path: str, weekly_csv_path: Optional[str] = None):
        """
        Initialize Operation Analyzer
        Args:
            forecast_csv_path: Path to 3PL_Final_Forecast_Report.csv
            weekly_csv_path: Path to 3pl_weekly_aggregated.csv (optional)
        """
        self.forecast_df = pd.read_csv(forecast_csv_path, encoding='utf-8-sig')
        self.weekly_df = None
        if weekly_csv_path:
            try:
                self.weekly_df = pd.read_csv(weekly_csv_path, encoding='utf-8-sig')
                logger.info(f"Loaded weekly aggregated data: {len(self.weekly_df)} records")
            except Exception as e:
                logger.warning(f"Could not load weekly data: {e}")

        self._process_forecast_data()

    def _process_forecast_data(self):
        """Process forecast data and calculate metrics"""
        # Clean column names
        self.forecast_df.columns = [c.strip() for c in self.forecast_df.columns]

        # Extract client info
        self.forecast_df['client_full'] = self.forecast_df['Customer']
        self.forecast_df['destination'] = self.forecast_df['Destination']

        # Mask client names (first 1 letter + *** + last 1 letter)
        self.forecast_df['client_id'] = self.forecast_df['client_full'].apply(
            lambda x: f"{str(x)[0]}***{str(x)[-1]}" if pd.notna(x) and len(str(x)) > 2 else str(x)
        )

        # Calculate 4-week totals
        self.forecast_df['total_4wk_vol'] = (
            self.forecast_df['Week +1_Vol'] +
            self.forecast_df['Week +2_Vol'] +
            self.forecast_df['Week +3_Vol'] +
            self.forecast_df['Week +4_Vol']
        )
        self.forecast_df['total_4wk_wt'] = (
            self.forecast_df['Week +1_Wt'] +
            self.forecast_df['Week +2_Wt'] +
            self.forecast_df['Week +3_Wt'] +
            self.forecast_df['Week +4_Wt']
        )

        logger.info(f"Processed {len(self.forecast_df)} forecast records")

    def get_capacity_gap_analysis(self) -> List[Dict]:
        """
        Generate capacity gap analysis for each client-destination combination
        Returns list of records with health score, gap, and recommendations
        """
        results = []

        for _, row in self.forecast_df.iterrows():
            # AI prediction (W+1)
            ai_pred_w1 = row['Week +1_Vol']

            # Simulate allocated capacity (base: 80% of prediction with some variance)
            # Higher volume clients get better allocation rate
            if ai_pred_w1 > 100:
                allocation_rate = 0.85
            elif ai_pred_w1 > 50:
                allocation_rate = 0.80
            else:
                allocation_rate = 0.75

            allocated_cap = int(ai_pred_w1 * allocation_rate)

            # Calculate gap (can be negative if over-allocated)
            gap = int(ai_pred_w1 - allocated_cap)

            # Calculate health score based on multiple factors
            # 1. Forecast trend (W+1 to W+4)
            w1, w2, w3, w4 = row['Week +1_Vol'], row['Week +2_Vol'], row['Week +3_Vol'], row['Week +4_Vol']
            if w1 > 0:
                trend = ((w4 - w1) / w1) * 100
            else:
                trend = 0

            # 2. Capacity utilization
            if allocated_cap > 0:
                utilization = (ai_pred_w1 / allocated_cap) * 100
            else:
                utilization = 100

            # Calculate health score (0-100, higher is better)
            health_score = 70  # Base score

            # Adjust based on trend
            if trend > 10:
                health_score -= 15  # Growing too fast
            elif trend < -30:
                health_score -= 20  # Declining rapidly
            elif -10 < trend < 10:
                health_score += 15  # Stable

            # Adjust based on capacity gap
            if gap == 0:
                health_score += 15
            elif gap < 10:
                health_score += 5
            elif gap > 50:
                health_score -= 20
            elif gap > 20:
                health_score -= 10

            # Clamp between 0-100
            health_score = max(0, min(100, health_score))

            # Determine recommendation (show negative gaps too)
            if gap > 0:
                # Need more capacity
                recommendation = f"Alloc +{gap}"
                rec_type = "urgent" if gap > 20 else "normal"
            elif gap == 0:
                # Perfect match
                recommendation = "Exact Match"
                rec_type = "sufficient"
            else:
                # Over-allocated (surplus capacity)
                recommendation = f"Surplus {gap}"  # gap is negative, so will show as "Surplus -10"
                rec_type = "surplus"

            results.append({
                'entity_id': row['Entity_ID'],
                'client_id': row['client_id'].upper(),
                'client_full': row['client_full'],
                'destination': row['destination'],
                'category': row.get('Category', 'N/A'),
                'health_score': int(health_score),
                'ai_pred_w1': int(ai_pred_w1),
                'ai_pred_w2': int(row['Week +2_Vol']),
                'ai_pred_w3': int(row['Week +3_Vol']),
                'ai_pred_w4': int(row['Week +4_Vol']),
                'allocated_cap': allocated_cap,
                'gap': gap,
                'trend_pct': round(trend, 1),
                'recommendation': recommendation,
                'rec_type': rec_type,
                'est_weight_kg': round(row['Week +1_Wt'], 2),
                'total_4wk_vol': int(row['total_4wk_vol']),
                'total_4wk_wt': round(row['total_4wk_wt'], 2),
            })

        # Sort by gap descending (most urgent first)
        results.sort(key=lambda x: x['gap'], reverse=True)
        return results

    def get_urgent_actions(self, top_n: int = 10) -> List[Dict]:
        """Get top N urgent procurement actions (only positive gaps)"""
        analysis = self.get_capacity_gap_analysis()

        # Filter only those with positive gaps (need more capacity)
        urgent = [r for r in analysis if r['gap'] > 0]

        # Sort by gap and health score
        urgent.sort(key=lambda x: (-x['gap'], x['health_score']))

        return urgent[:top_n]

    def get_anomalies(self) -> Dict:
        """
        Detect anomalies in demand patterns
        Returns: dict with urgent_procurement and demand_drop_warnings
        """
        analysis = self.get_capacity_gap_analysis()

        # Urgent procurement (gap > 50 or health < 50, but only positive gaps)
        urgent_procurement = [
            {
                'client_id': r['client_id'],
                'destination': r['destination'],
                'gap': r['gap'],
                'message': f"Need +{r['gap']} slots"
            }
            for r in analysis
            if r['gap'] > 0 and (r['gap'] > 50 or r['health_score'] < 50)
        ][:5]  # Top 5

        # Demand drop warnings (trend < -30%)
        demand_drops = [
            {
                'client_id': r['client_id'],
                'destination': r['destination'],
                'trend_pct': r['trend_pct'],
                'message': f"Trend to W+4: {r['trend_pct']}%"
            }
            for r in analysis
            if r['trend_pct'] < -30
        ][:5]  # Top 5

        return {
            'urgent_procurement': urgent_procurement,
            'demand_drop_warnings': demand_drops,
        }

    def get_insights(self) -> Dict:
        """
        Generate AI-driven insights for next week actions and 4-week trends
        """
        analysis = self.get_capacity_gap_analysis()

        # Calculate overall metrics
        total_gap = sum(r['gap'] for r in analysis if r['gap'] > 0)  # Only positive gaps
        total_surplus = abs(sum(r['gap'] for r in analysis if r['gap'] < 0))  # Surplus capacity
        total_predicted_vol = sum(r['ai_pred_w1'] for r in analysis)
        total_allocated = sum(r['allocated_cap'] for r in analysis)
        avg_health = np.mean([r['health_score'] for r in analysis])

        # Count by urgency
        urgent_count = len([r for r in analysis if r['gap'] > 20])
        medium_count = len([r for r in analysis if 0 < r['gap'] <= 20])
        sufficient_count = len([r for r in analysis if r['gap'] == 0])
        surplus_count = len([r for r in analysis if r['gap'] < 0])

        # Identify top growing clients
        growing = sorted(
            [r for r in analysis if r['trend_pct'] > 10],
            key=lambda x: x['trend_pct'],
            reverse=True
        )[:3]

        # Identify declining clients
        # Filter: trend < 0, trend > -100% (exclude complete drops), and ai_pred_w1 > 10
        declining = sorted(
            [r for r in analysis if r['trend_pct'] < -10 and r['trend_pct'] > -100 and r['ai_pred_w1'] > 10],
            key=lambda x: x['trend_pct']
        )[:3]

        # Get urgent clients list
        urgent_clients = sorted(
            [r for r in analysis if r['gap'] > 20],
            key=lambda x: x['gap'],
            reverse=True
        )[:5]

        # Get surplus clients list
        surplus_clients = sorted(
            [r for r in analysis if r['gap'] < 0],
            key=lambda x: x['gap']
        )[:5]

        return {
            'summary': {
                'total_gap': total_gap,
                'total_predicted_vol': int(total_predicted_vol),
                'total_allocated': int(total_allocated),
                'avg_health_score': round(avg_health, 1),
                # Fixed: utilization should be allocated / predicted, capped at 100%
                'utilization_pct': min(100.0, round((total_allocated / max(total_predicted_vol, 1)) * 100, 1)),
            },
            'urgency_breakdown': {
                'urgent': urgent_count,  # gap > 20
                'medium': medium_count,  # 0 < gap <= 20
                'sufficient': sufficient_count,  # gap == 0
                'surplus': surplus_count,  # gap < 0
            },
            'next_week_actions': [
                {
                    'text': f"Allocate {total_gap} additional slots to meet W+1 demand" if total_gap > 0 else "Capacity allocation is balanced",
                    'clients': None,
                },
                {
                    'text': f"{urgent_count} clients require urgent capacity expansion" if urgent_count > 0 else "No urgent capacity needs",
                    'clients': [{'id': c['client_id'], 'dest': c['destination'], 'gap': c['gap']} for c in urgent_clients] if urgent_count > 0 else None,
                },
                {
                    'text': f"{surplus_count} clients have surplus capacity (可释放 {total_surplus} slots)" if surplus_count > 0 else "No surplus capacity detected",
                    'clients': [{'id': c['client_id'], 'dest': c['destination'], 'gap': c['gap']} for c in surplus_clients] if surplus_count > 0 else None,
                },
                {
                    'text': f"Monitor {len(declining)} clients showing demand decline (>10%)" if declining else "Demand stable across all clients",
                    'clients': [{'id': c['client_id'], 'dest': c['destination'], 'trend': c['trend_pct']} for c in declining] if declining else None,
                },
            ],
            'four_week_trends': [
                {
                    'text': f"Average client health score: {round(avg_health, 1)}/100",
                    'clients': None,
                },
                {
                    'text': f"{len(growing)} clients showing strong growth (>10% trend)" if growing else "No strong growth signals detected",
                    'clients': [{'id': c['client_id'], 'dest': c['destination'], 'trend': c['trend_pct']} for c in growing] if growing else None,
                },
                {
                    'text': f"{len(declining)} clients at risk of demand drop" if declining else "Demand stable across clients",
                    'clients': [{'id': c['client_id'], 'dest': c['destination'], 'trend': c['trend_pct']} for c in declining] if declining else None,
                },
                {
                    'text': f"Total forecasted 4-week volume: {sum(r['total_4wk_vol'] for r in analysis):,} units",
                    'clients': None,
                },
            ],
            'top_growing': [
                {'client': r['client_id'], 'dest': r['destination'], 'trend': f"+{r['trend_pct']}%"}
                for r in growing
            ],
            'top_declining': [
                {'client': r['client_id'], 'dest': r['destination'], 'trend': f"{r['trend_pct']}%"}
                for r in declining
            ],
        }
