#!/bin/bash

# ============================================
# Medusa v2 Docker Setup Script (Bash)
# ============================================
# This script helps you set up the Docker environment
# for Medusa v2 backend with Redis and Supabase
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Medusa v2 Docker Setup Wizard${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if Docker is installed and running
echo -e "${YELLOW}Checking prerequisites...${NC}"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker installed: $DOCKER_VERSION${NC}"
else
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo -e "${YELLOW}  Please install Docker from: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

# Check if Docker is running
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}  Please start Docker Desktop${NC}"
    exit 1
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo -e "${YELLOW}  Please install Node.js 20+ from: https://nodejs.org${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Environment Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if .env already exists
CREATE_ENV=true
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Keeping existing .env file${NC}"
        CREATE_ENV=false
    fi
fi

if [ "$CREATE_ENV" = true ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    
    # Generate secrets
    echo -e "${YELLOW}Generating secure secrets...${NC}"
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Prompt for required values
    echo ""
    echo -e "${CYAN}Please provide the following information:${NC}"
    echo ""
    
    read -p "Supabase DATABASE_URL (postgresql://...): " DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}✗ DATABASE_URL is required${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${CYAN}Enter your Vercel domain (or press Enter to skip):${NC}"
    read -p "Vercel domain (e.g., yourapp.vercel.app): " VERCEL_DOMAIN
    
    echo ""
    echo -e "${CYAN}Enter your Cloudflared tunnel URL (or press Enter to skip):${NC}"
    read -p "Tunnel URL (e.g., https://xxx.trycloudflare.com): " TUNNEL_URL
    
    # Build CORS strings
    STORE_CORS="http://localhost:3000,http://localhost:8000"
    if [ ! -z "$VERCEL_DOMAIN" ]; then
        STORE_CORS="$STORE_CORS,https://$VERCEL_DOMAIN"
    fi
    
    ADMIN_CORS="http://localhost:9000,http://localhost:5173"
    if [ ! -z "$TUNNEL_URL" ]; then
        ADMIN_CORS="$ADMIN_CORS,$TUNNEL_URL"
    fi
    
    # Create .env file
    cat > .env << EOF
# ============================================
# Medusa v2 Backend - Docker Environment
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# ============================================

# Node Environment
NODE_ENV=development
BUILD_TARGET=development

# Database (Supabase)
DATABASE_URL=$DATABASE_URL
DB_NAME=postgres

# Redis (Docker)
REDIS_URL=redis://redis:6379

# CORS Configuration
STORE_CORS=$STORE_CORS
ADMIN_CORS=$ADMIN_CORS
AUTH_CORS=$ADMIN_CORS

# Security Secrets (Auto-generated)
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Publishable API Key (Get from Medusa Admin after first start)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=

# Backend URL
MEDUSA_BACKEND_URL=http://localhost:9000

# Cloudflare R2 (Optional)
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=auto
S3_BUCKET=sixthgear-media
S3_ENDPOINT=
S3_FILE_URL=
EOF
    
    echo -e "${GREEN}✓ .env file created successfully${NC}"
    echo ""
    echo -e "${CYAN}Generated secrets:${NC}"
    echo -e "${GRAY}  JWT_SECRET: $JWT_SECRET${NC}"
    echo -e "${GRAY}  COOKIE_SECRET: $COOKIE_SECRET${NC}"
    echo ""
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Docker Services${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

read -p "Do you want to start Docker services now? (Y/n): " START_SERVICES
if [[ -z "$START_SERVICES" || "$START_SERVICES" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Starting Docker services...${NC}"
    echo -e "${GRAY}This may take a few minutes on first run...${NC}"
    echo ""
    
    if docker compose up -d --build; then
        echo ""
        echo -e "${GREEN}✓ Services started successfully!${NC}"
        echo ""
        echo -e "${YELLOW}Waiting for services to be ready...${NC}"
        sleep 10
        
        echo ""
        echo -e "${CYAN}========================================${NC}"
        echo -e "${CYAN}  Service Status${NC}"
        echo -e "${CYAN}========================================${NC}"
        docker compose ps
        
        echo ""
        echo -e "${CYAN}========================================${NC}"
        echo -e "${CYAN}  Access Points${NC}"
        echo -e "${CYAN}========================================${NC}"
        echo ""
        echo -e "${GREEN}Admin UI:     http://localhost:9000/app${NC}"
        echo -e "${GREEN}Store API:    http://localhost:9000/store/*${NC}"
        echo -e "${GREEN}Health Check: http://localhost:9000/health${NC}"
        echo ""
        echo -e "${YELLOW}Default Admin Credentials:${NC}"
        echo -e "${GRAY}  Email:    admin@medusa-test.com${NC}"
        echo -e "${GRAY}  Password: supersecret${NC}"
        echo ""
        echo -e "${YELLOW}⚠ Remember to:${NC}"
        echo -e "${GRAY}  1. Change admin password after first login${NC}"
        echo -e "${GRAY}  2. Create Publishable API Key in Admin UI${NC}"
        echo -e "${GRAY}  3. Add the key to .env as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY${NC}"
        echo -e "${GRAY}  4. Restart services: docker compose restart medusa${NC}"
        echo ""
        
        read -p "Do you want to view logs? (y/N): " VIEW_LOGS
        if [[ "$VIEW_LOGS" =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "${YELLOW}Showing logs (Press Ctrl+C to exit)...${NC}"
            docker compose logs -f medusa
        fi
    else
        echo ""
        echo -e "${RED}✗ Failed to start services${NC}"
        echo -e "${YELLOW}Check the error messages above${NC}"
        echo ""
        echo -e "${YELLOW}Common issues:${NC}"
        echo -e "${GRAY}  - Port 9000 already in use${NC}"
        echo -e "${GRAY}  - Invalid DATABASE_URL${NC}"
        echo -e "${GRAY}  - Docker out of memory${NC}"
        echo ""
        echo -e "${CYAN}View logs with: docker compose logs medusa${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}Skipping service start${NC}"
    echo -e "${CYAN}To start services later, run: docker compose up -d --build${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Setup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${GRAY}  1. Access Admin UI: http://localhost:9000/app${NC}"
echo -e "${GRAY}  2. Create Publishable API Key${NC}"
echo -e "${GRAY}  3. Update Vercel environment variables${NC}"
echo -e "${GRAY}  4. Test Store API with curl or Postman${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "${GRAY}  - Full guide: DOCKER-SETUP.md${NC}"
echo -e "${GRAY}  - Quick ref:  DOCKER-QUICK-START.md${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "${GRAY}  docker compose ps              # Check status${NC}"
echo -e "${GRAY}  docker compose logs -f medusa  # View logs${NC}"
echo -e "${GRAY}  docker compose restart medusa  # Restart backend${NC}"
echo -e "${GRAY}  docker compose down            # Stop all services${NC}"
echo ""
