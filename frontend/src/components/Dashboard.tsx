import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid } from 'recharts';
import { useSummary, useCountryDist, useCategoryDist, useCountries, useCategories, useOrders } from '../hooks/use3PLData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard: React.FC = () => {
  const { data: summary, loading } = useSummary();
  const countryDist = useCountryDist();
  const categoryDist = useCategoryDist();
  const countries = useCountries();
  const categories = useCategories();

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [riskThreshold, setRiskThreshold] = useState(0.7);

  const orders = useOrders({
    countries: selectedCountries,
    categories: selectedCategories,
    riskThreshold
  });

  if (loading) return <div style={{ padding: 40 }}>加载中...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <h1>🚚 3PL智能物流分析平台</h1>

      {/* 指标卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, background: '#f6ffed', borderRadius: 8 }}>
          <div>总订单量</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>
            {summary?.total_orders.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: 20, background: '#e6f7ff', borderRadius: 8 }}>
          <div>总申报价值</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
            ${(summary?.total_value || 0).toFixed(0)}
          </div>
        </div>
        <div style={{ padding: 20, background: '#fff2f0', borderRadius: 8 }}>
          <div>高风险率</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#cf1322' }}>
            {((summary?.high_risk_rate || 0) * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: 20, background: '#f9f0ff', borderRadius: 8 }}>
          <div>覆盖国家</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#722ed1' }}>
            {summary?.unique_countries}
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <h3>筛选条件</h3>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <label>国家</label>
            <select
              multiple
              value={selectedCountries}
              onChange={e => setSelectedCountries(Array.from(e.target.selectedOptions, o => o.value))}
              style={{ width: 150, height: 100, display: 'block' }}
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>类目</label>
            <select
              multiple
              value={selectedCategories.map(String)}
              onChange={e => setSelectedCategories(Array.from(e.target.selectedOptions, o => parseInt(o.value)))}
              style={{ width: 150, height: 100, display: 'block' }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>风险阈值: {riskThreshold}</label>
            <input
              type="range"
              min="0" max="1" step="0.1"
              value={riskThreshold}
              onChange={e => setRiskThreshold(parseFloat(e.target.value))}
              style={{ width: 200, display: 'block' }}
            />
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 国家分布 */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h4>国家分布 (TOP10)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryDist.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#1890ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 类目分布 */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h4>类目分布</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryDist} dataKey="orders" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} label>
                {categoryDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 风险散点图 */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h4>风险-价值分布</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="declared_value" name="价值" />
              <YAxis type="number" dataKey="risk_score" name="风险" domain={[0, 1]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={orders} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 订单列表 */}
        <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h4>订单样本 ({orders.length}条)</h4>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th>订单号</th>
                  <th>国家</th>
                  <th>价值</th>
                  <th>风险</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map(o => (
                  <tr key={o.order_id}>
                    <td>{o.order_id}</td>
                    <td>{o.country}</td>
                    <td>${o.declared_value?.toFixed(2)}</td>
                    <td style={{ color: o.risk_score > 0.7 ? 'red' : 'green' }}>
                      {o.risk_score?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;