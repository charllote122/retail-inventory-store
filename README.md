# 🏪 Retail SaaS — Multi-Tenant E-Commerce Platform with AI Demand Forecasting

A production-grade SaaS platform inspired by Shopify. Merchants launch their own storefront, manage inventory, and see **AI-powered demand forecasts** for every product. Customers browse, cart, and checkout with **real Stripe payments**.

**Built as a portfolio project** demonstrating full-stack engineering, multi-tenant architecture, JWT auth, ML integration, and payment processing.

---

## 🎯 Features

### For Merchants
- ✅ Register and get a **unique storefront URL** (`/store/your-store-name`)
- ✅ **Product CRUD** — add, edit, delete products with image upload
- ✅ **AI demand forecasts** — 7-day predictions per product (XGBoost)
- ✅ **Low-stock alerts** and inventory tracking
- ✅ **Order management** — see incoming orders, update status
- ✅ **Complete isolation** — merchants can never see each other's data

### For Customers
- ✅ Browse any store's public catalog (no login required)
- ✅ **Search + filter + sort** products
- ✅ **Shopping cart** with localStorage persistence
- ✅ **Secure Stripe Checkout** with webhook confirmation
- ✅ Cross-store shopping — one account, any store

### Platform-Level
- ✅ **Multi-tenant architecture** with row-level isolation
- ✅ **Role-based access control** (JWT with `role` claim)
- ✅ **Real payment processing** (Stripe Checkout + webhooks)
- ✅ **AI-powered insights** via a trained XGBoost model
- ✅ **Responsive design** — mobile-first, works on any screen

---

## 🏗️ Architecture




---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Axios |
| **Backend** | FastAPI, Python 3.13, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 |
| **Auth** | JWT (python-jose), bcrypt |
| **ML** | XGBoost, scikit-learn, Pandas, NumPy, SHAP |
| **Payments** | Stripe Checkout + Webhooks |
| **Dev Tools** | Stripe CLI (local webhook forwarding) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL 16+
- Stripe account (test mode)

### 1. Clone the repo

```bash
git clone https://github.com/charllote122/retail-inventory-store.git
cd retail-inventory-store

Backend
cd backend
python -m venv venv
source venv/Scripts/activate    # Windows
# or: source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

Create backend/.env:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/retail_saas
SECRET_KEY=change-this-to-a-random-48-char-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
APP_NAME=Retail SaaS
DEBUG=True
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

Create the database:

psql -U postgres -c "CREATE DATABASE retail_saas;"

Run the backend

python -m uvicorn app.main:app --reload --port 8000
Backend runs at http://localhost:8000 · API docs at http://localhost:8000/docs

Frontend setup

bash
cd frontend
npm install
Create frontend/.env:

env
VITE_API_URL=http://localhost:8000
Run the frontend:

bash
npm run dev
Frontend runs at http://localhost:5173

Project structure

retail_inventory_store/
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   ├── auth.py             # Merchant auth
│   │   │   ├── customers.py        # Customer auth
│   │   │   ├── products.py         # Product CRUD + upload
│   │   │   ├── storefront.py       # Public store endpoints
│   │   │   ├── orders.py           # Orders
│   │   │   ├── predictions.py      # ML forecasts
│   │   │   └── stripe_api.py       # Payment + webhooks
│   │   ├── core/
│   │   │   ├── config.py           # Env loading
│   │   │   ├── security.py         # JWT + bcrypt
│   │   │   └── stripe.py           # Stripe client
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/
│   │   │   └── ml_service.py       # ML inference wrapper
│   │   ├── database.py
│   │   └── main.py
│   ├── scripts/
│   │   └── populate_from_hf.py     # Demo data seeder
│   ├── uploads/               # Uploaded product images
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js           # Customer API + JWT
│   │   │   └── merchantClient.js   # Merchant API + JWT
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── Skeleton.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Customer
│   │   │   ├── MerchantAuthContext.jsx  # Merchant
│   │   │   └── CartContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Storefront.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Success.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── MerchantLogin.jsx
│   │   │   └── MerchantDashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── ml/
│   ├── data/
│   │   ├── raw/                # Generated CSVs
│   │   └── processed/          # Feature-engineered
│   ├── models/
│   │   └── demand_model.pkl    # Trained XGBoost
│   ├── src/
│   │   ├── data_generator.py   # Synthetic retail simulator
│   │   ├── preprocess.py       # Feature engineering
│   │   ├── train.py            # XGBoost training
│   │   ├── predict.py          # 7-day forecasting
│   │   └── explain.py          # SHAP explanations
│   └── requirements.txt
│
├── .gitignore
└── README.md

The ML Model
Data Simulation
Instead of using Kaggle data, I built a custom synthetic retail simulator (ml/src/data_generator.py) that produces:

5 merchants × 200 products = 1,000 products

730 days of sales history = 730,000 rows

Realistic features: weekly/yearly seasonality, promotions, stockouts with lead-time restocking

Stockout rate: ~1.8% (realistic)

