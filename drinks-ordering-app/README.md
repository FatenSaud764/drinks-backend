# Drinks Ordering App — Makefile Usage

This project contains two Vite React apps (`admin` and `client`), a backend and a shared package.  

---

## Prerequisites
- Node.js (v24 or later)
- npm (v11 or later)
- Make (GNU Make)

---

## Available Makefile Commands

### `make dev`

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
