import React, { useState, useEffect } from 'react';
import {
  Package, TrendingUp, ShoppingCart, Calendar,
  Download, Filter, AlertTriangle, AlertOctagon,
  Play, RefreshCw, ArrowRight, BarChart2, PieChart as PieChartIcon,
  Globe, Truck, Activity, CheckCircle, XCircle, Clock,
  Zap, TrendingDown, Users, DollarSign,
  ChevronRight, ChevronLeft, Pause,
  MessageSquare, Phone, Mail, Award, Target
} from 'lucide-react';
import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart
} from 'recharts';

// ==========================================
// Real Data Hook Import
// ==========================================
import { useRealDashboardData, useFilteredOrders } from './hooks/useRealData';

// ==========================================
// Mock Data (keep as fallback)
// ==========================================

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

interface Supplier {
  name: string;
  baseRate: number;
  aiTarget: number;
  current: number;
  status: string;
  responseTime: string | null;
  reliability: number;
}

const supplierData: Supplier[] = [
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

  const { summary, loading: realDataLoading } = useRealDashboardData();

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
                {realDataLoading ? 'Loading real data...' : `Real Data Mode • ${summary?.total_orders?.toLocaleString() || '...'} orders`}
              </p>
            </div>
          </div>
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
<NavButton id="overview" label="Market Overview" icon={Activity} active={activeTab} onClick={setActiveTab} />
<NavButton id="forecast" label="4-Week Forecast" icon={Calendar} active={activeTab} onClick={setActiveTab} />
<NavButton id="procurement" label="Procurement Plan" icon={ShoppingCart} active={activeTab} onClick={setActiveTab} />
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
        {activeTab === 'forecast' && <ForecastModule />}
        {activeTab === 'procurement' && <ProcurementModule />}
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
// Metric Card Component
// ==========================================

function MetricCard({ title, value, icon: Icon, color, alert }: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'purple' | 'cyan' | 'amber';
  alert?: boolean;
}) {
  const iconColors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    purple: 'text-violet-600 bg-violet-50',
    cyan: 'text-cyan-600 bg-cyan-50',
    red: alert ? 'text-red-600 bg-red-50' : 'text-rose-500 bg-rose-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  const valueColors = {
    blue: 'text-slate-700',
    green: 'text-slate-700',
    purple: 'text-slate-700',
    cyan: 'text-slate-700',
    red: alert ? 'text-red-600' : 'text-slate-700',
    amber: 'text-slate-700',
  };

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={iconColors[color]} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>
      </div>
      <div className={`text-base font-semibold ${valueColors[color]}`}>
        {value}
      </div>
    </div>
  );
}

// ==========================================
// OverviewModule
// ==========================================

function OverviewModule() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importMode, setImportMode] = useState<'api' | 'csv' | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: '2025-11-01',
    endDate: '2026-04-30',
  });

  const MIN_DATE = '2025-11-01';
  const MAX_DATE = '2026-04-30';

  const {
    summary,
    trendData,
    categoryChartData,
    countryDistribution,
    customerStats,
    orders,
    loading: apiLoading,
    error
  } = useRealDashboardData();

  const { filteredOrders, filters, setFilters } = useFilteredOrders(orders);

  const EXTENDED_COLORS = [
    '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8',
    '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#b91c1c',
    '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#15803d',
    '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#b45309',
    '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#6d28d9',
    '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#be185d',
    '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#0891b2',
  ];

  const handleStartDateChange = (start: string) => {
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6);

    const maxDate = new Date(MAX_DATE);
    const finalEndDate = endDate > maxDate ? maxDate : endDate;

    setDateRange({
      startDate: start,
      endDate: finalEndDate.toISOString().split('T')[0],
    });
  };

  const handleLoadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setDataLoaded(true);
    }, 1500);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setDataLoaded(true);
        setImportMode(null);
      }, 2000);
    }
  };

  const uniqueCountries = [...new Set(orders.map(o => o.country))].sort();

  const realMetrics = summary ? {
    totalOrders: summary.total_orders?.toLocaleString() || 'N/A',
    totalValue: `$${(summary.total_value / 1000).toFixed(1)}K`,
    totalWeight: `${(summary.total_weight / 1000).toFixed(1)}K kg`,
    highRiskRate: `${(summary.high_risk_rate * 100).toFixed(1)}%`,
    countryCount: summary.unique_countries || 0,
    avgOrderValue: `$${summary.avg_value?.toFixed(2) || 'N/A'}`,
  } : null;

  const displayTrendData = trendData.length > 0 ? trendData : [];
  const displayCategoryData = categoryChartData.length > 0 ? categoryChartData : [];

  // ==================== IMPORT DATA PANEL ====================
  if (!dataLoaded) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Download size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Import Data</h2>
            <p className="text-slate-500 mt-2">Load your 3PL data to start analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            <button
              onClick={() => setImportMode('api')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                importMode === 'api' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-lg ${importMode === 'api' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Sync with API</h3>
                  <p className="text-sm text-slate-500">Connect to live data source</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setImportMode('csv')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                importMode === 'csv' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-lg ${importMode === 'csv' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Upload CSV</h3>
                  <p className="text-sm text-slate-500">Import from local file</p>
                </div>
              </div>
            </button>
          </div>

          {importMode && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-gray-500" />
                  <h3 className="font-semibold text-slate-800">Select Data Period (Fixed 6 Months)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      min={MIN_DATE}
                      max={MAX_DATE}
                      value={dateRange.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Available: {MIN_DATE} to {MAX_DATE}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Auto-calculated)</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">6 months from start date</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => handleStartDateChange('2025-11-01')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      dateRange.startDate === '2025-11-01' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Nov 2025 - Apr 2026
                  </button>
                  <button
                    onClick={() => handleStartDateChange('2025-12-01')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      dateRange.startDate === '2025-12-01' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Dec 2025 - May 2026
                  </button>
                  <button
                    onClick={() => handleStartDateChange('2026-01-01')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      dateRange.startDate === '2026-01-01' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Jan 2026 - Jun 2026
                  </button>
                </div>
              </div>

              {importMode === 'api' ? (
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={24} className="animate-spin" />
                      Syncing with API...
                    </>
                  ) : (
                    <>
                      <Globe size={24} />
                      Sync Data from API
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <label className="block w-full">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <div className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer">
                      {isLoading ? (
                        <>
                          <RefreshCw size={24} className="animate-spin" />
                          Processing CSV...
                        </>
                      ) : (
                        <>
                          <Package size={24} />
                          Select CSV File
                        </>
                      )}
                    </div>
                  </label>
                  <p className="text-center text-sm text-gray-500">
                    Expected columns: Order ID, Country, Category, Value, Weight, etc.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-blue-600" />
          <span className="font-medium">Loading data...</span>
        </div>
      </div>
    );
  }

  if (apiLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-bold">Data Loading Failed</h3>
        <p className="text-red-600">{error.message}</p>
        <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  // ==================== MAIN DASHBOARD ====================
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Data Loaded Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Data Loaded</p>
            <p className="font-semibold text-slate-800">
              {dateRange.startDate} to {dateRange.endDate} • {summary?.total_orders?.toLocaleString() || '...'} orders
            </p>
          </div>
        </div>
        <button
          onClick={() => setDataLoaded(false)}
          className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
        >
          Change Data Source
        </button>
      </div>

      {/* Metrics Cards */}
      {realMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard title="Total Orders" value={realMetrics.totalOrders} icon={Package} color="blue" />
          <MetricCard title="Total Value" value={realMetrics.totalValue} icon={DollarSign} color="green" />
          <MetricCard title="Total Weight" value={realMetrics.totalWeight} icon={Truck} color="purple" />
          <MetricCard title="Avg Order Value" value={realMetrics.avgOrderValue} icon={TrendingUp} color="cyan" />
          <MetricCard title="High Risk Rate" value={realMetrics.highRiskRate} alert={summary!.high_risk_rate > 0.1} icon={AlertTriangle} color="red" />
          <MetricCard title="Countries" value={realMetrics.countryCount.toString()} icon={Globe} color="amber" />
        </div>
      )}

      {/* Header with Show Details Button */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Market Overview</h2>
            <p className="text-sm text-slate-500">
              Based on {summary?.total_orders?.toLocaleString() || '...'} real orders •
              Data period: {dateRange.startDate} ~ {dateRange.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
          >
            <Target size={16} />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <Globe size={16} />
            <span>Countries: <strong>{countryDistribution.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Country Distribution */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800">Orders by Country (Top 10)</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" /> Actual Orders
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} fill="url(#colorVol)" name="Orders" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Category Distribution</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayCategoryData}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {displayCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, _name: string, props: any) => [`${value.toLocaleString()} orders`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
            {displayCategoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXTENDED_COLORS[i % EXTENDED_COLORS.length] }} />
                  <span className="text-slate-600 truncate max-w-[120px]" title={cat.name}>{cat.name}</span>
                </div>
                <span className="text-slate-500">{cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== CUSTOMER STATISTICS (常规显示) ========== */}
      {customerStats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-slate-800">Customer Statistics Detail</h3>
            <p className="text-sm text-gray-500 mt-1">Top customers by order volume • Customer names masked for privacy</p>
          </div>
          <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Customer ID</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Value</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Weight (kg)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Top 3 Countries</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Market Share</th>
                </tr>
              </thead>
              <tbody>
                {customerStats.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <Users size={14} className="text-slate-500" />
                        </div>
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {cust.customer}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                      {cust.orders.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      ${cust.totalValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {cust.totalWeight.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cust.topCountries.map((country, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium"
                          >
                            {country}
                            {i < cust.topCountries.length - 1 && (
                              <span className="text-blue-400 ml-1">›</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(cust.marketShare, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-10">
                          {cust.marketShare.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customerStats.length >= 20 && (
            <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing top 20 customers
            </div>
          )}
        </div>
      )}

      {/* ========== ORDER DATA EXPLORER (受 showDetails 控制) ========== */}
      {showDetails && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Filter size={18} />
                Order Data Explorer
                <span className="text-sm font-normal text-gray-500">({filteredOrders.length} of {orders.length} records)</span>
              </h3>

              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search order ID, product, country..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-64"
                />

                <select
                  multiple
                  value={filters.countries}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, o => o.value);
                    setFilters(f => ({ ...f, countries: selected }));
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-32"
                  title="Filter by Country"
                >
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk (&ge;70%)</option>
                  <option value="medium">Medium Risk (40-70%)</option>
                  <option value="low">Low Risk (&lt;40%)</option>
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={filters.minValue}
                    onChange={(e) => setFilters(f => ({ ...f, minValue: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-20"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max $"
                    value={filters.maxValue}
                    onChange={(e) => setFilters(f => ({ ...f, maxValue: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-20"
                  />
                </div>

                <button
                  onClick={() => setFilters({ countries: [], categories: [], minValue: '', maxValue: '', riskLevel: 'all', searchTerm: '' })}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            {(filters.countries.length > 0 || filters.riskLevel !== 'all' || filters.minValue || filters.maxValue || filters.searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.countries.map(c => (
                  <span key={c} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                    Country: {c}
                    <button onClick={() => setFilters(f => ({ ...f, countries: f.countries.filter(x => x !== c) }))}>×</button>
                  </span>
                ))}
                {filters.riskLevel !== 'all' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                    Risk: {filters.riskLevel}
                    <button onClick={() => setFilters(f => ({ ...f, riskLevel: 'all' }))}>×</button>
                  </span>
                )}
                {filters.searchTerm && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                    Search: "{filters.searchTerm}"
                    <button onClick={() => setFilters(f => ({ ...f, searchTerm: '' }))}>×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Value ($)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Weight (kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Value/kg</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Risk Score</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 100).map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{order.order_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{order.country}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={order.product_keyword}>{order.product_keyword || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">${order.declared_value?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{order.weight_kg?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">${order.value_per_kg?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.risk_score > 0.7 ? 'bg-red-100 text-red-700' :
                        order.risk_score > 0.4 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {(order.risk_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        order.logistics_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.logistics_status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                        order.logistics_status === 'customs_hold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.logistics_status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-gray-500">No records match your filters. Try adjusting your criteria.</div>
          )}

          {filteredOrders.length > 100 && (
            <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing first 100 of {filteredOrders.length} records. Use filters to narrow down.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// ProcurementModule
// ==========================================

function ProcurementModule() {
  const [workflowState, setWorkflowState] = useState('analysis');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>(supplierData);
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
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between relative">
          {workflowSteps.map((step, index, arr) => (
            <React.Fragment key={step.key}>
              <div className={`flex flex-col items-center gap-2 ${workflowState === step.key ? 'opacity-100' : getStepIndex(workflowState) > index ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${workflowState === step.key ? 'bg-blue-600 text-white animate-pulse' : getStepIndex(workflowState) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <step.icon size={20} />
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
              {index < arr.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${getStepIndex(workflowState) > index ? 'bg-green-500' : 'bg-gray-200'}`} />
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
// ForecastModule
// ==========================================

// ==========================================
// ForecastModule - AI Predict Center
// ==========================================

function ForecastModule() {
  const [workflowState, setWorkflowState] = useState('idle'); // idle, running, completed
  const [isRunning, setIsRunning] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [urgentGaps, setUrgentGaps] = useState<any[]>([]);

  // 从 useRealDashboardData 获取数据
  const { summary, loading: apiLoading } = useRealDashboardData();

  const handleRunAI = () => {
    setIsRunning(true);
    setWorkflowState('running');

    // 模拟 AI 运行
    setTimeout(() => {
      fetchForecastData();
      setIsRunning(false);
      setWorkflowState('completed');
    }, 2000);
  };

  const fetchForecastData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/forecast-analysis');
      const data = await response.json();
      setForecastData(data.forecasts || []);
      setPerformanceMetrics(data.performance || null);

      // 筛选 urgent gaps (gap > 0 且按 gap 大小排序)
      const urgent = (data.forecasts || [])
        .filter((d: any) => d.gap > 0)
        .sort((a: any, b: any) => b.gap - a.gap)
        .slice(0, 5);
      setUrgentGaps(urgent);
    } catch (error) {
      console.error('Failed to fetch forecast data:', error);
    }
  };

  // 健康分数颜色
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getHealthTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* AI Predict Center Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI Predict Center</h2>
            <p className="text-sm text-slate-500">
              4-week demand forecasting • WAPE validation • Capacity gap analysis
            </p>
          </div>
        </div>
        <button
          onClick={handleRunAI}
          disabled={isRunning || workflowState === 'completed'}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-md shadow-sm transition-all flex items-center gap-2"
        >
          {isRunning ? (
            <><RefreshCw size={16} className="animate-spin" /> Running AI...</>
          ) : workflowState === 'completed' ? (
            <><CheckCircle size={16} /> Analysis Complete</>
          ) : (
            <><Play size={16} fill="currentColor" /> Run AI Engine</>
          )}
        </button>
      </div>

      {/* Performance Metrics Card (显示模型性能) */}
      {workflowState === 'completed' && performanceMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            Model Performance Review
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Overall WAPE</div>
              <div className="text-2xl font-bold text-blue-600">{performanceMetrics.overall_wape}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Core Accounts (50+)</div>
              <div className="text-2xl font-bold text-green-600">{performanceMetrics.core_wape}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Head Accounts (21-50)</div>
              <div className="text-2xl font-bold text-amber-600">{performanceMetrics.head_wape}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Monthly Cumulative Error</div>
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics.monthly_error}%</div>
            </div>
          </div>

          
        </div>
      )}

      {workflowState === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Main Table */}
          <div className="lg:col-span-3">
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
                    <tr className="bg-gray-50">
                      <TableHeader>Client ID</TableHeader>
                      <TableHeader>Health</TableHeader>
                      <TableHeader>Destination</TableHeader>
                      <TableHeader align="right">AI Pred. (W+1)</TableHeader>
                      <TableHeader align="right">Allocated Cap.</TableHeader>
                      <TableHeader align="right">Gap</TableHeader>
                      <TableHeader align="right">Recommendation</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell>
                          <span className="font-bold text-gray-900">{row.client_id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-16 h-2 rounded-full ${getHealthColor(row.health_score)}`}
                                 style={{ opacity: Math.max(0.3, row.health_score / 100) }} />
                            <span className={`text-xs font-bold ${getHealthTextColor(row.health_score)}`}>
                              {row.health_score}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-500 text-xs">{row.destination}</span>
                        </TableCell>
                        <TableCell align="right">
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                            {row.ai_pred_w1.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          {row.allocated_cap.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <span className={row.gap > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                            {row.gap > 0 ? `+${row.gap.toLocaleString()}` : '0'}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          {row.gap > 0 ? (
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              Procure +{row.gap.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sufficient</span>
                          )}
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {forecastData.length === 0 && (
                <div className="p-8 text-center text-gray-500">No forecast data available</div>
              )}
            </div>
          </div>

          {/* Urgent Sidebar */}
          <div className="space-y-4">
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
                        <div className="text-sm font-bold text-red-900">{g.client_id}</div>
                        <div className="text-xs text-red-700">{g.destination}</div>
                      </div>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                        +{g.gap.toLocaleString()}
                      </span>
                    </div>
                    <button className="w-full py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                      Act Now
                    </button>
                  </div>
                ))}

                {urgentGaps.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-4">No urgent gaps</div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-3 text-sm">Forecast Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Entities</span>
                  <span className="font-medium">{forecastData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">With Capacity Gap</span>
                  <span className="font-medium text-red-600">
                    {forecastData.filter(d => d.gap > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Gap Volume</span>
                  <span className="font-medium">
                    {forecastData.reduce((sum, d) => sum + Math.max(0, d.gap), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {workflowState === 'idle' && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Play size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Ready to Run AI Forecast</h3>
          <p className="text-gray-500 mt-2">Click "Run AI Engine" to generate 4-week predictions and capacity analysis</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// BusinessValueDemo
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