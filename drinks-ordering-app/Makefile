# Root Makefile for drinks-ordering-app

BAR_DIR = admin
CLIENT_DIR = client
SHARED_DIR = packages/shared
BACKEND_DIR = backend
PYTHON ?= python3
VENV_ACTIVATE = . env/bin/activate
VENV_DIR = env

# Start all dev servers
.PHONY: dev
dev:
	cd $(BAR_DIR) && npm run dev & \
	cd $(CLIENT_DIR) && npm run dev & \
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py runserver

# Start frontend (client + bar) only
.PHONY: frontend
frontend:
	cd $(BAR_DIR) && npm run dev & \
	cd $(CLIENT_DIR) && npm run dev

# Start backend only
.PHONY: backend
backend:
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py runserver

# Install all frontend dependencies
.PHONY: install-frontend
install-frontend:
	cd $(BAR_DIR) && npm install
	cd $(CLIENT_DIR) && npm install
	cd $(SHARED_DIR) && npm install

.PHONY: start-db
start-db:
	docker compose up -d postgres

.PHONY: init-db
init-db: start-db
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py migrate && ${PYTHON} manage.py create_dummy_data

.PHONY: stop-db
stop-db:
	docker compose down

# Install backend dependencies
.PHONY: install-backend
install-backend: start-db
	cd $(BACKEND_DIR) && ${PYTHON} -m venv env && \
	${VENV_ACTIVATE} && \
	pip install -r requirements.txt && \
	${PYTHON} manage.py makemigrations && \
	${PYTHON} manage.py migrate

# Clean all node_modules and lock files
.PHONY: clean
clean:
	rm -rf $(BAR_DIR)/node_modules \
	       $(CLIENT_DIR)/node_modules \
	       $(SHARED_DIR)/node_modules \
	       $(BAR_DIR)/package-lock.json \
	       $(CLIENT_DIR)/package-lock.json \
	       $(SHARED_DIR)/package-lock.json \
		   $(BACKEND_DIR)/$(VENV_DIR) \
	       $(BACKEND_DIR)/__pycache__ \
	       $(BACKEND_DIR)/*.sqlite3 \
	       $(BACKEND_DIR)/.pytest_cache \
	       $(BACKEND_DIR)/*.log
	find $(BACKEND_DIR) -name '*.pyc' -delete
	find $(BACKEND_DIR) -name '*.pyo' -delete

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
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py test

# Apply backend migrations
.PHONY: migrate
migrate:
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py migrate
