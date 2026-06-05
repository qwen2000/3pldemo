# Operation Plan 模块集成指南

## 📋 概述

**Operation Plan** 模块提供AI驱动的运营分析，包括：
- ✅ 容量缺口分析（Capacity Gap Analysis）
- ✅ 客户健康评分（Client Health Score）
- ✅ 紧急采购建议（Urgent Procurement Recommendations）
- ✅ 下周行动清单（Next Week Actions）
- ✅ 4周趋势预警（4-Week Trend Alerts）

---

## 🔧 后端集成

### 1. 添加 operation_analyzer.py

将 `operation_analyzer.py` 复制到 `backend/` 目录（和 main.py 同级）

### 2. 更新 main.py

在 `backend/main.py` 中添加以下代码：

```python
# 在文件顶部添加 import
from operation_analyzer import OperationAnalyzer
import os

# 在 init_forecast_processor 之后初始化 operation_analyzer
operation_analyzer = None

def init_operation_analyzer():
    global operation_analyzer
    try:
        forecast_path = os.path.join(DATA_DIR, '3PL_Final_Forecast_Report.csv')
        weekly_path = os.path.join(DATA_DIR, '3pl_weekly_aggregated.csv')
        
        if os.path.exists(forecast_path):
            operation_analyzer = OperationAnalyzer(
                forecast_csv_path=forecast_path,
                weekly_csv_path=weekly_path if os.path.exists(weekly_path) else None
            )
            logger.info(f"Operation analyzer initialized with: {forecast_path}")
        else:
            logger.error(f"Forecast file not found: {forecast_path}")
    except Exception as e:
        logger.error(f"Failed to initialize operation analyzer: {e}")

# 在 startup_event() 函数中添加
@app.on_event("startup")
async def startup_event():
    init_forecast_processor(os.path.join(DATA_DIR, '3PL_Final_Forecast_Report.csv'))
    init_operation_analyzer()  # 添加这一行

# 添加新的 API endpoint
@app.get("/api/operation-analysis")
async def get_operation_analysis():
    """
    Get AI-driven operation analysis including capacity gaps, 
    urgent actions, anomalies, and insights
    """
    if not operation_analyzer:
        raise HTTPException(status_code=500, detail="Operation analyzer not initialized")
    
    try:
        capacity_gap_analysis = operation_analyzer.get_capacity_gap_analysis()
        urgent_actions = operation_analyzer.get_urgent_actions(top_n=10)
        anomalies = operation_analyzer.get_anomalies()
        insights = operation_analyzer.get_insights()
        
        return {
            "capacity_gap_analysis": capacity_gap_analysis,
            "urgent_actions": urgent_actions,
            "anomalies": anomalies,
            "insights": insights,
        }
    except Exception as e:
        logger.error(f"Error getting operation analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 3. 确保数据文件位置

确保以下文件在 `backend/data/` 目录：
- ✅ `3PL_Final_Forecast_Report.csv`
- ✅ `3pl_weekly_aggregated.csv` （新文件）

---

## 🎨 前端集成

### 1. 更新 App.tsx

#### Step 1: 修改 Tab 名称

找到原来的 "Procurement Plan" tab，改为 "Operation Plan"：

```typescript
const tabs = [
  { id: 'overview', name: 'Overview', icon: Home },
  { id: 'forecast', name: '4-Week Forecast', icon: Calendar },
  { id: 'operation', name: 'Operation Plan', icon: TrendingUp },  // 改这里
  { id: 'anomaly', name: 'Anomaly Detection', icon: AlertTriangle },
];
```

#### Step 2: 添加必要的图标 import

在 lucide-react imports 中添加：

```typescript
import {
  // ... 现有的 imports
  TrendingUp,
  BarChart3,
  Activity,
  // ... 其他
} from 'lucide-react';
```

#### Step 3: 替换 OperationPlanModule 函数

用 `OperationPlanModule.tsx` 的内容替换 App.tsx 中原来的 Procurement Plan 模块函数。

#### Step 4: 更新渲染逻辑

```typescript
{activeTab === 'operation' && <OperationPlanModule />}
```

---

## 📊 数据流程

```
用户点击 "Start Analysis"
    ↓
前端调用 GET /api/operation-analysis
    ↓
后端 operation_analyzer 处理
    ↓
计算:
  - 容量缺口 (AI预测 - 已分配容量)
  - 健康分数 (基于趋势、利用率)
  - 紧急程度 (gap大小、健康分数)
  - 行动建议 (采购数量、优先级)
    ↓
返回 JSON 数据
    ↓
前端显示:
  - 主表格: Capacity Gap & Client Health Analysis
  - 右侧栏: Urgent Actions, Next Week Actions, 4-Week Trends
```

---

## 🎯 核心功能说明

### 1. 健康分数算法 (0-100)

```python
Base Score: 70

调整因素:
+ 趋势稳定 (-10% ~ +10%): +15
+ 无容量缺口: +15
+ 小缺口 (<10): +5
- 快速增长 (>10%): -15
- 快速下降 (<-30%): -20
- 大缺口 (>50): -20
- 中等缺口 (>20): -10
```

### 2. 容量分配策略

```python
if 预测量 > 100:
    分配率 = 85%
elif 预测量 > 50:
    分配率 = 80%
else:
    分配率 = 75%

容量缺口 = max(0, 预测量 - 已分配容量)
```

### 3. 紧急程度分类

- **Urgent**: gap > 20 或 health < 50
- **Normal**: 5 < gap ≤ 20
- **Sufficient**: gap = 0

---

## 🎨 UI 特性

### Idle State (初始状态)
- 显示 "AI Operation Analysis" 标题
- "Start Analysis" 按钮
- 空状态提示

### Running State (分析中)
- Loading spinner
- "Analyzing Operations..." 文字

### Completed State (完成)
- **顶部**: 汇总指标卡片 (4个)
- **左侧**: Capacity Gap 表格 (可搜索、可过滤、可滚动)
- **右侧**: 
  - Urgent Actions 卡片 (红色)
  - Next Week Actions 卡片 (蓝色)
  - 4-Week Trend Alerts 卡片 (黄色)

### 健康分数显示
- 80-100: 绿色进度条
- 60-79: 黄色进度条
- 40-59: 橙色进度条
- 0-39: 红色进度条

---

## 📝 测试步骤

1. **后端测试**
   ```bash
   # 启动后端
   cd backend
   python -m uvicorn app.main:app --reload
   
   # 访问
   http://localhost:8000/api/operation-analysis
   ```

2. **前端测试**
   ```bash
   # 启动前端
   cd frontend
   npm start
   
   # 点击 "Operation Plan" tab
   # 点击 "Start Analysis"
   # 查看数据是否正确显示
   ```

3. **预期结果**
   - ✅ 表格显示所有客户的容量缺口
   - ✅ 健康分数用颜色条显示
   - ✅ Gap 大于 0 的显示红色数字
   - ✅ 右侧显示紧急行动和趋势预警

---

## 🐛 常见问题

**Q: API 返回 500 错误？**
A: 检查 `3PL_Final_Forecast_Report.csv` 是否在 `backend/data/` 目录

**Q: 前端显示 "Analysis Failed"？**
A: 
1. 检查后端是否正常运行
2. 检查浏览器控制台是否有 CORS 错误
3. 确认 API_BASE_URL 正确

**Q: 健康分数都是 0？**
A: 检查 CSV 文件的列名是否正确 (Week +1_Vol, Week +2_Vol 等)

**Q: 没有显示紧急行动？**
A: 可能所有客户的 gap 都很小或为 0，这是正常的

---

## 📦 文件清单

**后端**:
- ✅ `backend/operation_analyzer.py` (新文件，和 main.py 同级)
- ✅ `backend/main.py` (需要更新)
- ✅ `backend/data/3PL_Final_Forecast_Report.csv` (已有)
- ✅ `backend/data/3pl_weekly_aggregated.csv` (新文件)

**前端**:
- ✅ `frontend/src/App.tsx` (需要更新)
  - 添加 OperationPlanModule 函数
  - 修改 tab 名称
  - 添加图标 imports

---

完成！重启后端和前端后，Operation Plan 模块就可以使用了。
