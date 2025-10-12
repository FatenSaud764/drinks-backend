# Drinks Ordering App

This project contains two Vite React apps (`admin` and `client`) that connect to a remote Supabase backend hosted on Render. The frontend apps can run on different devices and communicate through the shared backend.

---

## Prerequisites

- Node.js (v24 or later)
- npm (v11 or later)
- Make (GNU Make)

---

## Available Makefile Commands
Run the following from `drinks-ordering-app/`

1. **To see all available commands:**
   ```bash
   make help
   ```

2. **Install Dependencies**

   ```bash
   make install
   ```

3. **Start Both Development Servers**

   ```bash
   make dev
   ```

   Starts both the admin and client apps simultaneously on one device.

4. **Build Both Apps**

   ```bash
   make build
   ```

5. **Clean Build Files**

   ```bash
   make clean
   ```

---

## Running Apps Individually

### Admin App (view on desktop)

```bash
cd admin/
npm run dev
```

### Client App (view on desktop)

```bash
cd client/
npm run dev
```

### Client App (view on mobile device)

To access the client app from your phone or other devices on the same network:

```bash
cd client
npm run dev -- --host
```

Then enter the network URL displayed in your terminal (e.g., `http://192.168.1.x:5173`) into your phone's browser.

---

## Architecture

- **Backend**: Remote Supabase database hosted on Render
- **Admin Frontend**: Bar staff/admin interface for managing orders and inventory
- **Client Frontend**: Customer-facing app for placing orders

Both frontends connect to the same Supabase backend, allowing real-time communication between devices.

---

## Inventory Auto-Adjustment Logic

Inventory (drink stock) is automatically adjusted based on order status transitions on the backend:

- When an order leaves the `pending` state to any other status except `cancelled`, the quantities of each order item are deducted from the corresponding drink stock exactly once.
- If such an order is later moved to `cancelled`, the previously deducted stock is fully restored.
- Direct cancellation while still `pending` does NOT change stock.