from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging

from data_loader import data_loader

from fastapi import FastAPI, HTTPException
import forecast_processor as fp_module
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="3PL Dashboard API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "3PL Dashboard API", "status": "running"}


@app.get("/api/summary")
async def get_summary():
    """Get summary statistics"""
    try:
        summary = data_loader.get_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/country-distribution")
async def get_country_distribution():
    """Get orders grouped by country"""
    try:
        distribution = data_loader.get_country_distribution()
        return distribution
    except Exception as e:
        logger.error(f"Error getting country distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/category-distribution")
async def get_category_distribution():
    """Get orders grouped by category"""
    try:
        distribution = data_loader.get_category_distribution()
        return distribution
    except Exception as e:
        logger.error(f"Error getting category distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/orders")
async def get_orders(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    countries: Optional[List[str]] = Query(None),
    categories: Optional[List[int]] = Query(None),
    min_value: Optional[float] = Query(None),
    max_value: Optional[float] = Query(None),
    risk_level: Optional[str] = Query(None),
    search_term: Optional[str] = Query(None)
):
    """Get individual orders with optional filtering"""
    try:
        # If any filter parameters are provided, use filter_orders
        if any([countries, categories, min_value, max_value, risk_level, search_term]):
            orders = data_loader.filter_orders(
                countries=countries,
                categories=categories,
                min_value=min_value,
                max_value=max_value,
                risk_level=risk_level,
                search_term=search_term,
                limit=limit
            )
        else:
            orders = data_loader.get_orders(limit=limit, offset=offset)

        return orders
    except Exception as e:
        logger.error(f"Error getting orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/customer-statistics")
async def get_customer_statistics():
    """Get customer-level aggregated statistics"""
    try:
        stats = data_loader.get_customer_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting customer statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/countries")
async def get_countries():
    """Get list of unique countries"""
    try:
        if data_loader.df.empty:
            return []
        countries = data_loader.df['country'].unique().tolist()
        return sorted(countries)
    except Exception as e:
        logger.error(f"Error getting countries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories")
async def get_categories():
    """Get list of unique categories"""
    try:
        if data_loader.df.empty or 'l1_category_id' not in data_loader.df.columns:
            return []

        categories = data_loader.df[['l1_category_id', 'l1_category_name']].drop_duplicates()
        return categories.to_dict('records')
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
async def startup_event():
    """Initialize forecast processor on startup"""
    # Try multiple possible paths
    possible_paths = [
        # Path relative to main.py location
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', '3PL_Final_Forecast_Report.csv'),
        # Path relative to current working directory
        os.path.join(os.getcwd(), 'data', '3PL_Final_Forecast_Report.csv'),
        # Direct path if running from backend folder
        os.path.join(os.getcwd(), '..', 'data', '3PL_Final_Forecast_Report.csv'),
        # Absolute path construction
        os.path.abspath(os.path.join('..', 'data', '3PL_Final_Forecast_Report.csv')),
    ]

    forecast_csv = None
    for path in possible_paths:
        normalized = os.path.normpath(path)
        logger.info(f"Checking: {normalized} -> exists: {os.path.exists(normalized)}")
        if os.path.exists(normalized):
            forecast_csv = normalized
            break

    if forecast_csv:
        try:
            fp_module.init_forecast_processor(forecast_csv)
            logger.info(f"Forecast processor initialized with: {forecast_csv}")
        except Exception as e:
            logger.error(f"Failed to initialize forecast processor: {e}")
    else:
        logger.error("Forecast CSV not found in any of the searched locations")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")


@app.get("/api/forecast-analysis")
async def get_forecast_analysis():
    """Get 4-week forecast analysis with capacity gaps"""
    try:
        if fp_module.forecast_processor is None:
            raise HTTPException(status_code=503, detail="Forecast processor not initialized")

        forecasts = fp_module.forecast_processor.get_forecast_analysis()
        performance = fp_module.forecast_processor.get_performance_metrics()

        return {
            "forecasts": forecasts,
            "performance": performance,
            "total_entities": len(forecasts),
            "entities_with_gap": len([f for f in forecasts if f['gap'] > 0])
        }
    except Exception as e:
        logger.error(f"Error getting forecast analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)