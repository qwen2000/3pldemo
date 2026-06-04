# 🧪 快速测试指南

## ✅ 测试步骤

### 第 1 步: 测试后端 API

#### 1.1 启动后端服务
```bash
cd backend/app
python main.py
```

**预期输出:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Checking: /path/to/data/3PL_Final_Forecast_Report.csv -> exists: True
INFO:     Forecast processor initialized with: /path/to/data/3PL_Final_Forecast_Report.csv
INFO:     Loaded 123 forecast records  # 数字取决于您的 CSV 文件
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 1.2 测试 API 端点

**方法 1: 浏览器直接访问**
```
http://localhost:8000/api/forecast-table
```

**方法 2: curl 命令**
```bash
curl http://localhost:8000/api/forecast-table | jq
```

**方法 3: Python 脚本**
```python
import requests
response = requests.get('http://localhost:8000/api/forecast-table')
print(response.status_code)  # 应该是 200
print(response.json())
```

**预期响应格式:**
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
      "w1": {"v": 233, "w": 65.11},
      "w2": {"v": 163, "w": 45.55},
      "w3": {"v": 108, "w": 30.18},
      "w4": {"v": 12, "w": 3.35},
      "total_4wk_vol": 516.0,
      "total_4wk_wt": 144.09
    }
    // ... 更多数据
  ],
  "chart_data": {
    "w1": {"volume": 5230, "weight": 1456.78},
    "w2": {"volume": 4987, "weight": 1389.22},
    "w3": {"volume": 4521, "weight": 1267.90},
    "w4": {"volume": 3890, "weight": 1123.45}
  },
  "total_entities": 123,
  "performance_metrics": {
    "overall_wape": 24.42,
    "core_wape": 18.99,
    "head_wape": 17.23,
    "monthly_error": 10.3
  }
}
```

#### 1.3 验证数据正确性

检查清单:
- [ ] `table_data` 数组长度 = CSV 文件行数
- [ ] `client_id` 已脱敏 (格式: `Y***D`)
- [ ] `w1`, `w2`, `w3`, `w4` 包含 `v` (volume) 和 `w` (weight)
- [ ] `chart_data` 包含 `w1`, `w2`, `w3`, `w4` 汇总
- [ ] `performance_metrics` 包含 WAPE 指标

---

### 第 2 步: 测试前端集成

#### 2.1 启动前端开发服务器
```bash
cd frontend
npm start
# 或
yarn start
```

#### 2.2 打开浏览器
```
http://localhost:3000
```

#### 2.3 导航到 4-Week Forecast 标签

点击顶部导航栏的 **"AI Predict Center"** 或 **"4-Week Forecast"** 标签

#### 2.4 观察加载过程

**预期行为:**
1. ⏳ 显示加载动画: "Loading forecast data from server..."
2. ✅ 加载完成后,表格显示数据
3. 📊 图表显示汇总趋势
4. 📈 性能指标卡片显示 WAPE 数据

---

### 第 3 步: 功能测试

#### 3.1 表格数据验证

检查清单:
- [ ] 表格显示的行数 > 12 行 (旧版只有 12 行)
- [ ] 每行显示:
  - [ ] 客户 ID (脱敏格式: `Y***D`)
  - [ ] 子 ID (格式: `Y***.`)
  - [ ] 目的地代码 (2 字母)
  - [ ] 品类名称
  - [ ] Week +1 到 Week +4 的 Volume 和 Weight

#### 3.2 图表数据验证

检查清单:
- [ ] 柱状图显示 Volume (蓝色)
- [ ] 折线图显示 Weight (紫色)
- [ ] 数值不是静态的 `4200, 4800, 5100, 4950`
- [ ] 悬停显示 Tooltip

#### 3.3 性能指标验证

检查清单:
- [ ] Overall WAPE: 24.42%
- [ ] Core Accounts: 18.99%
- [ ] Head Accounts: 17.23%
- [ ] Monthly Error: 10.3%

#### 3.4 筛选功能测试

##### 测试搜索框
1. 输入客户 ID 的一部分 (如 `Y***`)
2. 表格应该只显示匹配的行

##### 测试目的地筛选
1. 选择一个目的地 (如 `RE`)
2. 表格应该只显示该目的地的数据

##### 测试品类筛选
1. 选择一个品类 (如 `Beauty & Personal Care`)
2. 表格应该只显示该品类的数据

##### 测试周数筛选
1. 选择 `Week +1 Only`
2. 表格应该只显示 Week +1 列
3. 其他周列隐藏

##### 测试组合筛选
1. 同时使用搜索框 + 目的地筛选
2. 结果应该是两个条件的交集

#### 3.5 CSV 导出测试

1. 点击 **"Export CSV"** 按钮
2. 浏览器应该下载一个 CSV 文件
3. 文件名格式: `forecast_4week_2026-06-04.csv`
4. 打开 CSV 文件,验证内容正确

**预期 CSV 内容:**
```csv
Client ID,Destination,Category,W+1 Vol,W+1 Wt,W+2 Vol,W+2 Wt,W+3 Vol,W+3 Wt,W+4 Vol,W+4 Wt,Total Vol,Total Wt
Y***D,RE,Beauty & Personal Care,233,65.11,163,45.55,108,30.18,12,3.35,516,144.09
...
```

---

### 第 4 步: 错误处理测试

#### 4.1 测试后端离线场景

1. 停止后端服务 (Ctrl+C)
2. 刷新前端页面
3. 预期看到红色错误提示:
   ```
   Failed to Load Forecast Data
   Failed to fetch
   ```
4. 点击 **"Retry"** 按钮

#### 4.2 测试后端错误响应

临时修改后端代码抛出错误:
```python
@app.get("/api/forecast-table")
async def get_forecast_table():
    raise HTTPException(status_code=500, detail="Test error")
```

预期前端显示:
```
Failed to Load Forecast Data
API Error: 500 Internal Server Error
```

---

### 第 5 步: 性能测试

#### 5.1 测试大数据集

如果 CSV 文件有 1000+ 行:
- [ ] 页面加载时间 < 3 秒
- [ ] 表格滚动流畅
- [ ] 筛选响应 < 500ms

#### 5.2 测试网络延迟

使用浏览器开发者工具 → Network → Throttling:
- [ ] 设置为 `Slow 3G`
- [ ] 观察加载动画是否正确显示
- [ ] 数据最终是否正确加载

---

## 🐛 常见问题诊断

### 问题 1: 表格显示空数据

**诊断步骤:**
1. 打开浏览器开发者工具 (F12)
2. 切换到 **Console** 标签,查看错误信息
3. 切换到 **Network** 标签,检查 `/api/forecast-table` 请求:
   - Status 是否为 200?
   - Response 是否包含数据?
4. 检查 Response Preview,看数据格式是否正确

**可能原因:**
- [ ] 后端服务未启动
- [ ] CORS 问题
- [ ] CSV 文件路径错误
- [ ] 前端 API_BASE_URL 配置错误

### 问题 2: 图表不显示

**诊断步骤:**
1. 检查浏览器控制台是否有 Recharts 相关错误
2. 验证 `chartData` state 是否有值:
   ```javascript
   console.log(chartData);
   ```
3. 检查 `chart_data` 响应格式是否正确

**可能原因:**
- [ ] `chart_data` 字段缺失
- [ ] 数据格式不匹配
- [ ] Recharts 库未正确安装

### 问题 3: 性能指标显示 0%

**诊断步骤:**
1. 检查 API 响应中的 `performance_metrics` 字段
2. 验证后端 `get_performance_metrics()` 方法是否返回数据

**可能原因:**
- [ ] `performance_metrics` 字段缺失
- [ ] 后端方法返回 None

### 问题 4: CSV 导出失败

**诊断步骤:**
1. 检查浏览器控制台是否有 JavaScript 错误
2. 验证 `filteredData` 是否有数据
3. 检查浏览器下载设置

**可能原因:**
- [ ] 浏览器阻止下载
- [ ] `filteredData` 为空
- [ ] Blob API 不支持

---

## ✅ 测试完成检查清单

### 后端测试
- [ ] 后端服务启动成功
- [ ] CSV 文件成功加载
- [ ] `/api/forecast-table` 返回正确数据
- [ ] 数据包含所有必需字段
- [ ] 客户名称已脱敏

### 前端测试
- [ ] 页面正常加载
- [ ] 表格显示所有 CSV 数据
- [ ] 图表显示正确趋势
- [ ] 性能指标显示正确
- [ ] 搜索功能正常
- [ ] 目的地筛选正常
- [ ] 品类筛选正常
- [ ] 周数筛选正常
- [ ] CSV 导出成功
- [ ] 错误处理正常 (后端离线时)
- [ ] 加载状态显示正常

### 数据验证
- [ ] 表格行数 = CSV 文件行数
- [ ] 客户 ID 格式正确 (`Y***D`)
- [ ] 所有 4 周数据显示正确
- [ ] 图表数据与表格数据一致
- [ ] WAPE 指标显示正确

---

## 🎯 快速测试命令

```bash
# 1. 测试后端 API
curl http://localhost:8000/api/forecast-table | jq '.total_entities'

# 2. 检查数据行数
curl -s http://localhost:8000/api/forecast-table | jq '.table_data | length'

# 3. 查看第一条数据
curl -s http://localhost:8000/api/forecast-table | jq '.table_data[0]'

# 4. 验证客户 ID 脱敏
curl -s http://localhost:8000/api/forecast-table | jq '.table_data[0].client_id'

# 5. 检查图表数据
curl -s http://localhost:8000/api/forecast-table | jq '.chart_data'
```

---

**测试完成标志:**

当所有测试项都通过时,您就可以确认更新成功了! 🎉

**文档版本:** v1.0  
**更新日期:** 2026-06-04
