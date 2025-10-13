# Root Makefile for drinks-ordering-app

BAR_DIR = admin
CLIENT_DIR = client
SHARED_DIR = packages/shared
BACKEND_DIR = backend
PYTHON ?= python3
VENV_ACTIVATE = . env/bin/activate

# Start both frontend dev servers
.PHONY: dev
dev:
	cd $(BAR_DIR) && npm run dev & \
	cd $(CLIENT_DIR) && npm run dev

# Install all frontend dependencies
.PHONY: install
install:
	cd $(BAR_DIR) && npm install
	cd $(CLIENT_DIR) && npm install
	cd $(SHARED_DIR) && npm install

# Build both apps (for production)
.PHONY: build
build:
	cd $(BAR_DIR) && npm run build
	cd $(CLIENT_DIR) && npm run build

# Clean all node_modules and build files
.PHONY: clean
clean:
	rm -rf $(BAR_DIR)/node_modules \
	       $(CLIENT_DIR)/node_modules \
	       $(SHARED_DIR)/node_modules \
	       $(BAR_DIR)/package-lock.json \
	       $(CLIENT_DIR)/package-lock.json \
	       $(SHARED_DIR)/package-lock.json \
	       $(BAR_DIR)/dist \
	       $(CLIENT_DIR)/dist

# Backend utility commands (for local development/testing)
.PHONY: create-dummy-data
create-dummy-data:
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py create_dummy_data

.PHONY: migrate
migrate:
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py migrate

.PHONY: test-backend
test-backend:
	cd $(BACKEND_DIR) && ${VENV_ACTIVATE} && ${PYTHON} manage.py test

# Help command
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install            - Install all dependencies"
	@echo "  make dev                - Start both development servers (admin + client)"
	@echo "  make build              - Build both apps for production"
	@echo "  make clean              - Clean build files and node_modules"
	@echo ""
	@echo "Backend utilities (for local backend development):"
	@echo "  make create-dummy-data  - Populate database with test data"
	@echo "  make migrate            - Apply database migrations"
	@echo "  make test-backend       - Run backend tests"
	@echo ""
	@echo "Run individual apps:"
	@echo "  cd admin && npm run dev              - Admin app only"
	@echo "  cd client && npm run dev             - Client app only"
	@echo "  cd client && npm run dev -- --host   - Client app with network access (for mobile)"