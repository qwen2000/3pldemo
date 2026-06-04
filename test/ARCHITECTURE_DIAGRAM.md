# 🏗️ 架构对比图

## 📊 更新前架构 (模拟数据)

```
┌─────────────────────────────────────────────────────────┐
│                  前端 (React)                            │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  ForecastModule 组件                        │         │
│  │                                             │         │
│  │  const fetchForecastData = async () => {   │         │
│  │    return new Promise((resolve) => {       │         │
│  │      setTimeout(() => {                    │         │
│  │        resolve([                           │         │
│  │          { client_full: "...", ... },      │  ← 硬编码  │
│  │          // ... 12 条固定数据               │     数据   │
│  │        ]);                                 │         │
│  │      }, 800);                              │         │
│  │    });                                     │         │
│  │  }                                         │         │
│  │                                             │         │
│  │  ┌─────────────────┐                       │         │
│  │  │  UI 渲染         │                       │         │
│  │  │  • 表格 (12行)   │                       │         │
│  │  │  • 图表 (静态)   │                       │         │
│  │  │  • 指标卡片      │                       │         │
│  │  └─────────────────┘                       │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘

❌ 问题:
• 数据不真实 (只有 12 条假数据)
• 无法更新 (需要修改代码)
• 无错误处理
• CSV 导出是假按钮
```

---

## ✅ 更新后架构 (真实数据)

```
┌─────────────────────────────────────────────────────────────────┐
│                       数据源层                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │  3PL_Final_Forecast_Report.csv                     │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │ Entity_ID | Week+1_Vol | Week+1_Wt | ...    │  │          │
│  │  │ Client_A  |    233     |   65.11   | ...    │  │          │
│  │  │ Client_B  |    186     |   81.69   | ...    │  │          │
│  │  │ ...       |    ...     |    ...    | ...    │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  └────────────────────────────────────────────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                     后端层 (Python)                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │  forecast_processor.py                             │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │  class ForecastProcessor:                    │  │          │
│  │  │                                               │  │          │
│  │  │    def __init__(csv_path):                   │  │          │
│  │  │      self.df = pd.read_csv(csv_path)         │  │  ← 读取   │
│  │  │      self._process_data()                    │  │    CSV   │
│  │  │                                               │  │          │
│  │  │    def get_raw_forecast_table():             │  │          │
│  │  │      results = []                            │  │          │
│  │  │      for row in self.df:                     │  │  ← 数据   │
│  │  │        # 脱敏处理                            │  │    脱敏   │
│  │  │        masked_id = mask(row['client'])       │  │          │
│  │  │        # 格式化数据                          │  │          │
│  │  │        results.append({                      │  │          │
│  │  │          'client_id': masked_id,             │  │          │
│  │  │          'w1': {'v': vol, 'w': wt},         │  │          │
│  │  │          ...                                  │  │          │
│  │  │        })                                     │  │          │
│  │  │      return results                          │  │          │
│  │  │                                               │  │          │
│  │  │    def get_chart_aggregates():               │  │  ← 汇总   │
│  │  │      return {                                │  │    计算   │
│  │  │        'w1': {                               │  │          │
│  │  │          'volume': df['W+1_Vol'].sum(),     │  │          │
│  │  │          'weight': df['W+1_Wt'].sum()       │  │          │
│  │  │        },                                    │  │          │
│  │  │        ...                                   │  │          │
│  │  │      }                                       │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │  main.py (FastAPI)                                 │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │  @app.get("/api/forecast-table")            │  │          │
│  │  │  async def get_forecast_table():            │  │  ← API   │
│  │  │    table_data = processor.get_raw_...()     │  │    端点   │
│  │  │    chart_data = processor.get_chart_...()   │  │          │
│  │  │    return {                                  │  │          │
│  │  │      "table_data": table_data,              │  │          │
│  │  │      "chart_data": chart_data,              │  │          │
│  │  │      "performance_metrics": metrics          │  │          │
│  │  │    }                                         │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  └────────────────────────────────────────────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                           │
                           │ HTTP GET
                           │ /api/forecast-table
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                     前端层 (React)                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐          │
│  │  ForecastModule 组件                                │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │  useEffect(() => {                           │  │          │
│  │  │    const loadData = async () => {           │  │  ← 真实   │
│  │  │      const response = await fetch(           │  │    API   │
│  │  │        'http://localhost:8000/api/...'      │  │    调用   │
│  │  │      );                                      │  │          │
│  │  │      const data = await response.json();    │  │          │
│  │  │                                              │  │          │
│  │  │      setTableData(data.table_data);         │  │  ← State  │
│  │  │      setChartData(format(data.chart_...));  │  │    更新   │
│  │  │      setMetrics(data.performance_...);      │  │          │
│  │  │    };                                        │  │          │
│  │  │    loadData();                               │  │          │
│  │  │  }, []);                                     │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │  State 管理                                   │  │          │
│  │  │  • tableData (所有数据)                       │  │  ← 动态   │
│  │  │  • chartData (汇总)                          │  │    数据   │
│  │  │  • performanceMetrics                        │  │          │
│  │  │  • isLoading, error                          │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │  筛选逻辑                                      │  │          │
│  │  │  • 搜索 (searchTerm)                          │  │  ← 前端   │
│  │  │  • 目的地 (destFilter)                        │  │    筛选   │
│  │  │  • 品类 (categoryFilter)                      │  │          │
│  │  │  • 周数 (weekFilter)                          │  │          │
│  │  │  → filteredData                               │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────────────────┐  │          │
│  │  │  UI 渲染                                      │  │          │
│  │  │  ┌────────────────────────────────────────┐  │  │          │
│  │  │  │ 性能指标卡片                            │  │  │  ← UI    │
│  │  │  │ • Overall WAPE: 24.42%                 │  │  │    组件   │
│  │  │  │ • Core: 18.99%                         │  │  │          │
│  │  │  └────────────────────────────────────────┘  │  │          │
│  │  │  ┌────────────────────────────────────────┐  │  │          │
│  │  │  │ 图表 (Recharts)                        │  │  │          │
│  │  │  │ • Bar: Volume (蓝色柱状)                │  │  │          │
│  │  │  │ • Line: Weight (紫色折线)               │  │  │          │
│  │  │  └────────────────────────────────────────┘  │  │          │
│  │  │  ┌────────────────────────────────────────┐  │  │          │
│  │  │  │ 表格                                    │  │  │          │
│  │  │  │ ┌──────┬──────┬────────┬───────────┐  │  │  │          │
│  │  │  │ │Client│ Dest │Category│W+1│W+2│...│  │  │  │          │
│  │  │  │ ├──────┼──────┼────────┼───────────┤  │  │  │          │
│  │  │  │ │Y***D │  RE  │ Beauty │233│163│...│  │  │  │  ← 动态   │
│  │  │  │ │S***D │  NZ  │ Mother │186│ 37│...│  │  │  │    渲染   │
│  │  │  │ │...   │ ...  │  ...   │...│...│...│  │  │  │          │
│  │  │  │ └──────┴──────┴────────┴───────────┘  │  │  │          │
│  │  │  └────────────────────────────────────────┘  │  │          │
│  │  │  ┌────────────────────────────────────────┐  │  │          │
│  │  │  │ 筛选控件                                │  │  │          │
│  │  │  │ [🔍 搜索] [目的地▼] [品类▼] [📥导出]   │  │  │          │
│  │  │  └────────────────────────────────────────┘  │  │          │
│  │  └──────────────────────────────────────────────┘  │          │
│  └────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘

✅ 优势:
• 数据真实 (CSV 全量)
• 易于更新 (改 CSV 即可)
• 完整错误处理
• CSV 导出可用
• 动态图表
```

---

## 🔄 数据流详解

### 1️⃣ 启动阶段

```
[后端启动]
Python main.py
    ↓
加载 CSV 文件
    ↓
初始化 ForecastProcessor
    ↓
API 服务就绪 (端口 8000)

[前端启动]
npm start
    ↓
加载 React 应用
    ↓
渲染 App 组件
    ↓
用户点击 "4-Week Forecast"
    ↓
ForecastModule 挂载
    ↓
触发 useEffect
```

### 2️⃣ 数据获取阶段

```
useEffect Hook 触发
    ↓
setIsLoading(true)  ← 显示加载动画
    ↓
fetch('http://localhost:8000/api/forecast-table')
    ↓
[后端处理]
    ├─ 检查 forecast_processor 是否初始化
    ├─ 调用 get_raw_forecast_table()
    │   ├─ 遍历 DataFrame
    │   ├─ 脱敏客户名称
    │   └─ 格式化数据
    ├─ 调用 get_chart_aggregates()
    │   └─ 汇总 Volume & Weight
    └─ 返回 JSON
    ↓
[前端接收]
response.json()
    ↓
setTableData(data.table_data)
setChartData(formatChartData(data.chart_data))
setPerformanceMetrics(data.performance_metrics)
    ↓
setIsLoading(false)  ← 隐藏加载动画
    ↓
React 重新渲染 UI
```

### 3️⃣ 用户交互阶段

```
[用户输入搜索]
onChange(e.target.value)
    ↓
setSearchTerm(value)
    ↓
useMemo 重新计算 filteredData
    ↓
React 重新渲染表格

[用户选择筛选]
onChange(destFilter)
    ↓
setDestFilter(value)
    ↓
useMemo 重新计算 filteredData
    ↓
React 重新渲染表格

[用户导出 CSV]
onClick(handleExportCSV)
    ↓
生成 CSV 内容
    ↓
创建 Blob
    ↓
触发下载
```

---

## 📦 组件层次结构

```
App
├── Header (导航栏)
├── Main
│   └── ForecastModule  ← 本次更新的核心组件
│       ├── PerformanceMetrics (性能指标卡片)
│       │   └── StatCard × 4
│       ├── ChartSection (图表区域)
│       │   └── ComposedChart (Recharts)
│       │       ├── Bar (Volume 柱状图)
│       │       └── Line (Weight 折线图)
│       └── TableSection (表格区域)
│           ├── FilterControls (筛选控件)
│           │   ├── SearchInput
│           │   ├── DestinationFilter
│           │   ├── CategoryFilter
│           │   ├── WeekFilter
│           │   └── ExportButton
│           └── DataTable
│               ├── TableHeader
│               └── TableRows × N
│                   ├── ClientInfo
│                   ├── DestinationBadge
│                   ├── CategoryText
│                   └── WeekData × 4
└── Footer
```

---

## 🔐 数据脱敏流程

```
CSV 原始数据
    ↓
┌─────────────────────────────────────────────┐
│ Client Name: "Yanwen Logistics Co., Ltd.   │
│              Shenzhen Branch"               │
└─────────────────────────────────────────────┘
    ↓
后端 forecast_processor.py
    ↓
masked_id = f"{name[0]}***{name[-1]}"
    ↓
┌─────────────────────────────────────────────┐
│ client_id: "Y***D"                          │
│ client_sub_id: "Y***."                      │
└─────────────────────────────────────────────┘
    ↓
返回给前端
    ↓
┌─────────────────────────────────────────────┐
│ UI 显示:                                     │
│ ┌─────────┐                                 │
│ │  Y***D  │  ← 主标识                        │
│ │  Y***.  │  ← 副标识                        │
│ └─────────┘                                 │
└─────────────────────────────────────────────┘
```

---

## 🚀 API 响应格式

### 请求
```
GET http://localhost:8000/api/forecast-table
```

### 响应
```json
{
  "table_data": [
    {
      "entity_id": "Yanwen Logistics Co., Ltd. Shenzhen Branch_RE_484",
      "client_full": "Yanwen Logistics Co., Ltd. Shenzhen Branch",
      "client_id": "Y***D",
      "client_sub_id": "Y***.",
      "dest": "RE",
      "category": "Beauty & Personal Care",
      "w1": { "v": 233, "w": 65.11 },
      "w2": { "v": 163, "w": 45.55 },
      "w3": { "v": 108, "w": 30.18 },
      "w4": { "v": 12, "w": 3.35 },
      "total_4wk_vol": 516.0,
      "total_4wk_wt": 144.09
    }
    // ... 更多数据
  ],
  "chart_data": {
    "w1": { "volume": 5230, "weight": 1456.78 },
    "w2": { "volume": 4987, "weight": 1389.22 },
    "w3": { "volume": 4521, "weight": 1267.90 },
    "w4": { "volume": 3890, "weight": 1123.45 }
  },
  "total_entities": 123,
  "performance_metrics": {
    "overall_wape": 24.42,
    "long_tail_wape": 35.26,
    "mid_tier_wape": 24.42,
    "head_wape": 17.23,
    "core_wape": 18.99,
    "monthly_error": 10.3
  }
}
```

---

## 🔄 错误处理流程

```
前端发起请求
    ↓
try {
    fetch('/api/forecast-table')
    ↓
    [后端可能的错误]
    ├─ CSV 文件未找到 → 503 Forecast processor not initialized
    ├─ 数据处理错误   → 500 Internal Server Error
    └─ 其他异常       → 500 + 错误详情
    ↓
    response.ok?
    ├─ Yes → 解析 JSON → 更新 State
    └─ No  → throw Error
    ↓
} catch (err) {
    setError(err.message)
    ↓
    [前端显示错误 UI]
    ┌─────────────────────────────────┐
    │ ⚠️ Failed to Load Forecast Data │
    │                                 │
    │ Error message here              │
    │                                 │
    │ [Retry Button]                  │
    └─────────────────────────────────┘
}
```

---

## 📊 性能优化点

### 后端优化
```
┌────────────────────────────────────────┐
│ 无优化                                  │
│ 每次请求都重新读 CSV                    │
│ 处理时间: ~200ms                        │
└────────────────────────────────────────┘
    ↓ 添加缓存
┌────────────────────────────────────────┐
│ 使用 @lru_cache                        │
│ 首次请求: ~200ms                        │
│ 后续请求: ~5ms                          │
└────────────────────────────────────────┘
```

### 前端优化
```
┌────────────────────────────────────────┐
│ 无优化                                  │
│ 渲染 1000 行 → 卡顿                     │
└────────────────────────────────────────┘
    ↓ 虚拟滚动
┌────────────────────────────────────────┐
│ react-window                           │
│ 只渲染可见行 → 流畅                     │
└────────────────────────────────────────┘
    ↓ 或分页
┌────────────────────────────────────────┐
│ 每页 50 行                              │
│ 渲染快 + 导航清晰                       │
└────────────────────────────────────────┘
```

---

**文档版本:** v1.0  
**更新日期:** 2026-06-04
