# Finance Data Processing & Access Control Backend

A production-ready REST API for a finance dashboard with JWT authentication, role-based access control, financial record management, and analytics endpoints.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Auth | JSON Web Tokens (JWT) |
| Validation | Joi |
| Logging | Winston + Morgan |
| Testing | Jest + Supertest |
| Rate Limiting | express-rate-limit |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verify + role guard
│   │   ├── validate.js         # Joi validation schemas
│   │   └── errorHandler.js     # Global error + 404 handler
│   ├── models/
│   │   ├── User.js
│   │   └── FinancialRecord.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── records.js
│   │   └── dashboard.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── recordService.js
│   │   └── dashboardService.js
│   ├── utils/
│   │   ├── apiResponse.js      # Standardised response helpers
│   │   └── logger.js           # Winston logger
│   ├── app.js                  # Express app setup
│   └── server.js               # Entry point + DB seed
├── tests/
│   └── api.test.js
├── .env.example
├── .gitignore
├── jest.config.json
├── package.json
└── README.md
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 2. Install Dependencies

```bash
cd finance-backend
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 4. Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### 5. Default Admin Account

On first startup, a seed admin user is created automatically:

| Field | Value |
|---|---|
| Email | admin@finance.dev |
| Password | Admin@123 |
| Role | admin |

> ⚠️ Change this password immediately in any non-local environment.

### 6. Run Tests

```bash
npm test
```

> Tests require a local MongoDB instance. A separate `finance_test` database is used and wiped after each run.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret for signing JWTs | — |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

---

## Role Permissions

| Endpoint Group | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| GET /api/records | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /api/records | ❌ | ❌ | ✅ |
| GET /api/dashboard/* | ❌ | ✅ | ✅ |
| GET/POST/PUT/DELETE /api/users | ❌ | ❌ | ✅ |

---

## API Reference

All responses follow this envelope:

```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
}
```

---

### Auth

#### POST /api/auth/login

```json
// Request
{ "email": "admin@finance.dev", "password": "Admin@123" }

// Response 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": { "_id": "...", "name": "Super Admin", "email": "admin@finance.dev", "role": "admin" }
  }
}
```

#### GET /api/auth/me
> Requires: Bearer token

Returns the currently authenticated user's profile.

---

### Users (Admin only)

#### GET /api/users?page=1&limit=10

#### POST /api/users

```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "Secure@123",
  "role": "analyst",
  "status": "active"
}
```

#### GET /api/users/:id

#### PUT /api/users/:id

```json
{ "role": "viewer", "status": "inactive" }
```

#### DELETE /api/users/:id
Soft deletes the user (sets `deletedAt`). Cannot delete your own account.

---

### Financial Records

#### POST /api/records (Admin)

```json
{
  "amount": 75000,
  "type": "income",
  "category": "salary",
  "date": "2024-03-01",
  "notes": "March salary"
}
```

**Valid types:** `income`, `expense`

**Valid categories:** `salary`, `freelance`, `investment`, `business`, `food`, `rent`, `utilities`, `transport`, `health`, `entertainment`, `education`, `shopping`, `other`

#### GET /api/records (All roles)

Supports query parameters:

| Param | Type | Example |
|---|---|---|
| `type` | string | `income` or `expense` |
| `category` | string | `salary` |
| `startDate` | ISO date | `2024-01-01` |
| `endDate` | ISO date | `2024-03-31` |
| `search` | string | `bonus` (searches notes) |
| `page` | number | `1` |
| `limit` | number | `20` |
| `sortBy` | string | `date`, `amount` |
| `order` | string | `asc` or `desc` |

```
GET /api/records?type=expense&category=food&startDate=2024-01-01&page=1&limit=20
```

#### GET /api/records/:id (All roles)

#### PUT /api/records/:id (Admin)

```json
{ "amount": 80000, "notes": "Corrected amount" }
```

#### DELETE /api/records/:id (Admin)
Soft deletes the record.

---

### Dashboard (Analyst + Admin)

#### GET /api/dashboard
Returns all dashboard data in one call (summary + categories + recent + monthly).

#### GET /api/dashboard/summary

```json
{
  "data": {
    "totalIncome": 150000,
    "totalExpenses": 62000,
    "netBalance": 88000
  }
}
```

#### GET /api/dashboard/categories

```json
{
  "data": {
    "income": [
      { "category": "salary", "total": 120000, "count": 2 }
    ],
    "expense": [
      { "category": "rent", "total": 30000, "count": 3 },
      { "category": "food", "total": 12000, "count": 15 }
    ]
  }
}
```

#### GET /api/dashboard/recent?limit=5

Returns the 5 most recent transactions.

#### GET /api/dashboard/monthly?year=2024

```json
{
  "data": {
    "year": 2024,
    "months": [
      { "month": 1, "monthName": "January", "income": 75000, "expense": 21000, "net": 54000 },
      { "month": 2, "monthName": "February", "income": 75000, "expense": 19500, "net": 55500 }
    ]
  }
}
```

---

## Error Responses

```json
// 400 Validation error
{
  "success": false,
  "message": "Validation failed",
  "errors": ["'amount' must be a positive number", "'type' is required"]
}

// 401 Unauthorized
{ "success": false, "message": "Access denied. No token provided." }

// 403 Forbidden
{ "success": false, "message": "Access denied. Required role: admin. Your role: viewer" }

// 404 Not Found
{ "success": false, "message": "Record not found" }

// 409 Conflict
{ "success": false, "message": "email already exists." }
```

---

## Assumptions Made

1. **Categories are predefined** — The list of categories is fixed in the model. This avoids messy free-text categories that break analytics grouping. In production, categories could be made configurable via a separate collection.

2. **Soft delete is default** — Both users and records are soft-deleted (a `deletedAt` field is set). They are automatically filtered out of all queries via Mongoose middleware. Hard delete is not exposed.

3. **All amounts are positive** — Income and expense direction is determined by the `type` field, not a negative amount. This simplifies aggregation logic.

4. **Single currency** — No currency field is included. Multi-currency support would require an exchange rate service.

5. **Any admin can modify any record** — There is no record ownership enforcement (i.e., an admin can edit records created by another admin). `createdBy` is tracked for auditing only.

6. **Pagination defaults** — Default page size is 10 records. Maximum is not enforced but could be added for large datasets.

7. **Logs directory** — Winston writes to a `logs/` directory at the project root. Create this directory or it will be created automatically on first log write.
