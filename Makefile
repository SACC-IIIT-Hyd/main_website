# SACC Website Docker Management Makefile
# This Makefile provides comprehensive commands for managing Docker containers,
# PostgreSQL database backups, and CRON job automation.

include .env

# Default variables
COMPOSE_FILE ?= docker-compose.yml
BACKUP_DIR ?= ./backups
POSTGRES_CONTAINER ?= sacc_postgres
BACKUP_RETENTION_DAYS ?= 30
BACKUP_FREQUENCY ?= daily

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

.PHONY: help build up down restart logs status clean
.PHONY: db-backup db-restore db-list-backups db-cleanup-old
.PHONY: cron-install cron-uninstall cron-status cron-logs
.PHONY: dev prod migrate seed

# Default target
help: ## Show this help message
	@echo "$(BLUE)SACC Website Docker Management$(NC)"
	@echo "Usage: make [target]"
	@echo ""
	@echo "$(GREEN)Container Management:$(NC)"
	@awk '/^[a-zA-Z_-]+:.*## / { split($$0, a, "## "); printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, a[2] }' $(MAKEFILE_LIST) | grep -E "(build|up|down|restart|logs|status|clean)"
	@echo ""
	@echo "$(GREEN)Database Management:$(NC)"
	@awk '/^[a-zA-Z_-]+:.*## / { split($$0, a, "## "); printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, a[2] }' $(MAKEFILE_LIST) | grep -E "db-"
	@echo ""
	@echo "$(GREEN)CRON Management:$(NC)"
	@awk '/^[a-zA-Z_-]+:.*## / { split($$0, a, "## "); printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, a[2] }' $(MAKEFILE_LIST) | grep -E "cron-"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@awk '/^[a-zA-Z_-]+:.*## / { split($$0, a, "## "); printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, a[2] }' $(MAKEFILE_LIST) | grep -E "(dev|prod|migrate|seed|health)"

# Container Management
build: ## Build all Docker containers
	@echo "$(BLUE)Building Docker containers...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)Build completed!$(NC)"

up: ## Start all containers in detached mode
	@echo "$(BLUE)Starting containers...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)All containers started!$(NC)"
	@make status

down: ## Stop and remove all containers
	@echo "$(BLUE)Stopping containers...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)All containers stopped!$(NC)"

restart: ## Restart all containers
	@echo "$(BLUE)Restarting containers...$(NC)"
	@make down
	@make up

logs: ## Show logs for all containers (add SERVICE=name for specific service)
ifdef SERVICE
	docker-compose -f $(COMPOSE_FILE) logs -f $(SERVICE)
else
	docker-compose -f $(COMPOSE_FILE) logs -f
endif

status: ## Show container status
	@echo "$(BLUE)Container Status:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps

clean: ## Remove stopped containers, unused networks, images, and volumes
	@echo "$(YELLOW)Warning: This will remove unused Docker resources$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -af --volumes; \
		echo "$(GREEN)Cleanup completed!$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled$(NC)"; \
	fi

# Database Management
db-backup: ## Create a database backup
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p $(BACKUP_DIR)
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	BACKUP_FILE="$(BACKUP_DIR)/sacc_db_backup_$$TIMESTAMP.sql"; \
	if docker exec $(POSTGRES_CONTAINER) pg_dump -U $(POSTGRES_USER) -d $(POSTGRES_DB) > $$BACKUP_FILE; then \
		echo "$(GREEN)Backup created: $$BACKUP_FILE$(NC)"; \
		gzip $$BACKUP_FILE; \
		echo "$(GREEN)Backup compressed: $$BACKUP_FILE.gz$(NC)"; \
	else \
		echo "$(RED)Backup failed!$(NC)"; \
		exit 1; \
	fi

db-restore: ## Restore database from backup (usage: make db-restore BACKUP_FILE=path/to/backup.sql.gz)
ifndef BACKUP_FILE
	@echo "$(RED)Error: BACKUP_FILE not specified$(NC)"
	@echo "Usage: make db-restore BACKUP_FILE=path/to/backup.sql.gz"
	@exit 1
endif
	@echo "$(BLUE)Restoring database from $(BACKUP_FILE)...$(NC)"
	@if [ ! -f "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: Backup file $(BACKUP_FILE) not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Warning: This will replace all existing data$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		if [[ "$(BACKUP_FILE)" == *.gz ]]; then \
			gunzip -c $(BACKUP_FILE) | docker exec -i $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB); \
		else \
			docker exec -i $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) < $(BACKUP_FILE); \
		fi; \
		echo "$(GREEN)Database restored successfully!$(NC)"; \
	else \
		echo "$(YELLOW)Restore cancelled$(NC)"; \
	fi

db-list-backups: ## List all available backups
	@echo "$(BLUE)Available backups:$(NC)"
	@if [ -d "$(BACKUP_DIR)" ]; then \
		ls -lah $(BACKUP_DIR)/*.sql.gz 2>/dev/null || echo "$(YELLOW)No backups found$(NC)"; \
	else \
		echo "$(YELLOW)Backup directory does not exist$(NC)"; \
	fi

db-cleanup-old: ## Remove backups older than BACKUP_RETENTION_DAYS days
	@echo "$(BLUE)Cleaning up backups older than $(BACKUP_RETENTION_DAYS) days...$(NC)"
	@if [ -d "$(BACKUP_DIR)" ]; then \
		DELETED=$$(find $(BACKUP_DIR) -name "*.sql.gz" -type f -mtime +$(BACKUP_RETENTION_DAYS) -delete -print | wc -l); \
		echo "$(GREEN)Deleted $$DELETED old backup(s)$(NC)"; \
	else \
		echo "$(YELLOW)Backup directory does not exist$(NC)"; \
	fi

# CRON Management
cron-install: ## Install CRON job for automated backups
	@echo "$(BLUE)Installing CRON job for $(BACKUP_FREQUENCY) backups...$(NC)"
	@CRON_SCHEDULE=""; \
	case "$(BACKUP_FREQUENCY)" in \
		"hourly") CRON_SCHEDULE="0 * * * *" ;; \
		"daily") CRON_SCHEDULE="0 2 * * *" ;; \
		"weekly") CRON_SCHEDULE="0 2 * * 0" ;; \
		"monthly") CRON_SCHEDULE="0 2 1 * *" ;; \
		*) echo "$(RED)Invalid BACKUP_FREQUENCY. Use: hourly, daily, weekly, monthly$(NC)"; exit 1 ;; \
	esac; \
	CRON_JOB="$$CRON_SCHEDULE cd $(PWD) && /usr/bin/make db-backup >> $(PWD)/logs/backup.log 2>&1"; \
	CLEANUP_JOB="0 3 * * 0 cd $(PWD) && /usr/bin/make db-cleanup-old >> $(PWD)/logs/backup.log 2>&1"; \
	mkdir -p $(PWD)/logs; \
	(crontab -l 2>/dev/null | grep -v "make db-backup"; echo "$$CRON_JOB") | crontab -; \
	(crontab -l 2>/dev/null | grep -v "make db-cleanup-old"; echo "$$CLEANUP_JOB") | crontab -; \
	echo "$(GREEN)CRON job installed successfully!$(NC)"; \
	echo "$(BLUE)Backup schedule: $(BACKUP_FREQUENCY) at 2:00 AM$(NC)"; \
	echo "$(BLUE)Cleanup schedule: Weekly on Sunday at 3:00 AM$(NC)"

cron-uninstall: ## Remove CRON job for automated backups
	@echo "$(BLUE)Removing CRON jobs...$(NC)"
	@crontab -l 2>/dev/null | grep -v "make db-backup" | grep -v "make db-cleanup-old" | crontab -
	@echo "$(GREEN)CRON jobs removed successfully!$(NC)"

cron-status: ## Show current CRON jobs
	@echo "$(BLUE)Current CRON jobs:$(NC)"
	@crontab -l 2>/dev/null | grep -E "(make db-backup|make db-cleanup-old)" || echo "$(YELLOW)No backup CRON jobs found$(NC)"

cron-logs: ## Show backup logs
	@if [ -f "$(PWD)/logs/backup.log" ]; then \
		echo "$(BLUE)Recent backup logs:$(NC)"; \
		tail -50 $(PWD)/logs/backup.log; \
	else \
		echo "$(YELLOW)No backup logs found$(NC)"; \
	fi

# Development shortcuts
dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	@make up
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo "$(BLUE)Frontend: http://localhost$(NC)"
	@echo "$(BLUE)Backend API: http://localhost/api$(NC)"
	@echo "$(BLUE)Database: localhost:5432$(NC)"

prod: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	@if [ -f "docker-compose.prod.yml" ]; then \
		COMPOSE_FILE=docker-compose.prod.yml make up; \
	else \
		echo "$(YELLOW)No production compose file found, using default$(NC)"; \
		make up; \
	fi

migrate: ## Run database migrations (placeholder for future use)
	@echo "$(BLUE)Running database migrations...$(NC)"
	@echo "$(YELLOW)Migration system not yet implemented$(NC)"

seed: ## Seed database with initial data (placeholder for future use)
	@echo "$(BLUE)Seeding database...$(NC)"
	@echo "$(YELLOW)Seed system not yet implemented$(NC)"

# Health checks
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(BLUE)Database connection test:$(NC)"
	@if docker exec $(POSTGRES_CONTAINER) pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Database is healthy$(NC)"; \
	else \
		echo "$(RED)✗ Database is not responding$(NC)"; \
	fi

# Quick backup and restore shortcuts
quick-backup: db-backup ## Alias for db-backup

quick-restore: ## Quick restore from latest backup
	@LATEST_BACKUP=$$(ls -t $(BACKUP_DIR)/*.sql.gz 2>/dev/null | head -1); \
	if [ -n "$$LATEST_BACKUP" ]; then \
		echo "$(BLUE)Latest backup: $$LATEST_BACKUP$(NC)"; \
		make db-restore BACKUP_FILE=$$LATEST_BACKUP; \
	else \
		echo "$(RED)No backups found$(NC)"; \
	fi