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
