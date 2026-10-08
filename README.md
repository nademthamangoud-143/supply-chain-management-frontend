# SupplyFlow Pro Frontend

Professional React/Vite frontend for the Supply Chain Management System.

## Backend
- Spring Boot API: `http://localhost:8081`
- Login: `POST /api/auth/login`
- JWT is stored in sessionStorage and attached as `Authorization: Bearer <token>`.

## Run
```powershell
npm install
npm run dev
```
Open `http://localhost:5173`.

## Important
The UI is mapped to the existing backend endpoints:
`/api/categories`, `/api/products`, `/api/warehouses`, `/api/suppliers`,
`/api/inventory`, `/api/orders`, `/api/purchase-orders`, `/api/shipments`,
and `/api/stock-movements`.

If a backend response shape differs, the API adapter in `src/api.js` is the single place to adjust it.
