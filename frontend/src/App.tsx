import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, TrendingUp, ShoppingCart, Calendar,
  Download, Filter, AlertTriangle, AlertOctagon,
  Play, RefreshCw, ArrowRight, BarChart2, PieChart as PieChartIcon,
  Globe, Truck, Activity, CheckCircle, XCircle, Clock,
  Zap, TrendingDown, Users, DollarSign,
  ChevronRight, ChevronLeft, Pause,
  MessageSquare, Phone, Mail, Award, Target, HelpCircle,
  Search, ChevronDown, Loader2, AlertCircle, BarChart3,
} from 'lucide-react';
import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart, Bar, Line, Legend,
} from 'recharts';

// ==========================================
// Real Data Hook Import
// ==========================================
import { useRealDashboardData, useFilteredOrders } from './hooks/useRealData';

// Type Definitions
interface WeekData {
  v: number;
  w: number;
}

interface ForecastRow {
  entity_id: string;
  client_full: string;
  client_id: string;
  client_sub_id: string;
  dest: string;
  category: string;
  w1: WeekData;
  w2: WeekData;
  w3: WeekData;
  w4: WeekData;
  total_4wk_vol: number;
  total_4wk_wt: number;
}

interface ChartData {
  name: string;
  volume: number;
  weight: number;
}

interface PerformanceMetrics {
  overall_wape: number;
  core_wape: number;
  head_wape: number;
  monthly_error: number;
}

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

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
<NavButton id="operation" label="Operation Plan" icon={TrendingUp} active={activeTab} onClick={setActiveTab} />
<NavButton id="demo" label="Business Value Demo" icon={Play} active={activeTab} onClick={setActiveTab} />
          </nav>
        </div>
      </header>

      {/* Operations Command Bar */}
<div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
  <div className="flex items-center gap-8">
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">Active Shipments</div>
      <div className="text-2xl font-bold text-white">170,934 <span className="text-green-400 text-sm">+12%</span></div>
    </div>
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">On-Time Rate</div>
      <div className="text-2xl font-bold text-white">96.8% <span className="text-green-400 text-sm">+2.3%</span></div>
    </div>
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">Space Utilization</div>
      <div className="text-2xl font-bold text-white">78.5% <span className="text-green-400 text-sm">+3.2%</span></div>
    </div>
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">On-Duty Staff</div>
      <div className="text-2xl font-bold text-white">342 <span className="text-green-400 text-sm">+8</span></div>
    </div>
  </div>
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium text-slate-200">LIVE</span>
    </div>
  </div>
</div>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && <OverviewModule />}
        {activeTab === 'forecast' && <ForecastModule />}
        {activeTab === 'operation' && <OperationPlanModule />}
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
// Operation Plan Module - AI-Driven Operational Insights
// ==========================================

function OperationPlanModule() {
  const [workflowState, setWorkflowState] = useState('idle');
  const [isRunning, setIsRunning] = useState(false);

  const [capacityGapData, setCapacityGapData] = useState<any[]>([]);
  const [urgentActions, setUrgentActions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [destFilter, setDestFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');

  // ==========================================
  // Run Analysis Handler
  // ==========================================
  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setWorkflowState('running');
    setError(null);

    // Simulate analysis processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const response = await fetch(`${API_BASE_URL}/api/operation-analysis`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      setCapacityGapData(data.capacity_gap_analysis || []);
      setUrgentActions(data.urgent_actions || []);
      setAnomalies(data.anomalies || null);
      setInsights(data.insights || null);

      setWorkflowState('completed');
    } catch (err) {
      console.error('Failed to run operation analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
      setWorkflowState('idle');
    } finally {
      setIsRunning(false);
    }
  };

  // ==========================================
  // Helper: Get health color
  // ==========================================
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // ==========================================
  // Filter Logic
  // ==========================================
  const uniqueDests = useMemo(() => {
    return Array.from(new Set(capacityGapData.map(d => d.destination))).sort();
  }, [capacityGapData]);

  const filteredData = useMemo(() => {
    return capacityGapData.filter(item => {
      const matchSearch =
        item.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_full.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDest = destFilter === 'ALL' || item.destination === destFilter;

      const matchHealth =
        healthFilter === 'ALL' ||
        (healthFilter === 'HIGH' && item.health_score >= 80) ||
        (healthFilter === 'MEDIUM' && item.health_score >= 60 && item.health_score < 80) ||
        (healthFilter === 'LOW' && item.health_score < 60);

      return matchSearch && matchDest && matchHealth;
    });
  }, [capacityGapData, searchTerm, destFilter, healthFilter]);

  // ==========================================
  // Render Error State
  // ==========================================
  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} className="text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Analysis Failed</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setWorkflowState('idle');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Idle State
  // ==========================================
  if (workflowState === 'idle') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* AI Operation Analysis Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-8 rounded-xl border border-indigo-100 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <TrendingUp size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Operation Analysis</h2>
          <p className="text-slate-600 mb-6">
            AI-driven capacity planning • Demand forecasting • Operational insights
          </p>

          <button
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-base font-semibold rounded-lg shadow-lg transition-all"
          >
            {isRunning ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Start Analysis
              </>
            )}
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
            <BarChart3 size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Ready to Analyze Operations</h3>
          <p className="text-gray-500">Click "Start Analysis" to generate capacity gap insights and recommendations</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Running State
  // ==========================================
  if (workflowState === 'running') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-xl border border-indigo-200 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Operations...</h3>
            <p className="text-slate-500">Processing demand forecasts and capacity constraints</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Completed State (Main Dashboard)
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header with Re-run Button */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI Operation Analysis</h2>
            <p className="text-sm text-slate-500">
              Capacity planning & demand insights • Analysis complete
            </p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isRunning ? (
            <><RefreshCw size={16} className="animate-spin" /> Re-running...</>
          ) : (
            <><RefreshCw size={16} /> Re-run Analysis</>
          )}
        </button>
      </div>

      {/* Summary Metrics */}
      {insights && insights.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Capacity Gap"
            value={`+${insights.summary.total_gap.toLocaleString()}`}
            color="text-red-600"
          />
          <StatCard
            title="Predicted Volume (W+1)"
            value={insights.summary.total_predicted_vol.toLocaleString()}
            color="text-blue-600"
          />
          <StatCard
            title="Avg Health Score"
            value={`${insights.summary.avg_health_score}/100`}
            color="text-green-600"
          />
          <StatCard
            title="Allocation Coverage"
            value={`${insights.summary.utilization_pct}%`}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Main Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Capacity Gap Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Table Header with Filters */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" />
              Capacity Gap & Client Health Analysis
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-48"
                />
              </div>

              {/* Destination Filter */}
              <div className="relative">
                <select
                  value={destFilter}
                  onChange={(e) => setDestFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="ALL">All Destinations</option>
                  {uniqueDests.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Health Filter */}
              <div className="relative">
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="ALL">All Health Levels</option>
                  <option value="HIGH">High (80+)</option>
                  <option value="MEDIUM">Medium (60-79)</option>
                  <option value="LOW">Low (&lt;60)</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table Content - Scrollable */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
  <div className="flex items-center gap-1 group relative">
    Health
    <div className="relative">
      <HelpCircle size={14} className="text-gray-400 cursor-help" />
      <div className="invisible group-hover:visible absolute left-0 top-6 w-72 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg z-50 normal-case font-normal">
        <div className="font-semibold mb-2">Health Score Formula (0-100)</div>
        <div className="space-y-1 text-left">
          <div><strong>Base:</strong> 70 points</div>
          <div className="mt-2"><strong>Trend Adjustment:</strong></div>
          <div className="ml-2">• Stable (-10% to +10%): +15</div>
          <div className="ml-2">• Fast growth (&gt;10%): -15</div>
          <div className="ml-2">• Declining (&lt;-30%): -20</div>
          <div className="mt-2"><strong>Gap Adjustment:</strong></div>
          <div className="ml-2">• Perfect match (0): +15</div>
          <div className="ml-2">• Small gap (&lt;10): +5</div>
          <div className="ml-2">• Medium gap (20-50): -10</div>
          <div className="ml-2">• Large gap (&gt;50): -20</div>
        </div>
      </div>
    </div>
  </div>
</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Dest.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">AI Pred. (W+1)</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Allocated</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Gap</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredData.map((row, idx) => (
                  <tr key={row.entity_id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800 text-sm">{row.client_id}</div>
                      <div className="text-xs text-gray-400">{row.destination}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getHealthColor(row.health_score)}`}
                            style={{ width: `${row.health_score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${getHealthTextColor(row.health_score)}`}>
                          {row.health_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {row.destination}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-indigo-600">{row.ai_pred_w1.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-slate-700">{row.allocated_cap.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {row.gap > 0 ? (
                        <div className="font-bold text-red-600">+{row.gap.toLocaleString()}</div>
                      ) : row.gap === 0 ? (
                        <div className="font-bold text-green-600">0</div>
                      ) : (
                        <div className="font-bold text-blue-600">{row.gap.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {row.rec_type === 'sufficient' ? (
                        <span className="text-green-600 text-sm font-medium">{row.recommendation}</span>
                      ) : row.rec_type === 'surplus' ? (
                        <span className="text-blue-600 text-sm font-medium">{row.recommendation}</span>
                      ) : (
                        <span className="text-indigo-600 text-sm font-medium">{row.recommendation}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredData.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
              Showing {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
              {filteredData.length > 10 && ' (scroll to view more)'}
            </div>
          )}
        </div>

        {/* Right Column: Insights (1/3 width) */}
        <div className="space-y-6">

          {/* Next Week Actions - Enhanced with expandable and semantic colors */}
          {insights && insights.next_week_actions && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 rounded-lg">
                    <Calendar size={16} className="text-white" />
                  </div>
                  Next Week Actions
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {insights.next_week_actions.map((action: any, idx: number) => {
                  const actionText = typeof action === 'string' ? action : action.text;
                  const clients = typeof action === 'object' ? action.clients : null;

                  // Determine semantic color based on action content
                  let textColor = 'text-slate-700';
                  let iconColor = 'text-blue-600';
                  let bgColor = 'bg-blue-100';
                  let hoverBg = 'hover:bg-blue-50';

                  if (actionText.toLowerCase().includes('urgent') || actionText.toLowerCase().includes('allocate')) {
                    textColor = 'text-red-700 font-medium';
                    iconColor = 'text-red-600';
                    bgColor = 'bg-red-100';
                    hoverBg = 'hover:bg-red-50';
                  } else if (actionText.toLowerCase().includes('monitor') || actionText.toLowerCase().includes('decline')) {
                    textColor = 'text-amber-700';
                    iconColor = 'text-amber-600';
                    bgColor = 'bg-amber-100';
                    hoverBg = 'hover:bg-amber-50';
                  } else if (actionText.toLowerCase().includes('surplus') || actionText.toLowerCase().includes('可释放')) {
                    textColor = 'text-green-700';
                    iconColor = 'text-green-600';
                    bgColor = 'bg-green-100';
                    hoverBg = 'hover:bg-green-50';
                  }

                  return (
                    <details key={idx} className="group">
                      <summary className={`cursor-pointer list-none flex items-start gap-2 p-2.5 rounded-lg transition-colors ${hoverBg}`}>
                        <div className={`mt-0.5 p-1 ${bgColor} rounded group-open:rotate-90 transition-transform`}>
                          <ChevronRight size={14} className={iconColor} />
                        </div>
                        <span className={`text-sm flex-1 text-left ${textColor}`}>{actionText}</span>
                      </summary>
                      <div className="ml-8 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-left">
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">
                          {actionText.toLowerCase().includes('allocate') && 'Priority action: Review client forecasts and prepare capacity allocation plan for upcoming week.'}
                          {actionText.toLowerCase().includes('urgent') && 'High priority: Immediate capacity expansion needed to prevent service disruption.'}
                          {actionText.toLowerCase().includes('monitor') && 'Watch closely: Track demand patterns and prepare contingency plans if decline continues.'}
                          {actionText.toLowerCase().includes('surplus') && 'Optimization opportunity: Consider redistributing excess capacity to clients with gaps.'}
                          {actionText.toLowerCase().includes('coverage') && 'Current allocation efficiency metric. Target: maintain 85-95% coverage.'}
                          {!actionText.toLowerCase().includes('allocate') && !actionText.toLowerCase().includes('urgent') && !actionText.toLowerCase().includes('monitor') && !actionText.toLowerCase().includes('surplus') && !actionText.toLowerCase().includes('coverage') && 'Review this metric and adjust operational plans accordingly.'}
                        </p>
                        {clients && clients.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Affected Clients:</p>
                            <div className="space-y-1.5">
                              {clients.map((client: any, cidx: number) => (
                                <div key={cidx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-slate-800">{client.id}</span>
                                    <span className="text-xs text-gray-500">({client.dest})</span>
                                  </div>
                                  {client.gap !== undefined && (
                                    <span className={`text-xs font-bold ${client.gap > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                      {client.gap > 0 ? '+' : ''}{client.gap}
                                    </span>
                                  )}
                                  {client.trend !== undefined && (
                                    <span className={`text-xs font-bold ${client.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {client.trend >= 0 ? '+' : ''}{client.trend}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4-Week Trend Alerts - Enhanced with expandable and semantic colors */}
          {insights && insights.four_week_trends && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
                <h3 className="font-bold text-amber-800 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-600 rounded-lg">
                    <TrendingUp size={16} className="text-white" />
                  </div>
                  4-Week Trend Alerts
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {insights.four_week_trends.map((trend: any, idx: number) => {
                  const trendText = typeof trend === 'string' ? trend : trend.text;
                  const clients = typeof trend === 'object' ? trend.clients : null;

                  // Determine semantic color based on trend content
                  let textColor = 'text-slate-700';
                  let iconColor = 'text-amber-600';
                  let bgColor = 'bg-amber-100';
                  let hoverBg = 'hover:bg-amber-50';

                  if (trendText.toLowerCase().includes('growth') || trendText.toLowerCase().includes('growing')) {
                    textColor = 'text-green-700 font-medium';
                    iconColor = 'text-green-600';
                    bgColor = 'bg-green-100';
                    hoverBg = 'hover:bg-green-50';
                  } else if (trendText.toLowerCase().includes('risk') || trendText.toLowerCase().includes('drop')) {
                    textColor = 'text-red-700 font-medium';
                    iconColor = 'text-red-600';
                    bgColor = 'bg-red-100';
                    hoverBg = 'hover:bg-red-50';
                  } else if (trendText.toLowerCase().includes('stable')) {
                    textColor = 'text-blue-700';
                    iconColor = 'text-blue-600';
                    bgColor = 'bg-blue-100';
                    hoverBg = 'hover:bg-blue-50';
                  }

                  return (
                    <details key={idx} className="group">
                      <summary className={`cursor-pointer list-none flex items-start gap-2 p-2.5 rounded-lg transition-colors ${hoverBg}`}>
                        <div className={`mt-0.5 p-1 ${bgColor} rounded group-open:rotate-90 transition-transform`}>
                          <ChevronRight size={14} className={iconColor} />
                        </div>
                        <span className={`text-sm flex-1 text-left ${textColor}`}>{trendText}</span>
                      </summary>
                      <div className="ml-8 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-left">
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">
                          {trendText.toLowerCase().includes('health score') && 'Overall client health metric. Higher scores indicate better demand stability and capacity alignment.'}
                          {trendText.toLowerCase().includes('growth') && 'Positive indicator: These clients show strong upward demand trends. Consider proactive capacity planning.'}
                          {trendText.toLowerCase().includes('risk') && 'Warning: Declining demand may indicate market changes or client issues. Investigate root causes.'}
                          {trendText.toLowerCase().includes('stable') && 'Good sign: Demand patterns are predictable and consistent across the client base.'}
                          {trendText.toLowerCase().includes('volume') && 'Total projected demand across all clients for the 4-week forecast period.'}
                          {!trendText.toLowerCase().includes('health') && !trendText.toLowerCase().includes('growth') && !trendText.toLowerCase().includes('risk') && !trendText.toLowerCase().includes('stable') && !trendText.toLowerCase().includes('volume') && 'Long-term trend indicator. Monitor this metric over multiple forecast cycles.'}
                        </p>
                        {clients && clients.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Client Details:</p>
                            <div className="space-y-1.5">
                              {clients.map((client: any, cidx: number) => (
                                <div key={cidx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-slate-800">{client.id}</span>
                                    <span className="text-xs text-gray-500">({client.dest})</span>
                                  </div>
                                  {client.trend !== undefined && (
                                    <span className={`text-xs font-bold ${client.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {client.trend >= 0 ? '+' : ''}{client.trend}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}


// ==========================================
// ForecastModule Component
// 用这个函数替换 App.tsx 中原来的 ForecastModule 函数
// ==========================================
// ==========================================
// ForecastModule v2 - 最终版本
// ==========================================
//
// 新功能:
// 1. "Run AI Engine" 按钮 - 点击后才显示数据
// 2. 更新的 Performance 指标 (按订单量分层的WAPE)
// 3. 使用 fake_mapping 的 category 名称
// 4. 表格限制10行 + 滚动条
//
// ==========================================

function ForecastModule() {
  // Workflow state: 'idle' | 'running' | 'completed'
  const [workflowState, setWorkflowState] = useState('idle');
  const [isRunning, setIsRunning] = useState(false);

  const [tableData, setTableData] = useState<ForecastRow[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [destFilter, setDestFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [weekFilter, setWeekFilter] = useState('ALL');

  // ==========================================
  // Run AI Engine Handler
  // ==========================================
  const handleRunAI = async () => {
    setIsRunning(true);
    setWorkflowState('running');
    setError(null);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch data from backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/forecast-table`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Process table data
      setTableData(data.table_data || []);

      // Process chart data
      const chartDataFromAPI = data.chart_data;
      if (chartDataFromAPI) {
        const formattedChartData: ChartData[] = [
          { name: 'W+1', volume: chartDataFromAPI.w1.volume, weight: chartDataFromAPI.w1.weight },
          { name: 'W+2', volume: chartDataFromAPI.w2.volume, weight: chartDataFromAPI.w2.weight },
          { name: 'W+3', volume: chartDataFromAPI.w3.volume, weight: chartDataFromAPI.w3.weight },
          { name: 'W+4', volume: chartDataFromAPI.w4.volume, weight: chartDataFromAPI.w4.weight },
        ];
        setChartData(formattedChartData);
      }

      // Set performance metrics
      setPerformanceMetrics(data.performance_metrics || null);

      setWorkflowState('completed');
    } catch (err) {
      console.error('Failed to fetch forecast data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forecast data');
      setWorkflowState('idle');
    } finally {
      setIsRunning(false);
    }
  };

  // ==========================================
  // Filter Logic
  // ==========================================
  const uniqueDests = useMemo(() => {
    return Array.from(new Set(tableData.map(d => d.dest))).sort();
  }, [tableData]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(tableData.map(d => d.category))).sort();
  }, [tableData]);

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchSearch =
        item.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_sub_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_full.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDest = destFilter === 'ALL' || item.dest === destFilter;
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchDest && matchCategory;
    });
  }, [tableData, searchTerm, destFilter, categoryFilter]);

  // ==========================================
  // Export to CSV Handler
  // ==========================================
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Client ID', 'Destination', 'Category',
                     'W+1 Vol', 'W+1 Wt', 'W+2 Vol', 'W+2 Wt',
                     'W+3 Vol', 'W+3 Wt', 'W+4 Vol', 'W+4 Wt',
                     'Total Vol', 'Total Wt'];

    const rows = filteredData.map(row => [
      row.client_id,
      row.dest,
      row.category,
      row.w1.v, row.w1.w,
      row.w2.v, row.w2.w,
      row.w3.v, row.w3.w,
      row.w4.v, row.w4.w,
      row.total_4wk_vol, row.total_4wk_wt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_4week_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // Render Error State
  // ==========================================
  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} className="text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Failed to Load Forecast Data</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setWorkflowState('idle');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Idle State (Initial)
  // ==========================================
  if (workflowState === 'idle') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* AI Predict Center Header */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Calendar size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Predict Center</h2>
          <p className="text-slate-500 mb-6">4-week volume and weight demand forecasting</p>

          <button
            onClick={handleRunAI}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-base font-semibold rounded-lg shadow-lg transition-all"
          >
            {isRunning ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Running AI Engine...
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Run AI Engine
              </>
            )}
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
            <Play size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Ready to Run AI Forecast</h3>
          <p className="text-gray-500">Click "Run AI Engine" to generate 4-week predictions</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Running State
  // ==========================================
  if (workflowState === 'running') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Running AI Engine...</h3>
            <p className="text-slate-500">Analyzing historical data and generating predictions</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Completed State (Main Dashboard)
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* AI Predict Center Header with Re-run Button */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI Predict Center</h2>
            <p className="text-sm text-slate-500">4-week demand forecasting • Analysis complete</p>
          </div>
        </div>
        <button
          onClick={handleRunAI}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isRunning ? (
            <><RefreshCw size={16} className="animate-spin" /> Re-running...</>
          ) : (
            <><RefreshCw size={16} /> Re-run Forecast</>
          )}
        </button>
      </div>

      {/* Performance Metrics Card - Updated Format */}
      {performanceMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            WAPE Water Levels by Volume Tier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="1-5 orders (Long-tail)"
              value={`${performanceMetrics.long_tail_wape}%`}
              color="text-red-600"
            />
            <StatCard
              title="6-20 orders (Mid-tier)"
              value={`${performanceMetrics.mid_tier_wape}%`}
              color="text-amber-600"
            />
            <StatCard
              title="21-50 orders (Head)"
              value={`${performanceMetrics.head_wape}%`}
              color="text-blue-600"
            />
            <StatCard
              title="50+ orders (Core)"
              value={`${performanceMetrics.core_wape}%`}
              color="text-green-600"
            />
          </div>
        </div>
      )}

      {/* Overall Trend Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-6">Overall 4-Week Trend</h3>
        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="volume"
                  name="Volume (Pieces)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading chart data...
            </div>
          )}
        </div>
      </div>

      {/* Forecast Table - With max height and scroll */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Table Header with Filters */}
        <div className="p-6 border-b border-gray-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <Filter size={18} className="text-gray-500" />
            4-Week Volume & Weight Forecast
            {filteredData.length < tableData.length && (
              <span className="text-sm font-normal text-gray-500">
                ({filteredData.length} of {tableData.length})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Client ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none w-48"
              />
            </div>

            {/* Destination Filter */}
            <div className="relative">
              <select
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="ALL">All Destinations</option>
                {uniqueDests.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Week Filter */}
            <div className="relative">
              <select
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="ALL">Show All 4 Weeks</option>
                <option value="W1">Week +1 Only</option>
                <option value="W2">Week +2 Only</option>
                <option value="W3">Week +3 Only</option>
                <option value="W4">Week +4 Only</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table Content - Limited height with scroll */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="min-w-full text-left">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Client / Customer
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Category
                </th>

                {(weekFilter === 'ALL' || weekFilter === 'W1') && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center bg-blue-50/30">
                    <div className="text-blue-600">Week +1</div>
                    <div className="font-normal mt-0.5">Vol / Wt (kg)</div>
                  </th>
                )}
                {(weekFilter === 'ALL' || weekFilter === 'W2') && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                    <div className="text-gray-500">Week +2</div>
                    <div className="font-normal mt-0.5">Vol / Wt (kg)</div>
                  </th>
                )}
                {(weekFilter === 'ALL' || weekFilter === 'W3') && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                    <div className="text-gray-500">Week +3</div>
                    <div className="font-normal mt-0.5">Vol / Wt (kg)</div>
                  </th>
                )}
                {(weekFilter === 'ALL' || weekFilter === 'W4') && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                    <div className="text-gray-500">Week +4</div>
                    <div className="font-normal mt-0.5">Vol / Wt (kg)</div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredData.map((row, idx) => (
                <tr key={row.entity_id || idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-800">{row.client_id}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{row.client_sub_id}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                      {row.dest}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-600 max-w-[200px] truncate" title={row.category}>
                    {row.category}
                  </td>

                  {(weekFilter === 'ALL' || weekFilter === 'W1') && (
                    <td className="px-6 py-5 text-center bg-blue-50/10">
                      <div className="font-bold text-blue-600">{row.w1.v}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{row.w1.w.toFixed(2)}</div>
                    </td>
                  )}
                  {(weekFilter === 'ALL' || weekFilter === 'W2') && (
                    <td className="px-6 py-5 text-center">
                      <div className="font-bold text-slate-800">{row.w2.v}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{row.w2.w.toFixed(2)}</div>
                    </td>
                  )}
                  {(weekFilter === 'ALL' || weekFilter === 'W3') && (
                    <td className="px-6 py-5 text-center">
                      <div className="font-bold text-slate-800">{row.w3.v}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{row.w3.w.toFixed(2)}</div>
                    </td>
                  )}
                  {(weekFilter === 'ALL' || weekFilter === 'W4') && (
                    <td className="px-6 py-5 text-center">
                      <div className="font-bold text-slate-800">{row.w4.v}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{row.w4.w.toFixed(2)}</div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No data found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Show record count */}
        {filteredData.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
            Showing {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
            {filteredData.length > 10 && ' (scroll to view more)'}
          </div>
        )}
      </div>

    </div>
  );
}


// ==========================================
// StatCard Component (添加到 ForecastModule 之后)
// ==========================================
function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center justify-center text-center border border-gray-100">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
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