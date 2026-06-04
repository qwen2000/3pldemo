import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Calendar, Download, Target, Search, ChevronDown, Activity,
  ShoppingCart, Filter, Loader2, AlertCircle
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';

// ==========================================
// Type Definitions
// ==========================================
interface WeekData {
  v: number;  // volume
  w: number;  // weight
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

// ==========================================
// API Configuration
// ==========================================
const API_BASE_URL = 'http://localhost:8000';

// ==========================================
// ForecastModule Component
// ==========================================
export default function ForecastModule() {
  const [tableData, setTableData] = useState<ForecastRow[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [destFilter, setDestFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [weekFilter, setWeekFilter] = useState('ALL');

  // ==========================================
  // Fetch Data from Backend
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

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

      } catch (err) {
        console.error('Failed to fetch forecast data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load forecast data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
  if (error && !isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} className="text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Failed to Load Forecast Data</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Performance Metrics Card */}
      {performanceMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            Model Performance Review
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Overall WAPE"
              value={`${performanceMetrics.overall_wape}%`}
              color="text-blue-600"
            />
            <StatCard
              title="Core Accounts (50+)"
              value={`${performanceMetrics.core_wape}%`}
              color="text-green-600"
            />
            <StatCard
              title="Head Accounts (21-50)"
              value={`${performanceMetrics.head_wape}%`}
              color="text-amber-500"
            />
            <StatCard
              title="Monthly Cumulative Error"
              value={`${performanceMetrics.monthly_error}%`}
              color="text-purple-600"
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

      {/* Forecast Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] relative">

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

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 mt-32">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
            <p className="text-sm text-gray-500">Loading forecast data from server...</p>
          </div>
        )}

        {/* Table Content */}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
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
              <tbody className="divide-y divide-gray-100">
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
                {filteredData.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No data found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// StatCard Component
// ==========================================
function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center justify-center text-center border border-gray-100">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
