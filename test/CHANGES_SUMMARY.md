# 📝 代码改动对比总结

## 🎯 核心改动

### 改动 1: 数据获取方式

#### ❌ **旧代码** (模拟数据)
```javascript
// 硬编码的模拟数据
const fetchForecastData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { client_full: "Yanwen Logistics Co., Ltd. Shenzhen Branch", dest: "RE", ... },
        { client_full: "Shenzhen Takesend Logistics Co. Ltd.", dest: "NZ", ... },
        // ... 只有 12 条固定数据
      ]);
    }, 800);
  });
};
```

#### ✅ **新代码** (真实 API)
```typescript
// 从后端 API 获取真实数据
const loadData = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/forecast-table`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 处理返回的所有数据 (不限于 12 条)
    setTableData(data.table_data || []);
    
    // 处理图表数据
    const chartDataFromAPI = data.chart_data;
    if (chartDataFromAPI) {
      const formattedChartData = [
        { name: 'W+1', volume: chartDataFromAPI.w1.volume, weight: chartDataFromAPI.w1.weight },
        { name: 'W+2', volume: chartDataFromAPI.w2.volume, weight: chartDataFromAPI.w2.weight },
        { name: 'W+3', volume: chartDataFromAPI.w3.volume, weight: chartDataFromAPI.w3.weight },
        { name: 'W+4', volume: chartDataFromAPI.w4.volume, weight: chartDataFromAPI.w4.weight },
      ];
      setChartData(formattedChartData);
    }
    
    setPerformanceMetrics(data.performance_metrics || null);
    
  } catch (err) {
    console.error('Failed to fetch forecast data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load forecast data');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 改动 2: 数据处理逻辑

#### ❌ **旧代码**
```javascript
// 前端自己生成脱敏 ID
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
```

#### ✅ **新代码**
```typescript
// 后端已经处理好脱敏,前端直接使用
setTableData(data.table_data || []);
// data.table_data 已包含:
// - client_id: "Y***D"       (后端脱敏)
// - client_sub_id: "Y***."   (后端生成)
// - dest, category, w1-w4    (后端标准化)
```

---

### 改动 3: 图表数据源

#### ❌ **旧代码** (静态数据)
```javascript
const chartData = [
  { name: 'W+1', volume: 4200, weight: 1250 },
  { name: 'W+2', volume: 4800, weight: 1420 },
  { name: 'W+3', volume: 5100, weight: 1580 },
  { name: 'W+4', volume: 4950, weight: 1490 },
];
```

#### ✅ **新代码** (动态计算)
```typescript
// 后端汇总所有实体的数据
const chartDataFromAPI = data.chart_data;
// {
//   w1: { volume: 5230, weight: 1456.78 },  // 真实汇总值
//   w2: { volume: 4987, weight: 1389.22 },
//   w3: { volume: 4521, weight: 1267.90 },
//   w4: { volume: 3890, weight: 1123.45 }
// }

const formattedChartData = [
  { name: 'W+1', volume: chartDataFromAPI.w1.volume, weight: chartDataFromAPI.w1.weight },
  { name: 'W+2', volume: chartDataFromAPI.w2.volume, weight: chartDataFromAPI.w2.weight },
  { name: 'W+3', volume: chartDataFromAPI.w3.volume, weight: chartDataFromAPI.w3.weight },
  { name: 'W+4', volume: chartDataFromAPI.w4.volume, weight: chartDataFromAPI.w4.weight },
];
```

---

### 改动 4: 错误处理

#### ❌ **旧代码** (无错误处理)
```javascript
// 没有错误状态
// 没有错误 UI
// 假设数据永远加载成功
```

#### ✅ **新代码** (完整错误处理)
```typescript
// State 管理
const [error, setError] = useState<string | null>(null);

// 错误捕获
try {
  const response = await fetch(`${API_BASE_URL}/api/forecast-table`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load forecast data');
}

// 错误 UI
if (error && !isLoading) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-3">
        <AlertCircle size={24} className="text-red-600" />
        <h3 className="text-lg font-bold text-red-800">Failed to Load Forecast Data</h3>
      </div>
      <p className="text-red-700 mb-4">{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}
```

---

### 改动 5: CSV 导出功能

#### ❌ **旧代码** (假按钮)
```javascript
<button className="...">
  <Download size={14} /> Export CSV
</button>
// 点击无任何效果
```

#### ✅ **新代码** (真实导出)
```typescript
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

<button onClick={handleExportCSV} className="...">
  <Download size={14} /> Export CSV
</button>
```

---

## 🔧 后端新增代码

### 文件: `forecast_processor.py`

```python
def get_raw_forecast_table(self) -> List[Dict]:
    """
    新增方法: 获取原始预测表格数据
    用于前端表格显示,不做容量缺口计算
    """
    results = []

    for _, row in self.df.iterrows():
        name = str(row['client_full']) if pd.notna(row['client_full']) else 'Unknown'
        
        # 脱敏处理
        masked_id = f"{name[0]}***{name[-1]}" if len(name) > 2 else name
        sub_id = f"{name[:1]}***." if len(name) > 3 else name

        results.append({
            'entity_id': row['Entity_ID'],
            'client_full': name,
            'client_id': masked_id.upper(),
            'client_sub_id': sub_id.upper(),
            'dest': str(row['destination']) if pd.notna(row['destination']) else 'N/A',
            'category': str(row.get('Category', 'Uncategorized')),
            'w1': {
                'v': int(row['Week +1_Vol']) if pd.notna(row['Week +1_Vol']) else 0,
                'w': round(float(row['Week +1_Wt']), 2) if pd.notna(row['Week +1_Wt']) else 0.0
            },
            'w2': {
                'v': int(row['Week +2_Vol']) if pd.notna(row['Week +2_Vol']) else 0,
                'w': round(float(row['Week +2_Wt']), 2) if pd.notna(row['Week +2_Wt']) else 0.0
            },
            'w3': {
                'v': int(row['Week +3_Vol']) if pd.notna(row['Week +3_Vol']) else 0,
                'w': round(float(row['Week +3_Wt']), 2) if pd.notna(row['Week +3_Wt']) else 0.0
            },
            'w4': {
                'v': int(row['Week +4_Vol']) if pd.notna(row['Week +4_Vol']) else 0,
                'w': round(float(row['Week +4_Wt']), 2) if pd.notna(row['Week +4_Wt']) else 0.0
            },
            'total_4wk_vol': round(row['total_4wk_vol'], 1),
            'total_4wk_wt': round(row['total_4wk_wt'], 2),
        })

    # 按总量排序,最大客户在前
    results.sort(key=lambda x: x['total_4wk_vol'], reverse=True)
    return results


def get_chart_aggregates(self) -> Dict:
    """
    新增方法: 获取图表汇总数据
    返回每周的总 volume 和 weight
    """
    return {
        'w1': {
            'volume': int(self.df['Week +1_Vol'].sum()),
            'weight': round(float(self.df['Week +1_Wt'].sum()), 2)
        },
        'w2': {
            'volume': int(self.df['Week +2_Vol'].sum()),
            'weight': round(float(self.df['Week +2_Wt'].sum()), 2)
        },
        'w3': {
            'volume': int(self.df['Week +3_Vol'].sum()),
            'weight': round(float(self.df['Week +3_Wt'].sum()), 2)
        },
        'w4': {
            'volume': int(self.df['Week +4_Vol'].sum()),
            'weight': round(float(self.df['Week +4_Wt'].sum()), 2)
        }
    }
```

### 文件: `main.py`

```python
@app.get("/api/forecast-table")
async def get_forecast_table():
    """
    新增 API 端点: 获取预测表格数据
    返回完整的表格数据和图表数据
    """
    try:
        if fp_module.forecast_processor is None:
            raise HTTPException(status_code=503, detail="Forecast processor not initialized")

        table_data = fp_module.forecast_processor.get_raw_forecast_table()
        chart_data = fp_module.forecast_processor.get_chart_aggregates()

        return {
            "table_data": table_data,
            "chart_data": chart_data,
            "total_entities": len(table_data),
            "performance_metrics": fp_module.forecast_processor.get_performance_metrics()
        }
    except Exception as e:
        logger.error(f"Error getting forecast table: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📊 数据结构对比

### 旧数据结构 (前端硬编码)
```javascript
{
  client_full: "Yanwen Logistics Co., Ltd. Shenzhen Branch",
  dest: "RE",
  category: "Beauty & Personal Care",
  w1: {v: 233, w: 65.11},
  w2: {v: 163, w: 45.55},
  w3: {v: 108, w: 30.18},
  w4: {v: 12, w: 3.35}
  // 前端自己生成 id 和 subId
}
```

### 新数据结构 (后端返回)
```json
{
  "entity_id": "Yanwen Logistics Co., Ltd. Shenzhen Branch_RE_484",
  "client_full": "Yanwen Logistics Co., Ltd. Shenzhen Branch",
  "client_id": "Y***D",
  "client_sub_id": "Y***.",
  "dest": "RE",
  "category": "Beauty & Personal Care",
  "w1": {"v": 233, "w": 65.11},
  "w2": {"v": 163, "w": 45.55},
  "w3": {"v": 108, "w": 30.18},
  "w4": {"v": 12, "w": 3.35},
  "total_4wk_vol": 516.0,
  "total_4wk_wt": 144.09
}
```

---

## ✨ 功能改进总结

| 功能 | 改动前 | 改动后 |
|------|--------|--------|
| 数据来源 | 前端硬编码 12 条 | 后端读取完整 CSV |
| 数据更新 | 需修改代码重新部署 | CSV 文件更新即可 |
| 客户脱敏 | 前端处理,不一致 | 后端统一处理 |
| 图表数据 | 静态假数据 | 动态汇总真实数据 |
| 错误处理 | 无 | 完整的错误提示和重试 |
| 加载状态 | 假延迟 | 真实 API 加载状态 |
| CSV 导出 | 不可用 | 完全可用 |
| 性能指标 | 静态显示 | 动态计算 |
| 筛选功能 | 正常 | 正常 (保持一致) |

---

## 🔄 迁移路径

```
旧版 (模拟)                    新版 (真实)
─────────────                  ─────────────
前端硬编码数据                  ─┐
  ↓                              │
setTimeout(800ms)                │  替换为
  ↓                              │  ↓
显示 12 条固定数据               │  fetch('/api/forecast-table')
                                 │    ↓
                                 │  后端读取 CSV
                                 │    ↓
                                 └─ 显示全部真实数据
```

---

**更新完成后,您将获得:**
- ✅ 真实的 CSV 数据展示
- ✅ 动态的图表更新
- ✅ 完整的错误处理
- ✅ 可用的 CSV 导出
- ✅ 更好的用户体验

**文档版本:** v1.0  
**更新日期:** 2026-06-04
