#  Coca-Cola Bottlers Africa (CCBA) — Inventory MIS

A full-stack Management Information System for Coca-Cola inventory operations — built with **Django REST Framework** (backend) and **React + Vite** (frontend).

---

##  Project Structure

```
coca-cola-mis/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── coca_cola_mis/                  # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── core/                           # Single core Django application
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py                   # All database models
│       ├── serializers.py              # DRF serializers
│       ├── views.py                    # API views (ViewSets)
│       ├── urls.py                     # App-level URLs
│       ├── permissions.py              # Custom permissions
│       └── migrations/
│           └── 0001_initial.py
│
└── frontend/
    ├── index.html                      # Vite entry HTML
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx                    # React entry point
        ├── App.jsx                     # Router + layout shell
        ├── services/
        │   └── api.js                  # Axios instance + all API calls
        ├── styles/
        │   └── main.css                # Global CSS variables + base styles
        ├── components/
        │   ├── Navbar.jsx              # Top navigation bar
        │   └── Sidebar.jsx             # Collapsible sidebar
        └── pages/
            ├── Login.jsx               # Authentication page
            ├── Dashboard.jsx           # Main KPI dashboard
            ├── ProductList.jsx         # Product inventory table
            ├── Category.jsx            # Category management
            ├── Sales.jsx               # Sales history & list
            ├── NewSale.jsx             # Create new sale / POS
            ├── Reports.jsx             # Analytics & reports
            ├── Profile.jsx             # User profile
            └── Settings.jsx            # App settings
```

---

##  Backend Setup

### Requirements
```
Django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
python-dotenv>=1.0
Pillow>=10.0
django-filter>=23.0
```

### Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your secrets
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### API Base URL
```
http://localhost:8000/api/
```

---

##  Frontend Setup

### Installation
```bash
cd frontend
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

---

##  Authentication

JWT-based authentication via `djangorestframework-simplejwt`.

- `POST /api/auth/login/` — obtain access + refresh tokens
- `POST /api/auth/refresh/` — refresh access token
- `POST /api/auth/logout/` — blacklist refresh token

All protected endpoints require `Authorization: Bearer <access_token>` header.

---

##  Core Models

| Model | Description |
|-------|-------------|
| `User` | Extended Django user with role & profile |
| `Category` | Product categories (e.g. Sparkling, Water, Juice) |
| `Product` | SKU, price, stock level, brand |
| `Supplier` | Supplier contact & metadata |
| `Purchase` | Stock-in records from suppliers |
| `PurchaseItem` | Line items for each purchase |
| `Sale` | Customer sales transactions |
| `SaleItem` | Line items for each sale |
| `StockAdjustment` | Manual stock corrections with audit trail |

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/refresh/` | Refresh token |
| GET/POST | `/api/categories/` | List/create categories |
| GET/PUT/DELETE | `/api/categories/{id}/` | Category detail |
| GET/POST | `/api/products/` | List/create products |
| GET/PUT/DELETE | `/api/products/{id}/` | Product detail |
| GET/POST | `/api/suppliers/` | List/create suppliers |
| GET/POST | `/api/sales/` | List/create sales |
| GET | `/api/sales/{id}/` | Sale detail |
| GET/POST | `/api/purchases/` | List/create purchases |
| GET/POST | `/api/adjustments/` | Stock adjustments |
| GET | `/api/reports/dashboard/` | Dashboard KPIs |
| GET | `/api/reports/sales-trend/` | Sales trend data |
| GET | `/api/reports/top-products/` | Top-selling products |
| GET | `/api/reports/low-stock/` | Low stock alerts |
| GET/PUT | `/api/profile/` | User profile |

---

##  Design System

Inspired by the InApp Inventory Dashboard, adapted for Coca-Cola brand identity:

- **Primary color**: `#E8001B` (Coca-Cola Red)
- **Secondary**: `#1A1A2E` (Dark Navy)
- **Accent**: `#F5F5F0` (Off-white background)
- **Font**: Barlow Condensed (headings) + DM Sans (body)
- **Layout**: Fixed sidebar (260px) + fixed topbar (60px)

---

##  Deployment Notes

- Set `DEBUG=False` and configure `ALLOWED_HOSTS` in `.env`
- Run `python manage.py collectstatic` for production
- Use gunicorn + nginx for the Django backend
- Build React with `npm run build` and serve via nginx

---

*Built for Coca-Cola Bottlers Africa (CCBA) — © 2026*