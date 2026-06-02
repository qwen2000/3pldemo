import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api';

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
  risk_score: number;
  logistics_status: string;
}

// Hook: 汇总数据
export function useSummary() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/summary`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// Hook: 国家分布
export function useCountryDist() {
  const [data, setData] = useState<CountryStat[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/country-distribution`)
      .then(r => r.json())
      .then(setData);
  }, []);

  return data;
}

// Hook: 类目分布
export function useCategoryDist() {
  const [data, setData] = useState<CategoryStat[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/category-distribution`)
      .then(r => r.json())
      .then(setData);
  }, []);

  return data;
}

// Hook: 国家列表
export function useCountries() {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/countries`)
      .then(r => r.json())
      .then(setData);
  }, []);

  return data;
}

// Hook: 类目列表
export function useCategories() {
  const [data, setData] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(r => r.json())
      .then(setData);
  }, []);

  return data;
}

// Hook: 筛选订单
export function useOrders(filters: {
  countries?: string[];
  categories?: number[];
  riskThreshold?: number;
}) {
  const [data, setData] = useState<Order[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    filters.countries?.forEach(c => params.append('countries', c));
    filters.categories?.forEach(c => params.append('categories', String(c)));
    if (filters.riskThreshold) params.set('risk_threshold', String(filters.riskThreshold));

    fetch(`${API_URL}/orders?${params}`)
      .then(r => r.json())
      .then(setData);
  }, [JSON.stringify(filters)]);

  return data;
}