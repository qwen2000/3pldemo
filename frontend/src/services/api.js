// API 服务 - 连接后端
const API_BASE = 'http://localhost:8000/api';

async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export const API = {
  // 汇总统计
  getSummary: () => fetchAPI('/summary'),

  // 国家分布
  getCountryDistribution: () => fetchAPI('/country-distribution'),

  // 类目分布
  getCategoryDistribution: () => fetchAPI('/category-distribution'),

  // 筛选订单
  getOrders: (filters = {}) => fetchAPI('/orders', filters),

  // 元数据
  getCountries: () => fetchAPI('/countries'),
  getCategories: () => fetchAPI('/categories'),
};