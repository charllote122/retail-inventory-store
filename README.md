# 🏪 Retail SaaS — Multi-Tenant E-Commerce Platform with AI Demand Forecasting

A production-grade SaaS platform inspired by Shopify. Merchants launch their own storefront, manage inventory, and see AI-powered demand forecasts for every product. Customers browse, cart, and checkout with Stripe payments.

This project is designed as a portfolio-grade system that blends full-stack engineering, SaaS architecture, ML forecasting, and payment processing. It now also includes production hardening patterns such as migration support, validated environment configuration, rate limiting, audit logging, and stronger webhook verification.

---

## 🎯 Features

### For Merchants
- Register and get a unique storefront URL
- Product CRUD with image upload
- AI demand forecasts for inventory planning
- Low-stock alerts and inventory tracking
- Order management and fulfillment visibility
- Tenant isolation between merchant accounts

### For Customers
- Browse any public storefront
- Search, filter, and sort products
- Persistent cart experience
- Secure Stripe Checkout flow
- Cross-store shopping in one customer account

### Platform-Level
- Multi-tenant architecture with scoped access control
- JWT-based RBAC
- Stripe Checkout and webhook confirmation
- XGBoost-based demand predictions
- Responsive React UI
- Hardened config and security defaults

---

## 🛡️ Production Hardening Included

The project now includes the following operational improvements:

- Database migrations with Alembic support
- Stronger environment validation in the backend settings layer
- Rate limiting for API endpoints using SlowAPI
- Request audit logging for operational visibility
- Stricter Stripe webhook signature verification and safer error handling
- CI/CD workflow checks for backend and frontend validation

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7, Axios |
| Backend | FastAPI, Python 3.13, Pydantic v2, Uvicorn |
| Database | PostgreSQL 16, SQLAlchemy 2.0 |
| Auth | JWT, bcrypt |
| ML | XGBoost, scikit-learn, Pandas, NumPy, SHAP |
| Payments | Stripe Checkout + Webhooks |
| DevOps | Alembic, GitHub Actions, SlowAPI |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL 16+
- Stripe account with test keys

### 1. Clone the repo

```bash
git clone https://github.com/charllote122/retail-inventory-store.git
cd retail-inventory-store
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Then set your values in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/retail_saas
SECRET_KEY=replace-with-a-long-random-secret-key-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
APP_NAME=Retail SaaS
DEBUG=True
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Create the database:

```bash
createdb retail_saas
```

Run the backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend docs: http://localhost:8000/docs

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at http://localhost:5173

---

## 🧬 Database Migrations

This project includes Alembic support for schema evolution.

```bash
cd backend
alembic revision -m "initial_schema"
alembic upgrade head
```

If you are bootstrapping from scratch, the app still runs `Base.metadata.create_all()` in development mode, but Alembic is the preferred path for production and iteration.

---

## 🔒 Security and Reliability Notes

- Env values are validated at startup for required keys and safe formats.
- CORS origins are derived from config instead of being hardcoded in multiple places.
- Request rate limits help protect public endpoints.
- Audit logs record request metadata for debugging and operational review.
- Stripe webhook payloads are verified using the signature and validated before order updates.

---

## 📁 Project Structure

```text
retail_inventory_store/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── scripts/
│   ├── .env.example
│   ├── alembic.ini
│   ├── requirements.txt
│   └── uploads/
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── ml/
│   ├── src/
│   ├── data/
│   └── requirements.txt
├── .gitignore
├── README.md
└── requirements.txt
```

---

## 🤖 ML Model

The project uses a synthetic retail simulator rather than public Kaggle data. The generator creates a realistic dataset with vendor and seasonality patterns, stockouts, promotions, and multi-store demand behavior.

This supports a forecasting flow for next-step inventory planning and low-stock alerts.

---

## ✅ CI/CD Checks

The repository includes a GitHub Actions workflow that validates:

- backend dependency installation
- Python syntax and compile checks
- frontend dependency installation
- Vite production build
- lint checks for the frontend

This gives a baseline pipeline for code quality and regression prevention.

