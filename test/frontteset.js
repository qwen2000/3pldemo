import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Calendar, Download, Target, Search, ChevronDown, Activity, ShoppingCart, Filter, Loader2
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ==========================================
// Mock Chart Data (Overall Trend)
// ==========================================
const chartData = [
  { name: 'W+1', volume: 4200, weight: 1250 },
  { name: 'W+2', volume: 4800, weight: 1420 },
  { name: 'W+3', volume: 5100, weight: 1580 },
  { name: 'W+4', volume: 4950, weight: 1490 },
];

// ==========================================
// Simulated Backend API Call
// ==========================================
// Updated to use 'fake_mapping' for the category field based on the mapping CSV
const fetchForecastData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { client_full: "Yanwen Logistics Co., Ltd. Shenzhen Branch", dest: "RE", category: "Beauty & Personal Care", w1: {v: 233, w: 65.11}, w2: {v: 163, w: 45.55}, w3: {v: 108, w: 30.18}, w4: {v: 12, w: 3.35} },
        { client_full: "Shenzhen Takesend Logistics Co. Ltd.", dest: "NZ", category: "Mother & Baby", w1: {v: 186, w: 81.69}, w2: {v: 37, w: 16.25}, w3: {v: 7, w: 3.07}, w4: {v: 3, w: 1.32} },
        { client_full: "Shipany Limited", dest: "TH", category: "Toys & Hobbies", w1: {v: 174, w: 53.66}, w2: {v: 119, w: 36.70}, w3: {v: 51, w: 15.73}, w4: {v: 14, w: 4.32} },
        { client_full: "Shipany Limited", dest: "TH", category: "Toys & Hobbies", w1: {v: 152, w: 49.59}, w2: {v: 74, w: 24.14}, w3: {v: 69, w: 22.51}, w4: {v: 12, w: 3.91} },
        { client_full: "Shenzhen Takesend Logistics Co. Ltd.", dest: "SG", category: "Bags & Luggage", w1: {v: 139, w: 197.25}, w2: {v: 30, w: 42.57}, w3: {v: 28, w: 39.73}, w4: {v: 10, w: 14.19} },
        { client_full: "Sa Sa Dot Com Limited", dest: "PH", category: "Beauty & Health", w1: {v: 126, w: 33.57}, w2: {v: 150, w: 39.96}, w3: {v: 96, w: 25.58}, w4: {v: 73, w: 19.45} },
        { client_full: "GPGS", dest: "GB", category: "Mobile & Digital", w1: {v: 116, w: 11.66}, w2: {v: 21, w: 2.11}, w3: {v: 12, w: 1.21}, w4: {v: 6, w: 0.60} },
        { client_full: "Sa Sa Dot Com Limited", dest: "MY", category: "Beauty & Health", w1: {v: 113, w: 25.79}, w2: {v: 159, w: 36.28}, w3: {v: 136, w: 31.04}, w4: {v: 70, w: 15.97} },
        { client_full: "Dimple Optics Pty Ltd", dest: "SG", category: "Beauty & Health", w1: {v: 87, w: 23.73}, w2: {v: 104, w: 28.36}, w3: {v: 128, w: 34.91}, w4: {v: 85, w: 23.18} },
        { client_full: "Motion Global Limited", dest: "NZ", category: "Beauty & Health", w1: {v: 82, w: 26.84}, w2: {v: 125, w: 40.91}, w3: {v: 169, w: 55.31}, w4: {v: 113, w: 36.99} },
        { client_full: "Easyship Fulfillment Services Limited", dest: "IL", category: "Computers & Office", w1: {v: 20, w: 2.20}, w2: {v: 23, w: 2.53}, w3: {v: 14, w: 1.54}, w4: {v: 8, w: 0.88} },
        { client_full: "ASIA ENTERTAINMENT TECHNOLOGY LTD", dest: "NZ", category: "Computers & Office", w1: {v: 16, w: 6.15}, w2: {v: 3, w: 1.15}, w3: {v: 4, w: 1.54}, w4: {v: 1, w: 0.38} }
      ]);
    }, 800);
  });
};

// ==========================================
// Main App Component
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('forecast');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded text-white shadow-sm">
              <Package size={20} />
            </div>
            <h1 className="text-lg font-bold text-slate-800">3PL AI Capacity Center</h1>
          </div>
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <NavButton id="overview" label="Market Overview" icon={Activity} active={activeTab} onClick={setActiveTab} />
            <NavButton id="forecast" label="AI Predict Center" icon={Calendar} active={activeTab} onClick={setActiveTab} />
            <NavButton id="procurement" label="Procurement Plan" icon={ShoppingCart} active={activeTab} onClick={setActiveTab} />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-4">
        {activeTab === 'forecast' && <ForecastModule />}
      </main>
    </div>
  );
}

function NavButton({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active === id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

// ==========================================
// ForecastModule - AI Predict Center
// ==========================================
function ForecastModule() {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [destFilter, setDestFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [weekFilter, setWeekFilter] = useState('ALL');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const rawData = await fetchForecastData();

      const processedData = rawData.map(item => {
        const name = item.client_full;
        const maskedId = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : name;
        const subId = name.length > 3 ? `${name.substring(0, 1)}***.` : name;

        return {
          ...item,
          id: maskedId.toUpperCase(),
          subId: subId.toUpperCase(),
        };
      });

      setTableData(processedData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const uniqueDests = Array.from(new Set(tableData.map(d => d.dest))).sort();
  const uniqueCategories = Array.from(new Set(tableData.map(d => d.category))).sort();

  const filteredData = useMemo(() => {
    return tableData.filter(item => {
      const matchSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.subId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDest = destFilter === 'ALL' || item.dest === destFilter;
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchSearch && matchDest && matchCategory;
    });
  }, [tableData, searchTerm, destFilter, categoryFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Target size={18} className="text-blue-600" />
          Model Performance Review
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Overall WAPE" value="24.42%" color="text-blue-600" />
          <StatCard title="Core Accounts (50+)" value="18.99%" color="text-green-600" />
          <StatCard title="Head Accounts (21-50)" value="17.23%" color="text-amber-500" />
          <StatCard title="Monthly Cumulative Error" value="10.3%" color="text-purple-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-6">Overall 4-Week Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <Bar yAxisId="left" dataKey="volume" name="Volume (Pieces)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] relative">

        <div className="p-6 border-b border-gray-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <Filter size={18} className="text-gray-500" />
            4-Week Volume & Weight Forecast
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
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

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 mt-32">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
            <p className="text-sm text-gray-500">Loading forecast data from server...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client / Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>

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
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{row.id}</div>
                      <div className="text-sm text-gray-400 mt-0.5">{row.subId}</div>
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
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
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

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center justify-center text-center border border-gray-100">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}