# Root Makefile for drinks-ordering-app

BAR_DIR = admin
CLIENT_DIR = client
SHARED_DIR = packages/shared
BACKEND_DIR = backend

# Start all dev servers
.PHONY: dev
dev:
	cd $(BAR_DIR) && npm run dev & \
	cd $(CLIENT_DIR) && npm run dev & \
	cd $(BACKEND_DIR) && source env/bin/activate && python manage.py runserver

# Start frontend (client + bar) only
.PHONY: frontend
frontend:
	cd $(BAR_DIR) && npm run dev & \
	cd $(CLIENT_DIR) && npm run dev

# Start backend only
.PHONY: backend
backend:
	cd $(BACKEND_DIR) && source venv/bin/activate && python manage.py runserver

# Install all frontend dependencies
.PHONY: install-frontend
install-frontend:
	cd $(BAR_DIR) && npm install
	cd $(CLIENT_DIR) && npm install
	cd $(SHARED_DIR) && npm install

# Install backend dependencies
.PHONY: install-backend
install-backend:
	cd $(BACKEND_DIR) && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Clean all node_modules and lock files
.PHONY: clean
clean:
	rm -rf $(BAR_DIR)/node_modules \
	       $(CLIENT_DIR)/node_modules \
	       $(SHARED_DIR)/node_modules \
	       $(BAR_DIR)/package-lock.json \
	       $(CLIENT_DIR)/package-lock.json \
	       $(SHARED_DIR)/package-lock.json

# Reinstall everything (frontend + backend)
.PHONY: install
install: install-frontend install-backend

# Build both apps (for production)
.PHONY: build
build:
	cd $(BAR_DIR) && npm run build
	cd $(CLIENT_DIR) && npm run build

# Run backend tests
.PHONY: test-backend
test-backend:
	cd $(BACKEND_DIR) && source venv/bin/activate && python manage.py test

# Apply backend migrations
.PHONY: migrate
migrate:
	cd $(BACKEND_DIR) && source venv/bin/activate && python manage.py migrate
