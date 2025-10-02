ENV ?= development

# Docker Compose files
COMPOSE_FILE = docker-compose.yaml
COMPOSE_FILE_OVERRIDE = docker-compose.override.yaml

# Include environment-specific variables if .env exists
-include .env
export

.PHONY: help build up down restart logs clean dev test

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "Starting development environment..."
	@docker compose up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:8080"
	@echo "API Docs: http://localhost:8080/docs.html"
	@echo "PostgreSQL: localhost:5432"

dev-build: ## Build and start development environment
	@echo "Building and starting development environment..."
	@docker compose up --build -d

dev-logs: ## Show development logs
	@docker compose logs -f

# Build commands
build: ## Build all services
	@docker compose build

build-backend: ## Rebuild only the backend service
	@echo "Rebuilding backend..."
	@docker compose up --build backend -d
	@echo "Backend rebuilt and started!"

build-frontend: ## Rebuild only the frontend service
	@echo "Rebuilding frontend..."
	@docker compose up --build frontend -d
	@echo "Frontend rebuilt and started!"

# Service management
up: ## Start all services
	@docker compose up -d

down: ## Stop all services
	@docker compose down

restart: ## Restart all services
	@docker compose restart

restart-backend: ## Restart only backend
	@docker compose restart backend

restart-frontend: ## Restart only frontend
	@docker compose restart frontend

# Logs
logs: ## Show logs for all services
	@docker compose logs -f

logs-backend: ## Show backend logs
	@docker compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker compose logs -f frontend

logs-db: ## Show PostgreSQL logs
	@docker compose logs -f postgres

# Database commands
db-reset: ## Reset PostgreSQL (WARNING: This will delete all data)
	@echo "Resetting PostgreSQL..."
	@docker compose down postgres
	@docker volume rm $(shell basename $(CURDIR))_postgres_data 2>/dev/null || true
	@docker compose up -d postgres
	@echo "PostgreSQL reset complete!"

db-shell: ## Access PostgreSQL shell
	@docker compose exec postgres psql -U myuser -d mydatabase

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@docker compose ps

status: ## Show status of all services
	@docker compose ps

# Shell access
shell-backend: ## Access backend container shell
	@docker compose exec backend bash

shell-frontend: ## Access frontend container shell
	@docker compose exec frontend sh



# Cleanup commands
clean: ## Remove all containers and volumes
	@echo "Cleaning up..."
	@docker compose down -v --remove-orphans
	@echo "Cleanup complete!"

clean-hard: ## Nuclear cleanup - remove EVERYTHING Docker related to this project
	@echo "WARNING: This will remove ALL project containers, images, and volumes!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down -v --remove-orphans; \
		docker volume ls -q | grep "$(shell basename $(CURDIR))" | xargs -r docker volume rm; \
		docker image ls -q --filter "reference=*$(shell basename $(CURDIR))*" | xargs -r docker rmi -f; \
		echo "Project cleanup complete!"; \
	else \
		echo "Cleanup cancelled."; \
	fi

clean-volumes: ## Remove only volumes
	@echo "Removing volumes..."
	@docker compose down -v
	@echo "Volumes removed!"

# Environment setup
setup-env: ## Setup environment files
	@echo "Setting up environment files..."
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "backend/.env created from backend/.env.example"; fi
	@echo "Environment files ready! Update backend/.env with your values if needed."

