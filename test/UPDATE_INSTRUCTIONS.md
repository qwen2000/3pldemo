# 📋 4-Week Forecast 模块更新说明

## 🎯 更新目标
将前端的模拟数据替换为从 Python 后端读取的真实 CSV 数据 (`3PL_Final_Forecast_Report.csv`)

---

## 📦 更新文件清单

### 后端更新 (Python)

#### 1. **`forecast_processor.py`** (已更新)
**新增方法:**
- ✅ `get_raw_forecast_table()` - 返回原始预测数据用于表格显示
- ✅ `get_chart_aggregates()` - 返回汇总数据用于图表展示

**关键改动:**
```python
def get_raw_forecast_table(self) -> List[Dict]:
    """
    Returns data in format:
    {
        'client_id': 'Y***d',           # 脱敏客户名
        'client_sub_id': 'Y***.',       # 简短标识
        'dest': 'RE',                    # 目的地
        'category': 'Beauty & Personal Care',
        'w1': {'v': 233, 'w': 65.11},   # Week +1 Volume & Weight
        'w2': {'v': 163, 'w': 45.55},
        'w3': {'v': 108, 'w': 30.18},
        'w4': {'v': 12, 'w': 3.35}
    }
    """
```

#### 2. **`main.py`** (已更新)
**新增 API 端点:**
```python
@app.get("/api/forecast-table")
async def get_forecast_table():
    """
    Returns:
    {
        "table_data": [...],          # 所有实体的预测数据
        "chart_data": {...},          # 图表汇总数据
        "total_entities": 123,
        "performance_metrics": {...}
    }
    """
```

---

### 前端更新 (React/TypeScript)

#### 3. **`ForecastModule.tsx`** (已创建新版本)

**主要改动:**

##### ✅ 移除了模拟数据
删除了:
```typescript
// ❌ OLD - 内置的 fetchForecastData() 模拟函数
const fetchForecastData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([/* 硬编码的 15 条数据 */]);
    }, 800);
  });
};
```

##### ✅ 新增真实 API 调用
```typescript
// ✅ NEW - 调用真实后端 API
const response = await fetch(`${API_BASE_URL}/api/forecast-table`);
const data = await response.json();
setTableData(data.table_data);
```

##### ✅ 新增错误处理
```typescript
const [error, setError] = useState<string | null>(null);

// Error state rendering
if (error && !isLoading) {
  return <ErrorComponent error={error} />;
}
```

##### ✅ 新增 CSV 导出功能
```typescript
const handleExportCSV = () => {
  // 导出当前筛选后的数据为 CSV 文件
};
```

##### ✅ 改进加载状态显示
```typescript
{isLoading && (
  <div className="absolute inset-0 flex items-center justify-center">
    <Loader2 className="animate-spin" />
    <p>Loading forecast data from server...</p>
  </div>
)}
```

---

## 🚀 部署步骤

### 步骤 1: 更新后端代码

```bash
# 进入后端目录
cd backend/app/

# 备份原文件 (可选)
cp forecast_processor.py forecast_processor.py.backup
cp main.py main.py.backup

# 替换为新文件
# 将 updated_forecast_processor.py 重命名为 forecast_processor.py
# 将 updated_main.py 重命名为 main.py
```

### 步骤 2: 重启后端服务

```bash
# 方法 1: 如果使用 uvicorn 直接运行
python main.py

# 方法 2: 如果使用 uvicorn 命令
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 步骤 3: 验证后端 API

访问以下 URL 测试:
```
http://localhost:8000/api/forecast-table
```

预期响应格式:
```json
{
  "table_data": [
    {
      "client_id": "Y***D",
      "dest": "RE",
      "category": "Beauty & Personal Care",
      "w1": {"v": 233, "w": 65.11},
      ...
    }
  ],
  "chart_data": {
    "w1": {"volume": 4200, "weight": 1250},
    ...
  },
  "total_entities": 123,
  "performance_metrics": {...}
}
```

### 步骤 4: 更新前端代码

```bash
# 进入前端目录
cd frontend/src/

# 备份原 App.tsx 中的 ForecastModule
# 然后用 UpdatedForecastModule.tsx 的内容替换 App.tsx 中的 ForecastModule 部分
```

**具体替换方法:**

1. 打开 `App.tsx`
2. 找到 `function ForecastModule()` 部分 (大约在 1285-1545 行)
3. 将整个 `ForecastModule` 函数替换为 `UpdatedForecastModule.tsx` 中的代码
4. 确保 import 语句完整

### 步骤 5: 重启前端开发服务器

```bash
# 如果使用 npm
npm start

# 如果使用 yarn
yarn start
```

---

## 🔍 验证清单

### ✅ 后端验证
- [ ] 后端服务正常启动,无错误日志
- [ ] CSV 文件路径正确,数据成功加载
- [ ] `/api/forecast-table` 返回完整数据
- [ ] 数据包含所有必需字段 (client_id, dest, category, w1-w4)

### ✅ 前端验证
- [ ] 页面加载时显示 "Loading..." 状态
- [ ] 表格正确显示所有 CSV 数据 (不再是只有 12-15 条)
- [ ] 图表显示正确的汇总数据
- [ ] 性能指标卡片显示正确
- [ ] 筛选功能正常 (搜索、目的地、品类、周数)
- [ ] CSV 导出功能正常
- [ ] 如果后端未启动,显示错误提示

---

## 🐛 常见问题排查

### 问题 1: "Failed to fetch" 或 CORS 错误
**解决方案:**
- 确保后端运行在 `http://localhost:8000`
- 检查 `main.py` 中的 CORS 配置
- 前端 `API_BASE_URL` 配置正确

### 问题 2: "Forecast processor not initialized"
**解决方案:**
- 检查 CSV 文件路径: `data/3PL_Final_Forecast_Report.csv`
- 查看后端启动日志中的 CSV 加载信息
- 确保文件编码为 UTF-8 (带或不带 BOM 都可以)

### 问题 3: 表格显示空数据
**解决方案:**
- 打开浏览器开发者工具 -> Network 标签
- 检查 `/api/forecast-table` 请求响应
- 查看控制台是否有 JavaScript 错误

### 问题 4: 客户名称脱敏不正确
**解决方案:**
- 检查 `forecast_processor.py` 中的脱敏逻辑
- 确保 CSV 中的客户名称字段存在且非空

---

## 📊 数据流图

```
CSV File (3PL_Final_Forecast_Report.csv)
         ↓
forecast_processor.py
  ├─ get_raw_forecast_table()  → 表格数据
  └─ get_chart_aggregates()    → 图表数据
         ↓
main.py - /api/forecast-table
         ↓
Frontend fetch()
         ↓
React State (tableData, chartData)
         ↓
UI Rendering (Table + Chart)
```

---

## 🎨 功能对比

| 功能 | 旧版 (模拟数据) | 新版 (真实数据) |
|------|----------------|----------------|
| 数据来源 | 前端硬编码 15 条 | 后端读取完整 CSV |
| 数据量 | 固定 12 条 | 动态 (CSV 全量) |
| 更新方式 | 需修改代码 | 自动读取文件 |
| 错误处理 | 无 | 完整错误提示 |
| 加载状态 | 假延迟 800ms | 真实加载状态 |
| CSV 导出 | 假按钮 | 真实导出功能 |

---

## 🔐 安全提示

✅ **已实现的安全措施:**
- 客户名称自动脱敏 (保留首尾字母)
- 订单 ID 脱敏处理
- API 无需认证 (内部工具)

⚠️ **生产环境建议:**
- 添加 API 认证 (JWT Token)
- 限制 CORS 来源
- 添加请求速率限制
- 日志审计

---

## ✅ 完成标志

当您看到以下内容时,更新成功:

1. ✅ 表格显示的数据量与 CSV 文件一致
2. ✅ 客户名称已脱敏 (例: `Y***d`)
3. ✅ 筛选功能正常工作
4. ✅ 图表显示正确的汇总趋势
5. ✅ 性能指标显示真实数据
6. ✅ CSV 导出下载正常

---

**文档版本:** v1.0  
**更新日期:** 2026-06-04  
**作者:** Claude Code Assistant
