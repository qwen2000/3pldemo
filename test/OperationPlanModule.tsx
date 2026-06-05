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
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Health</th>
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
                      <summary className={`cursor-pointer list-none flex items-start gap-2 p-2.5 rounded-lg transition-colors ${hoverBg} text-left`}>
                        <div className={`mt-0.5 p-1 ${bgColor} rounded group-open:rotate-90 transition-transform flex-shrink-0`}>
                          <ChevronRight size={14} className={iconColor} />
                        </div>
                        <span className={`text-sm flex-1 ${textColor}`}>{actionText}</span>
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
                      <summary className={`cursor-pointer list-none flex items-start gap-2 p-2.5 rounded-lg transition-colors ${hoverBg} text-left`}>
                        <div className={`mt-0.5 p-1 ${bgColor} rounded group-open:rotate-90 transition-transform flex-shrink-0`}>
                          <ChevronRight size={14} className={iconColor} />
                        </div>
                        <span className={`text-sm flex-1 ${textColor}`}>{trendText}</span>
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
