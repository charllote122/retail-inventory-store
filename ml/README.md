# ML Pipeline — Demand Forecasting

## Overview
End-to-end demand forecasting for a multi-tenant retail platform.
Predicts 7-day demand per product with SHAP-based explanations.

## Pipeline
1. **data_generator.py** — Simulates 2 years of multi-tenant retail data with lead-time restocking and realistic stockouts (~1.9%).
2. **preprocess.py** — Cleans data, handles censored demand, engineers 22 features (lags, rolling stats, calendar, category encoding).
3. **train.py** — Trains XGBoost with chronological train/test split. Intentionally excludes `promotion_applied` to prevent data leakage.
4. **predict.py** — Recursive 7-day forecast per (merchant, product).
5. **explain.py** — SHAP TreeExplainer for per-prediction feature attribution.

## Metrics
| Metric | Value |
|--------|-------|
| MAE    | 1.92  |
| RMSE   | 2.49  |
| R²     | 0.26  |

R² is intentionally modest because we avoid calendar/promotion leakage. Feature importances are dominated by `rolling_mean_7` and lag features — the correct signal for demand forecasting.

## Tech Stack
- Python, Pandas, NumPy, Scikit-learn, XGBoost, SHAP, Faker