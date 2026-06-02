"""
FastAPI 路由
"""
from fastapi import APIRouter, Query
from typing import List, Optional
from data_loader import data_loader

router = APIRouter()


@router.get("/summary")
def summary():
    return data_loader.get_summary()


@router.get("/countries")
def countries():
    return data_loader.get_countries()


@router.get("/categories")
def categories():
    return data_loader.get_categories()


@router.get("/country-distribution")
def country_dist():
    return data_loader.get_country_dist()


@router.get("/category-distribution")
def category_dist():
    return data_loader.get_category_dist()


@router.get("/orders")
def orders(
    countries: Optional[List[str]] = Query(None),
    categories: Optional[List[int]] = Query(None),
    risk_threshold: Optional[float] = None,
    limit: int = 100
):
    return data_loader.get_orders(
        countries=countries,
        categories=categories,
        risk_threshold=risk_threshold,
        limit=limit
    )