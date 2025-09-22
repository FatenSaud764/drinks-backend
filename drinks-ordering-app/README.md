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
