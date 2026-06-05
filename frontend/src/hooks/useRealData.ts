import { useState, useEffect, useMemo } from 'react';

const API_URL = 'https://lemon-geckos-pick.loca.lt/api';

export interface Summary {
  total_orders: number;
  total_value: number;
  total_weight: number;
  avg_value: number;
  high_risk_rate: number;
  delivered_rate: number;
  unique_countries: number;
}

export interface CountryStat {
  country: string;
  orders: number;
  total_value: number;
  avg_risk: number;
}

export interface CategoryStat {
  category_id: number;
  category_name: string;
  orders: number;
  total_value: number;
  avg_risk: number;
}

export interface Order {
  order_id: string;
  country: string;
  l1_category_id: number;
  product_keyword: string;
  declared_value: number;
  weight_kg: number;
  value_per_kg: number;
  risk_score: number;
  is_high_risk: boolean;
  logistics_status: string;
  customer_masked: string;
  create_date?: string;
}

// 注意：后端返回的是 snake_case，需要映射
export interface CustomerStatFromAPI {
  customer: string;
  orders: number;
  total_value: number;
  total_weight: number;
  top_countries: string[];
  market_share: number;
  avg_risk: number;
  countries_count: number;
}

// 前端使用的 camelCase 版本
export interface CustomerStat {
  customer: string;
  orders: number;
  totalValue: number;
  totalWeight: number;
  topCountries: string[];
  marketShare: number;
  avgRisk: number;
  countriesCount: number;
}

export function useRealDashboardData() {
  // 修复语法错误：useState<<Summary 改为 useState<Summary
  const [summary, setSummary] = useState<Summary | null>(null);
  const [countryDistribution, setCountryDistribution] = useState<CountryStat[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryStat[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerStatsRaw, setCustomerStatsRaw] = useState<CustomerStatFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [summaryRes, countryRes, categoryRes, ordersRes, customerRes] = await Promise.all([
          fetch(`${API_URL}/summary`),
          fetch(`${API_URL}/country-distribution`),
          fetch(`${API_URL}/category-distribution`),
          fetch(`${API_URL}/orders?limit=500`),
          fetch(`${API_URL}/customer-statistics`),
        ]);

        if (!summaryRes.ok || !countryRes.ok || !categoryRes.ok || !ordersRes.ok || !customerRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const summaryData = await summaryRes.json();
        const countryData = await countryRes.json();
        const categoryData = await categoryRes.json();
        const ordersData = await ordersRes.json();
        const customerData = await customerRes.json();

        console.log('Customer stats from API:', customerData); // 调试用

        setSummary(summaryData);
        setCountryDistribution(countryData);
        setCategoryDistribution(categoryData);
        setOrders(ordersData);
        setCustomerStatsRaw(customerData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 字段名映射：snake_case -> camelCase
  const customerStats: CustomerStat[] = useMemo(() => {
    return customerStatsRaw.map(c => ({
      customer: c.customer,
      orders: c.orders,
      totalValue: c.total_value,
      totalWeight: c.total_weight,
      topCountries: c.top_countries,
      marketShare: c.market_share,
      avgRisk: c.avg_risk,
      countriesCount: c.countries_count,
    }));
  }, [customerStatsRaw]);

  const trendData = useMemo(() => {
    return countryDistribution.slice(0, 6).map((c, i) => ({
      date: `2026-0${i + 4}-20`,
      volume: c.orders,
      aiPredicted: Math.round(c.orders * 0.94),
      actual: c.orders,
    }));
  }, [countryDistribution]);

  const categoryChartData = useMemo(() => {
    const englishNames: Record<number, string> = {
  0: "Apparel & Textiles",
  1: "Tools & Hardware",
  2: "Electronics & Electrical",
  3: "Sports & Outdoors",
  4: "Auto Parts",
  5: "Industrial",
  6: "Watches & Eyewear",
  7: "Lighting & Lamps",
  8: "Mobile & Digital",
  9: "Others",
  10: "Mother & Baby",
  11: "Pet Supplies",
  12: "Home & Living",
  13: "Mobile Accessories",
  14: "Beauty & Personal Care",
  15: "Computers & Office",
  16: "Jewelry & Accessories",
  17: "Beauty & Health",
  18: "Bags & Luggage",
  19: "Toys & Hobbies",
  999: "Uncategorized",
    };

    return categoryDistribution.map(c => ({
      name: englishNames[c.category_id] || `Category ${c.category_id}`,
      value: c.orders,
      totalValue: c.total_value,
      avgRisk: c.avg_risk,
      categoryId: c.category_id,
    }));
  }, [categoryDistribution]);

  return {
    summary,
    countryDistribution,
    categoryDistribution,
    customerStats,
    orders,
    trendData,
    categoryChartData,
    loading,
    error,
  };
}

export function useFilteredOrders(initialOrders: Order[]) {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders);
  const [filters, setFilters] = useState({
    countries: [] as string[],
    categories: [] as number[],
    minValue: '',
    maxValue: '',
    riskLevel: 'all',
    searchTerm: '',
  });

  useEffect(() => {
    let result = [...initialOrders];

    if (filters.countries.length > 0) {
      result = result.filter(o => filters.countries.includes(o.country));
    }

    if (filters.categories.length > 0) {
      result = result.filter(o => filters.categories.includes(o.l1_category_id));
    }

    if (filters.minValue) {
      result = result.filter(o => o.declared_value >= parseFloat(filters.minValue));
    }

    if (filters.maxValue) {
      result = result.filter(o => o.declared_value <= parseFloat(filters.maxValue));
    }

    if (filters.riskLevel !== 'all') {
      const riskRanges = {
        high: [0.7, 1],
        medium: [0.4, 0.7],
        low: [0, 0.4],
      };
      const [min, max] = riskRanges[filters.riskLevel as keyof typeof riskRanges];
      result = result.filter(o => o.risk_score >= min && o.risk_score < max);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(o =>
        o.order_id.toLowerCase().includes(term) ||
        o.product_keyword?.toLowerCase().includes(term) ||
        o.country.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(result);
  }, [initialOrders, filters]);

  return { filteredOrders, filters, setFilters };
}
