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

3. **Run only the Client**

   ```bash
   make client
   ```

4. **Run only the Bar**

   ```bash
   make bar
   ```

5. **Build Both**

   ```bash
   make build
   ```

6. **Clean Build Files**

   ```bash
   make clean
   ```

7. **Install Frontend Dependencies**

   ```bash
   make install-frontend
   ```

8. **Install Backend Dependencies**

   ```bash
   make install-backend
   ```

9. **Start Database (Postgres in Docker)**

   ```bash
   make start-db
   ```

10. **Initialize Database**

```bash
make init-db
```

11. **Stop Database**

```bash
make stop-db
```

12. **Start Frontend Only (admin + client)**

```bash
make frontend
```

13. **Start Backend Only**

```bash
make backend
```

14. **Run Backend Tests**

```bash
make test-backend
```

15. **Apply Backend Migrations**

```bash
make migrate
```

## Available Django management commands

Ensure virtual environment is activated.

1. **Create Dummy Data**
   ```bash
   python manage.py create_dummy_data
   ```
