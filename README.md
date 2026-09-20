# 🏪 Retail SaaS — Multi-Tenant E-Commerce Platform with AI Demand Forecasting

A production-grade SaaS platform inspired by Shopify. Merchants launch their own storefront, manage inventory, and see AI-powered demand forecasts for every product. Customers browse, cart, and checkout with Stripe payments.

Built as a portfolio project demonstrating full-stack engineering, multi-tenant architecture, ML forecasting, payment processing, and production hardening.

---

## 🎯 Features

### For Merchants
- Register and get a unique storefront URL (`/store/your-store-name`)
- Product CRUD with image upload
- AI demand forecasts for inventory planning
- Low-stock alerts and inventory tracking
- Order management and fulfillment visibility
- Complete tenant isolation between merchant accounts

### For Customers
- Browse any public storefront
- Search, filter by category, and sort products
- Persistent cart experience
- Secure Stripe Checkout flow
- Cross-store shopping in one customer account

### Platform-Level
- Multi-tenant architecture with scoped access control
- JWT-based role access control (`merchant` vs `customer`)
- Stripe Checkout with webhook confirmation
- XGBoost-based demand predictions served via API
- Responsive React UI (mobile + desktop)
- Hardened config and security defaults

---

## 📸 Screenshots

### Home — Multi-tenant store directory
![Home page with store cards](docs/screenshots/01-home.png)

### Storefront — Search, filters, and product grid
![Storefront with search and category filters](docs/screenshots/02-storefront.png)

### Product Detail — Hover-to-zoom on high-res images
![Product detail page](docs/screenshots/03-product-detail.png)

### Merchant Dashboard — AI demand forecasts for every product
![Merchant dashboard with AI predictions](docs/screenshots/04-dashboard.png)

### Stripe Checkout — Real payment flow
![Stripe checkout page](docs/screenshots/05-stripe-checkout.png)

### Payment Success — Order confirmed via webhook
![Payment success page](docs/screenshots/06-success.png)

---

## 🛡️ Production Hardening Included

- **Database migrations** with Alembic support
- **Environment validation** in the backend settings layer
- **Rate limiting** for API endpoints using SlowAPI
- **Structured config** with Pydantic Settings
- **Strict Stripe webhook verification** with signature validation
- **CI workflow** for backend and frontend validation via GitHub Actions

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
- Stripe account (test mode)

### 1. Clone the repo

```bash
git clone https://github.com/charllote122/retail-inventory-store.git
cd retail-inventory-store

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

