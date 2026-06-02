import React, { useState, useEffect } from 'react';
import {
  Package, TrendingUp, ShoppingCart, Calendar,
  Download, Filter, AlertTriangle, AlertOctagon,
  Play, RefreshCw, ArrowRight, BarChart2, PieChart as PieChartIcon,
  Globe, Truck, Activity, CheckCircle, XCircle, Clock,
  Zap, TrendingDown, Users, DollarSign, Shield,
  ChevronRight, ChevronLeft, Pause, FastForward,
  MessageSquare, Phone, Mail, Award, Target
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
  ComposedChart
} from 'recharts';

// ==========================================
// 真实数据 Hook 导入
// ==========================================
import { useRealDashboardData } from './hooks/useRealData';

// ==========================================
// Mock Data (保留作为 fallback)
// ==========================================

const trendData = [
  { date: '2026-04-20', volume: 145000, aiPredicted: 142000, actual: 145000 },
  { date: '2026-04-27', volume: 152000, aiPredicted: 155000, actual: 152000 },
  { date: '2026-05-04', volume: 148000, aiPredicted: 150000, actual: 148000 },
  { date: '2026-05-11', volume: 165000, aiPredicted: 162000, actual: 165000 },
  { date: '2026-05-18', volume: 172000, aiPredicted: 170000, actual: 172000 },
  { date: '2026-05-25', volume: 185000, aiPredicted: 188000, actual: 185000 },
];

const categoryData = [
  { name: 'Apparel', value: 85000, growth: 12 },
  { name: 'Electronics', value: 45000, growth: -5 },
  { name: 'Home Goods', value: 30000, growth: 23 },
  { name: 'Beauty', value: 15000, growth: 8 },
  { name: 'Misc', value: 10000, growth: 3 },
];
const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#e5e7eb'];

const clientData = [
  { id: 'A***Z', dest: 'US, CA', w1Vol: 45000, w1Wt: 12500.5, w2Vol: 46000, w2Wt: 12800, w3Vol: 47000, w3Wt: 13000, w4Vol: 48000, w4Wt: 13200, healthScore: 92, churnRisk: 'LOW' },
  { id: 'S***N', dest: 'UK, DE, FR', w1Vol: 32000, w1Wt: 8900.2, w2Vol: 31000, w2Wt: 8700, w3Vol: 28000, w3Wt: 7800, w4Vol: 25000, w4Wt: 7000, healthScore: 62, churnRisk: 'HIGH' },
  { id: 'T***U', dest: 'AU, NZ', w1Vol: 18000, w1Wt: 5400.0, w2Vol: 18500, w2Wt: 5500, w3Vol: 19000, w3Wt: 5600, w4Vol: 19500, w4Wt: 5700, healthScore: 88, churnRisk: 'LOW' },
  { id: 'G***L', dest: 'JP, KR', w1Vol: 15000, w1Wt: 4200.8, w2Vol: 15200, w2Wt: 4250, w3Vol: 15500, w3Wt: 4300, w4Vol: 16000, w4Wt: 4400, healthScore: 85, churnRisk: 'LOW' },
  { id: 'M***A', dest: 'US, MX', w1Vol: 12000, w1Wt: 3100.0, w2Vol: 11000, w2Wt: 2900, w3Vol: 10500, w3Wt: 2800, w4Vol: 9000, w4Wt: 2400, healthScore: 45, churnRisk: 'CRITICAL' },
];

const procurementData = clientData.map(c => {
  const currentCap = Math.floor(c.w1Vol * 0.8);
  const gap = c.w1Vol - currentCap;
  const declineRate = (c.w4Vol - c.w1Vol) / c.w1Vol;
  const potentialLoss = c.churnRisk === 'CRITICAL' ? 1800000 : c.churnRisk === 'HIGH' ? 1200000 : 0;
  return { ...c, currentCap, gap, declineRate, potentialLoss };
});

const supplierData = [
  { name: 'DHL Freight', baseRate: 2.8, aiTarget: 2.4, current: 2.8, status: 'waiting', responseTime: null, reliability: 96 },
  { name: 'Kuehne+Nagel', baseRate: 2.6, aiTarget: 2.3, current: 2.6, status: 'waiting', responseTime: null, reliability: 94 },
  { name: 'DB Schenker', baseRate: 2.5, aiTarget: 2.2, current: 2.5, status: 'waiting', responseTime: null, reliability: 92 },
  { name: 'XPO Logistics', baseRate: 2.7, aiTarget: 2.35, current: 2.7, status: 'waiting', responseTime: null, reliability: 89 },
];

// ==========================================
// Main App Component
// ==========================================

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [liveMode, setLiveMode] = useState(false);
  const [metrics, setMetrics] = useState({
    activeShipments: 1247,
    onTimeRate: 96.8,
    costPerUnit: 2.34,
    aiConfidence: 94.5,
    alerts: 3,
    costSavings: 127500
  });

  // 获取真实数据（用于顶部指标）
  const { summary, loading: realDataLoading } = useRealDashboardData();

  // 当真实数据加载完成，更新顶部指标
  useEffect(() => {
    if (summary) {
      setMetrics(m => ({
        ...m,
        activeShipments: summary.total_orders || m.activeShipments,
        aiConfidence: summary.high_risk_rate ? (1 - summary.high_risk_rate) * 100 : m.aiConfidence,
      }));
    }
  }, [summary]);

  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      setMetrics(m => ({
        ...m,
        activeShipments: m.activeShipments + Math.floor(Math.random() * 10 - 3),
        onTimeRate: Math.min(100, Math.max(90, m.onTimeRate + (Math.random() - 0.5) * 0.5)),
        aiConfidence: Math.min(100, Math.max(85, m.aiConfidence + (Math.random() - 0.5) * 0.3)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [liveMode]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded text-white shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">3PL AI Capacity Center</h1>
              <p className="text-xs text-slate-500">
                {realDataLoading ? '加载真实数据中...' : `真实数据模式 • ${summary?.total_orders?.toLocaleString() || '...'} 条订单`}
              </p>
            </div>
          </div>
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <NavButton id="overview" label="Market Overview" icon={Activity} active={activeTab} onClick={setActiveTab} />
            <NavButton id="procurement" label="Procurement Plan" icon={ShoppingCart} active={activeTab} onClick={setActiveTab} />
            <NavButton id="forecast" label="4-Week Forecast" icon={Calendar} active={activeTab} onClick={setActiveTab} />
            <NavButton id="demo" label="Business Value Demo" icon={Play} active={activeTab} onClick={setActiveTab} />
          </nav>
        </div>
      </header>

      {/* Operations Command Bar */}
      <div className="bg-slate-900 text-white py-3 px-6">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex gap-8">
            <MetricTicker label="Active Shipments" value={metrics.activeShipments.toLocaleString()} trend="+12%" />
            <MetricTicker label="On-Time Rate" value={`${metrics.onTimeRate.toFixed(1)}%`} trend="+2.3%" alert={metrics.onTimeRate < 95} />
            <MetricTicker label="Cost Per Unit" value={`$${metrics.costPerUnit}`} trend="-8%" positive />
            <MetricTicker label="Q2 Savings" value={`$${(metrics.costSavings / 1000).toFixed(0)}K`} trend="+15%" positive />
          </div>
          <div className="flex items-center gap-4">
            <AIStatusIndicator confidence={metrics.aiConfidence} />
            <AlertBadge count={metrics.alerts} />
            <button
              onClick={() => setLiveMode(!liveMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${liveMode ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {liveMode ? <><Zap size={14} className="animate-pulse" /> LIVE</> : <><Clock size={14} /> LIVE MODE</>}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && <OverviewModule />}
        {activeTab === 'procurement' && <ProcurementModule />}
        {activeTab === 'forecast' && <ForecastModule />}
        {activeTab === 'demo' && <BusinessValueDemo />}
      </main>
    </div>
  );
}

// ==========================================
// Components
// ==========================================

function NavButton({ id, label, icon: Icon, active, onClick }: {
  id: string;
  label: string;
  icon: React.ElementType;
  active: string;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${active === id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function MetricTicker({ label, value, trend, alert, positive }: {
  label: string;
  value: string;
  trend: string;
  alert?: boolean;
  positive?: boolean;
}) {
  const trendColor = alert ? 'text-red-400' : positive ? 'text-green-400' : trend.startsWith('+') ? 'text-green-400' : 'text-red-400';
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{value}</span>
        <span className={`text-xs ${trendColor}`}>{trend}</span>
      </div>
    </div>
  );
}

function AIStatusIndicator({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-xs text-slate-300">AI Confidence</span>
      <span className="text-sm font-bold text-green-400">{confidence.toFixed(1)}%</span>
    </div>
  );
}

function AlertBadge({ count }: { count: number }) {
  return (
    <button className="relative p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
      <AlertTriangle size={16} className="text-amber-400" />
      {count > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">{count}</span>}
    </button>
  );
}

function TableHeader({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return <th className={`px-4 py-3 text-${align} text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200`}>{children}</th>;
}

function TableCell({ children, className = "", align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-100 text-${align} ${className}`}>{children}</td>;
}

// ==========================================
// 新增：指标卡片组件
// ==========================================

function MetricCard({ title, value, icon: Icon, color, alert }: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'purple';
  alert?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/50">
          <Icon size={20} className={alert ? 'text-red-600' : ''} />
        </div>
        <div>
          <div className="text-xs opacity-80 uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 修改后的 OverviewModule - 使用真实数据
// ==========================================

function OverviewModule() {
  const [showConfidence, setShowConfidence] = useState(false);

  // 使用真实数据
  const {
    summary,
    trendData: realTrendData,
    categoryChartData: realCategoryData,
    countryDistribution,
    loading,
    error
  } = useRealDashboardData();

  // 计算真实数据的统计指标
  const realMetrics = summary ? {
    totalOrders: summary.total_orders?.toLocaleString() || 'N/A',
    totalValue: `$${(summary.total_value / 1000).toFixed(1)}K`,
    totalWeight: `${(summary.total_weight / 1000).toFixed(1)}K kg`,
    highRiskRate: `${(summary.high_risk_rate * 100).toFixed(1)}%`,
    countryCount: summary.unique_countries || 0,
  } : null;

  // 使用真实数据或 fallback
  const displayTrendData = realTrendData.length > 0 ? realTrendData : trendData;
  const displayCategoryData = realCategoryData.length > 0 ? realCategoryData : categoryData;

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">加载真实数据中...</span>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-bold">数据加载失败</h3>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 真实数据指标卡片 */}
      {realMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="总订单量"
            value={realMetrics.totalOrders}
            icon={Package}
            color="blue"
          />
          <MetricCard
            title="总申报价值"
            value={realMetrics.totalValue}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="高风险率"
            value={realMetrics.highRiskRate}
            alert={summary!.high_risk_rate > 0.1}
            icon={AlertTriangle}
            color="red"
          />
          <MetricCard
            title="覆盖国家"
            value={realMetrics.countryCount.toString()}
            icon={Globe}
            color="purple"
          />
        </div>
      )}

      {/* 标题区域 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">真实数据概览</h2>
            <p className="text-sm text-slate-500">
              基于 {summary?.total_orders?.toLocaleString() || '...'} 条真实订单 •
              数据时间: 2026-01-16 ~ 2026-01-20
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
          >
            <Target size={16} />
            {showConfidence ? '隐藏详情' : '显示详情'}
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <Globe size={16} />
            <span>国家: <strong>{countryDistribution.length}</strong> 个</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 国家订单分布图 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800">国家订单分布（真实数据）</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" /> 实际订单
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorVol)"
                  name="订单量"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 类目分布饼图 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">一级类目分布</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayCategoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {displayCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name: string, props: any) => [
                    `${value.toLocaleString()} 单`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
            {displayCategoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate max-w-[100px]">{cat.name}</span>
                </div>
                <span className={cat.growth > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                  {cat.growth > 0 ? '↗' : '↘'} {Math.abs(cat.growth)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 国家详细数据表格 */}
      {showConfidence && countryDistribution.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-slate-800">国家详细统计</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">国家</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">订单数</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">总价值</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">平均风险</th>
                </tr>
              </thead>
              <tbody>
                {countryDistribution.slice(0, 10).map((country, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {country.country}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {country.orders.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      ${country.total_value.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        country.avg_risk > 0.7 ? 'bg-red-100 text-red-700' :
                        country.avg_risk > 0.4 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {(country.avg_risk * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ProcurementModule - 完整原始代码
// ==========================================

function ProcurementModule() {
  const [workflowState, setWorkflowState] = useState('analysis');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [suppliers, setSuppliers] = useState(supplierData);
  const [negotiationRound, setNegotiationRound] = useState(0);
  const [executionProgress, setExecutionProgress] = useState(0);

  const urgentGaps = procurementData.filter(d => d.gap > 0).sort((a, b) => b.gap - a.gap);
  const dropWarnings = procurementData.filter(d => d.declineRate < -0.1).sort((a, b) => a.declineRate - b.declineRate);

  const handleRunAI = () => {
    setIsRunning(true);
    setWorkflowState('analysis');
    setTimeout(() => {
      setIsRunning(false);
      setWorkflowState('scenarios');
    }, 2000);
  };

  const startNegotiation = () => {
    setWorkflowState('negotiating');
    setNegotiationRound(1);
    let round = 1;
    const interval = setInterval(() => {
      setSuppliers(prev => prev.map((s, i) => ({
        ...s,
        status: i < round ? 'responded' : 'waiting',
        current: i < round ? Math.max(s.aiTarget, s.current - 0.15) : s.current,
        responseTime: i < round ? `${Math.floor(Math.random() * 30 + 10)}min` : null
      })));
      round++;
      if (round > 4) {
        clearInterval(interval);
        setWorkflowState('approved');
      }
      setNegotiationRound(round);
    }, 1500);
  };

  const executePO = () => {
    setWorkflowState('executing');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setExecutionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setWorkflowState('completed');
      }
    }, 300);
  };

  const scenarios = [
    { id: 'A', name: 'Cost Priority', cost: 89200, time: '48h', risk: 'Medium', saving: 15800, color: 'blue' },
    { id: 'B', name: 'Speed Priority', cost: 102400, time: '24h', risk: 'Low', saving: 5600, color: 'green' },
    { id: 'C', name: 'Balanced', cost: 94800, time: '36h', risk: 'Low', saving: 10200, color: 'purple' },
  ];

  const workflowSteps = [
    { key: 'analysis', label: 'AI Analysis', icon: Activity },
    { key: 'scenarios', label: 'Scenarios', icon: Target },
    { key: 'negotiating', label: 'Negotiation', icon: MessageSquare },
    { key: 'approved', label: 'Approval', icon: CheckCircle },
    { key: 'executing', label: 'Execution', icon: Truck },
    { key: 'completed', label: 'Complete', icon: Award },
  ];

  const getStepIndex = (state: string) => workflowSteps.findIndex(s => s.key === state);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Workflow Progress */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between relative">
          {workflowSteps.map((step, i, arr) => (
            <React.Fragment key={step.key}>
              <div className={`flex flex-col items-center gap-2 ${workflowState === step.key ? 'opacity-100' : getStepIndex(workflowState) > i ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${workflowState === step.key ? 'bg-blue-600 text-white animate-pulse' : getStepIndex(workflowState) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <step.icon size={20} />
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${getStepIndex(workflowState) > i ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">AI Procurement Center</h2>
                  <p className="text-sm text-slate-500">End-to-end AI-driven procurement • Avg decision time: 18 min</p>
                </div>
              </div>
              <button
                onClick={handleRunAI}
                disabled={isRunning || workflowState !== 'analysis'}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-md shadow-sm transition-all flex items-center gap-2"
              >
                {isRunning ? <><RefreshCw size={16} className="animate-spin" /> Analyzing...</> : <><Play size={16} fill="currentColor" /> Run AI Engine</>}
              </button>
            </div>
          </div>

          {workflowState === 'scenarios' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">AI-Generated Procurement Strategies</h3>
              <div className="grid grid-cols-3 gap-4">
                {scenarios.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${selectedScenario?.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-lg font-bold text-blue-700 mb-2">{s.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Est. Cost</span><span className="font-bold">${s.cost.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Lead Time</span><span className="font-bold">{s.time}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Risk</span><span className="font-bold text-green-600">{s.risk}</span></div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Est. Savings</span>
                          <span className="font-bold text-green-600 text-lg">${s.saving.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {selectedScenario?.id === s.id && (
                      <div className="mt-3 pt-3 border-t">
                        <button onClick={startNegotiation} className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                          Start Negotiation →
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {workflowState === 'negotiating' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">AI Negotiation in Progress • Round {Math.min(negotiationRound, 4)}/4</h3>
              <div className="space-y-3">
                {suppliers.map((s, i) => (
                  <div key={s.name} className={`p-4 rounded-lg border ${s.status === 'responded' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.status === 'responded' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                          {s.status === 'responded' ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-xs text-slate-500">Reliability: {s.reliability}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Initial</div>
                          <div className="line-through text-slate-400">${s.baseRate}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">AI Target</div>
                          <div className="text-purple-600 font-bold">${s.aiTarget}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Current</div>
                          <div className={`font-bold text-lg ${s.current <= s.aiTarget ? 'text-green-600' : 'text-amber-600'}`}>${s.current.toFixed(2)}</div>
                        </div>
                        {s.responseTime && <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">{s.responseTime}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {negotiationRound > 4 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-purple-900">Negotiation Complete! Winner: DB Schenker</div>
                      <div className="text-sm text-purple-700">Final rate $2.20 • 21.4% savings • Est. annual save: $127,500</div>
                    </div>
                    <button onClick={executePO} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                      Execute PO →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {workflowState === 'executing' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Execution Tracking • Real-time Supplier Response</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${executionProgress}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                {['PO Confirmed', 'Capacity Locked', 'Pickup Scheduled', 'In Transit'].map((step, i) => (
                  <div key={step} className={`p-3 rounded-lg ${executionProgress > (i + 1) * 25 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                    <div className="text-lg mb-1">{executionProgress > (i + 1) * 25 ? '✓' : '○'}</div>
                    <div className="text-xs font-medium">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workflowState === 'completed' && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Award size={24} /> Procurement Complete!</h3>
                  <p className="text-green-100">Total time: 47 min • Cost saved: $23,400 • Supplier performance: 100%</p>
                </div>
                <button onClick={() => { setWorkflowState('analysis'); setSelectedScenario(null); setExecutionProgress(0); setSuppliers(supplierData); }} className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50">
                  New Process
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Capacity Gap & Client Health Analysis</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-xs font-medium rounded text-gray-700 hover:bg-gray-50">
                <Download size={14} /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <TableHeader>Client ID</TableHeader>
                    <TableHeader>Health</TableHeader>
                    <TableHeader>Destination</TableHeader>
                    <TableHeader align="right">AI Pred. (W+1)</TableHeader>
                    <TableHeader align="right">Allocated Cap.</TableHeader>
                    <TableHeader align="right">Gap</TableHeader>
                    <TableHeader align="right">Recommendation</TableHeader>
                    <TableHeader align="right">Churn Risk</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {procurementData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <TableCell><span className="font-bold text-gray-900">{row.id}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-16 h-2 rounded-full ${row.healthScore > 80 ? 'bg-green-500' : row.healthScore > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ opacity: row.healthScore / 100 }} />
                          <span className={`text-xs font-bold ${row.healthScore > 80 ? 'text-green-600' : row.healthScore > 60 ? 'text-amber-600' : 'text-red-600'}`}>{row.healthScore}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-gray-500 text-xs">{row.dest}</span></TableCell>
                      <TableCell align="right"><span className="font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">{row.w1Vol.toLocaleString()}</span></TableCell>
                      <TableCell align="right">{row.currentCap.toLocaleString()}</TableCell>
                      <TableCell align="right"><span className={row.gap > 0 ? "text-red-600 font-bold" : "text-green-600"}>{row.gap > 0 ? `+${row.gap.toLocaleString()}` : '0'}</span></TableCell>
                      <TableCell align="right">{row.gap > 0 ? <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">Procure +{row.gap.toLocaleString()}</span> : <span className="text-gray-400">Sufficient</span>}</TableCell>
                      <TableCell align="right">{row.potentialLoss > 0 ? <span className="text-red-600 font-bold">${(row.potentialLoss / 1000000).toFixed(1)}M</span> : <span className="text-gray-400">-</span>}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-bold text-slate-800">Urgent ({urgentGaps.length})</h3>
            </div>
            <div className="space-y-3">
              {urgentGaps.map((g, i) => (
                <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-red-900">{g.id}</div>
                      <div className="text-xs text-red-700">{g.dest}</div>
                    </div>
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">+{g.gap.toLocaleString()}</span>
                  </div>
                  <button className="w-full py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700">Act Now</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-800">Churn Risk ({dropWarnings.length})</h3>
            </div>
            <div className="space-y-3">
              {dropWarnings.map((w, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-amber-900">{w.id}</div>
                      <div className="text-xs text-amber-700">Health: {w.healthScore}</div>
                    </div>
                    <span className="text-sm font-bold text-amber-700">{(w.declineRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-amber-800 mb-2">At risk: ${(w.potentialLoss / 1000000).toFixed(1)}M</div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 flex items-center justify-center gap-1"><Phone size={12} /> Call</button>
                    <button className="flex-1 py-1.5 bg-white border border-amber-300 text-amber-700 text-xs rounded hover:bg-amber-50 flex items-center justify-center gap-1"><Mail size={12} /> Offer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ForecastModule - 完整原始代码
// ==========================================

function ForecastModule() {
  const [selectedClient, setSelectedClient] = useState<any>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">4-Week Forecast</h2>
            <p className="text-sm text-slate-500">AI predictions • Auto anomaly detection • One-click intervention</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">
          <Download size={16} /> Export All
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <TableHeader>Client</TableHeader>
                <TableHeader>Health/Risk</TableHeader>
                <TableHeader>Destination</TableHeader>
                <TableHeader align="right">W+1 (06/08)</TableHeader>
                <TableHeader align="right">W+2 (06/15)</TableHeader>
                <TableHeader align="right">W+3 (06/22)</TableHeader>
                <TableHeader align="right">W+4 (06/29)</TableHeader>
                <TableHeader align="center">Trend</TableHeader>
                <TableHeader align="center">Action</TableHeader>
              </tr>
            </thead>
            <tbody>
              {clientData.map((row, idx) => {
                const trend = (row.w4Vol - row.w1Vol) / row.w1Vol;
                const isDeclining = trend < -0.05;
                return (
                  <tr key={idx} className={`hover:bg-blue-50 ${isDeclining ? 'bg-red-50/30' : ''}`}>
                    <TableCell><span className="font-bold text-gray-900">{row.id}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${row.healthScore > 80 ? 'bg-green-100 text-green-700' : row.healthScore > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{row.healthScore}</span>
                        {row.churnRisk !== 'LOW' && <span className={`text-xs px-2 py-1 rounded ${row.churnRisk === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{row.churnRisk}</span>}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{row.dest}</span></TableCell>
                    <TableCell align="right"><div className="text-blue-700 font-medium">{row.w1Vol.toLocaleString()}</div><div className="text-xs text-emerald-600">{row.w1Wt.toLocaleString()}kg</div></TableCell>
                    <TableCell align="right"><div className="text-blue-700 font-medium">{row.w2Vol.toLocaleString()}</div><div className="text-xs text-emerald-600">{row.w2Wt.toLocaleString()}kg</div></TableCell>
                    <TableCell align="right"><div className="text-blue-700 font-medium">{row.w3Vol.toLocaleString()}</div><div className="text-xs text-emerald-600">{row.w3Wt.toLocaleString()}kg</div></TableCell>
                    <TableCell align="right"><div className={`font-medium ${isDeclining ? 'text-red-600' : 'text-blue-700'}`}>{row.w4Vol.toLocaleString()}</div><div className="text-xs text-emerald-600">{row.w4Wt.toLocaleString()}kg</div></TableCell>
                    <TableCell align="center">
                      <div className={`flex items-center justify-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span className="text-xs font-bold">{(trend * 100).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <button onClick={() => setSelectedClient(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><ArrowRight size={16} /></button>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedClient.id} Analysis</h3>
                <p className="text-sm text-slate-500">Destination: {selectedClient.dest}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle size={20} /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{selectedClient.healthScore}</div>
                  <div className="text-xs text-blue-600">Health Score</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-700">{(selectedClient.w4Vol / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-purple-600">W+4 Forecast</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">94.2%</div>
                  <div className="text-xs text-green-600">Hist. Accuracy</div>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 mb-3">AI Recommended Actions</h4>
              <div className="space-y-2">
                {(selectedClient.churnRisk === 'CRITICAL' ? [
                  { icon: Phone, text: 'Schedule VP-level client visit', urgent: true },
                  { icon: Target, text: 'Dedicated capacity guarantee plan', urgent: true },
                ] : selectedClient.churnRisk === 'HIGH' ? [
                  { icon: MessageSquare, text: 'Weekly sync with account manager', urgent: false },
                ] : [
                  { icon: Award, text: 'Recommend VIP program', urgent: false },
                ]).map((action: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${action.urgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <action.icon size={18} className={action.urgent ? 'text-red-500' : 'text-gray-500'} />
                    <span className={action.urgent ? 'text-red-800 font-medium' : 'text-gray-700'}>{action.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// BusinessValueDemo - 完整原始代码
// ==========================================

function BusinessValueDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoScenarios = [
    {
      title: "Mon 09:00 - AI Weekly Forecast",
      subtitle: "System analyzes 200+ signal sources",
      description: "ML model integrates historical orders, promo calendar, weather, social sentiment to generate W+1 to W+4 predictions.",
      stats: [{ label: "Data Processed", value: "2.4TB" }, { label: "Accuracy", value: "94.3%" }, { label: "Manual Time", value: "0 min" }],
      businessValue: ["Save 40 analyst hours/week", "Reduce forecast error from ±15% to ±6%"],
      color: "blue"
    },
    {
      title: "Mon 10:30 - Capacity Gap Alert",
      subtitle: "3 clients have 12,500 unit gap",
      description: "System identifies gap by comparing forecast demand vs available capacity. $47K at risk if not addressed.",
      stats: [{ label: "Gap Units", value: "12,500" }, { label: "Clients Affected", value: "3" }, { label: "Potential Loss", value: "$47K" }],
      businessValue: ["72-hour early warning", "Avoid penalties and churn"],
      color: "red"
    },
    {
      title: "Mon 11:15 - Scenario Comparison",
      subtitle: "AI generates 3 strategies, $23K cost diff",
      description: "Multi-objective optimization based on cost, speed, reliability, and carbon emissions.",
      stats: [{ label: "Scenarios", value: "3" }, { label: "Decision Time", value: "8 min" }, { label: "Est. Savings", value: "$15.8K" }],
      businessValue: ["3x faster decisions", "Global cost optimization"],
      color: "purple"
    },
    {
      title: "Mon 14:00 - Digital Approval",
      subtitle: "COO mobile approval in 18 minutes",
      description: "Smart routing to decision makers with e-signature and budget validation. No offline meetings needed.",
      stats: [{ label: "Approval Levels", value: "2" }, { label: "Time Used", value: "18 min" }, { label: "Traditional", value: "2 days" }],
      businessValue: ["48h → 18min approval", "Capture capacity windows"],
      color: "green"
    },
    {
      title: "Mon 16:30 - Auto Execution",
      subtitle: "PO auto-sent, carrier API confirms",
      description: "Direct system integration with top 10 carriers for order exchange, capacity confirmation, and status sync.",
      stats: [{ label: "Response Time", value: "<30min" }, { label: "Confirm Rate", value: "99.2%" }, { label: "Manual Touch", value: "0" }],
      businessValue: ["60% faster response", "Focus on strategic negotiation"],
      color: "blue"
    },
    {
      title: "Fri 17:00 - Weekly Review",
      subtitle: "94.3% accuracy, $31K saved this week",
      description: "Auto-generated execution report comparing forecast vs actual, quantifying ROI, continuously improving model.",
      stats: [{ label: "Weekly Savings", value: "$31K" }, { label: "YTD Savings", value: "$412K" }, { label: "Client Satisfaction", value: "4.8/5" }],
      businessValue: ["Quantified ROI", "Data-driven culture"],
      color: "emerald"
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setDemoStep(s => {
        if (s >= demoScenarios.length - 1) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const current = demoScenarios[demoStep];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Play size={28} className="text-blue-600" />
              End-to-End Business Process Demo
            </h2>
            <p className="text-slate-500 mt-1">From Monday forecast to Friday review — see how AI creates quantifiable business value</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setDemoStep(Math.max(0, demoStep - 1))} disabled={demoStep === 0} className="p-2 hover:bg-white rounded disabled:opacity-30"><ChevronLeft size={18} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="px-4 py-2 bg-blue-600 text-white rounded font-medium flex items-center gap-2">
              {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} fill="currentColor" /> Play</>}
            </button>
            <button onClick={() => setDemoStep(Math.min(demoScenarios.length - 1, demoStep + 1))} disabled={demoStep === demoScenarios.length - 1} className="p-2 hover:bg-white rounded disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full" />
          <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${(demoStep / (demoScenarios.length - 1)) * 100}%` }} />
          {demoScenarios.map((s, i) => (
            <button key={i} onClick={() => { setDemoStep(i); setIsPlaying(false); }} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= demoStep ? 'bg-blue-600 text-white scale-110' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="p-6 bg-blue-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">Step {demoStep + 1}/6</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{current.title}</h3>
              <p className="text-lg text-blue-700">{current.subtitle}</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">{current.description}</p>
              <div className="grid grid-cols-3 gap-4">
                {current.stats.map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Award size={20} /> Business Value</h4>
          <ul className="space-y-3">
            {current.businessValue.map((v, i) => (
              <li key={i} className="flex items-start gap-3"><CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-green-200" /><span className="text-green-50">{v}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;