# Drinks Ordering App

This project contains two Vite React apps (`admin` and `client`), a backend and a shared package.

---

## Prerequisites

- Node.js (v24 or later)
- npm (v11 or later)
- Make (GNU Make)
- Python 3.10+
- Docker

---

## Available Makefile Commands

Starts both development servers (bar-end and client-end) simultaneously.

1. **Install Dependencies**

   ```bash
   make install
   ```

2. **Start Both Development Server**

   ```bash
   make dev
   ```

3. **Build Both**

   ```bash
   make build
   ```

4. **Clean Build Files**

   ```bash
   make clean
   ```

5. **Install Frontend Dependencies**

   ```bash
   make install-frontend
   ```

6. **Install Backend Dependencies**

   ```bash
   make install-backend
   ```

7. **Start Database (Postgres in Docker)**

   ```bash
   make start-db
   ```

8. **Initialize Database**

   ```bash
   make init-db
   ```

9. **Stop Database**

   ```bash
   make stop-db
   ```

10. **Start Frontend Only (admin + client)**

   ```bash
   make frontend
   ```

11. **Start Backend Only**

   ```bash
   make backend
   ```

12. **Run Backend Tests**

   ```bash
   make test-backend
   ```

13. **Apply Backend Migrations**

   ```bash
   make migrate
   ```

## Available Django management commands

Ensure virtual environment is activated.

1. **Create Dummy Data**
   ```bash
   python manage.py create_dummy_data
   ```

## Inventory Auto-Adjustment Logic

As of latest changes, inventory (drink stock) is automatically adjusted based on order status transitions:

- When an order leaves the `pending` state to any other status except `cancelled`, the quantities of each `OrderItem` are deducted from the corresponding `Drink.stock` exactly once.
- If such an order is later moved to `cancelled`, the previously deducted stock is fully restored.
- Direct cancellation while still `pending` does NOT change stock.

Implementation details:
- A Boolean field `Order.inventory_deducted` tracks whether stock has been deducted for that order to prevent double adjustments.
- Adjustments are performed in a pre-save signal using atomic updates with `F()` expressions for concurrency safety.

Testing:
- New tests in `backend/tests.py` (`InventoryAdjustmentTest`) validate deduction, restocking, idempotency, and no-op on direct cancellation of pending orders.

