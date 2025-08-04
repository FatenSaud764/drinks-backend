# Root Makefile for drinks-ordering-app

BAR_DIR = admin
CLIENT_DIR = client
SHARED_DIR = packages/shared

# Start both dev servers
.PHONY: dev
dev:
	cd $(BAR_DIR) && npm run dev & \
	cd $(CLIENT_DIR) && npm run dev

# Start client only
.PHONY: client
client:
	cd $(CLIENT_DIR) && npm run dev

# Start bar only
.PHONY: bar
bar:
	cd $(BAR_DIR) && npm run dev

# Clean all node_modules and lock files
.PHONY: clean
clean:
	rm -rf $(BAR_DIR)/node_modules \
	       $(CLIENT_DIR)/node_modules \
	       $(SHARED_DIR)/node_modules \
	       $(BAR_DIR)/package-lock.json \
	       $(CLIENT_DIR)/package-lock.json \
	       $(SHARED_DIR)/package-lock.json

# Reinstall all dependencies
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

