# ============================================
# Medusa v2 Docker Setup Script (PowerShell)
# ============================================
# This script helps you set up the Docker environment
# for Medusa v2 backend with Redis and Supabase
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Medusa v2 Docker Setup Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed and running
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed" -ForegroundColor Red
    Write-Host "  Please install Node.js 20+ from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠ .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Keeping existing .env file" -ForegroundColor Green
        $createEnv = $false
    } else {
        $createEnv = $true
    }
} else {
    $createEnv = $true
}

if ($createEnv) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    # Generate secrets
    Write-Host "Generating secure secrets..." -ForegroundColor Yellow
    $jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    $cookieSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    
    # Prompt for required values
    Write-Host ""
    Write-Host "Please provide the following information:" -ForegroundColor Cyan
    Write-Host ""
    
    $databaseUrl = Read-Host "Supabase DATABASE_URL (postgresql://...)"
    if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
        Write-Host "✗ DATABASE_URL is required" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Enter your Vercel domain (or press Enter to skip):" -ForegroundColor Cyan
    $vercelDomain = Read-Host "Vercel domain (e.g., yourapp.vercel.app)"
    
    Write-Host ""
    Write-Host "Enter your Cloudflared tunnel URL (or press Enter to skip):" -ForegroundColor Cyan
    $tunnelUrl = Read-Host "Tunnel URL (e.g., https://xxx.trycloudflare.com)"
    
    # Build CORS strings
    $storeCors = "http://localhost:3000,http://localhost:8000"
    if (![string]::IsNullOrWhiteSpace($vercelDomain)) {
        $storeCors += ",https://$vercelDomain"
    }
    
    $adminCors = "http://localhost:9000,http://localhost:5173"
    if (![string]::IsNullOrWhiteSpace($tunnelUrl)) {
        $adminCors += ",$tunnelUrl"
    }
    
    # Create .env file
    $envContent = @"
# ============================================
# Medusa v2 Backend - Docker Environment
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Node Environment
NODE_ENV=development
BUILD_TARGET=development

# Database (Supabase)
DATABASE_URL=$databaseUrl
DB_NAME=postgres

# Redis (Docker)
REDIS_URL=redis://redis:6379

# CORS Configuration
STORE_CORS=$storeCors
ADMIN_CORS=$adminCors
AUTH_CORS=$adminCors

# Security Secrets (Auto-generated)
JWT_SECRET=$jwtSecret
COOKIE_SECRET=$cookieSecret

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
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ .env file created successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generated secrets:" -ForegroundColor Cyan
    Write-Host "  JWT_SECRET: $jwtSecret" -ForegroundColor Gray
    Write-Host "  COOKIE_SECRET: $cookieSecret" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Docker Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startServices = Read-Host "Do you want to start Docker services now? (Y/n)"
if ($startServices -eq "" -or $startServices -eq "y" -or $startServices -eq "Y") {
    Write-Host ""
    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
    Write-Host ""
    
    docker compose up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Services started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Service Status" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        docker compose ps
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Access Points" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Admin UI:     http://localhost:9000/app" -ForegroundColor Green
        Write-Host "Store API:    http://localhost:9000/store/*" -ForegroundColor Green
        Write-Host "Health Check: http://localhost:9000/health" -ForegroundColor Green
        Write-Host ""
        Write-Host "Default Admin Credentials:" -ForegroundColor Yellow
        Write-Host "  Email:    admin@medusa-test.com" -ForegroundColor Gray
        Write-Host "  Password: supersecret" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠ Remember to:" -ForegroundColor Yellow
        Write-Host "  1. Change admin password after first login" -ForegroundColor Gray
        Write-Host "  2. Create Publishable API Key in Admin UI" -ForegroundColor Gray
        Write-Host "  3. Add the key to .env as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" -ForegroundColor Gray
        Write-Host "  4. Restart services: docker compose restart medusa" -ForegroundColor Gray
        Write-Host ""
        
        $viewLogs = Read-Host "Do you want to view logs? (y/N)"
        if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
            Write-Host ""
            Write-Host "Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
            docker compose logs -f medusa
        }
    } else {
        Write-Host ""
        Write-Host "✗ Failed to start services" -ForegroundColor Red
        Write-Host "Check the error messages above" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Port 9000 already in use" -ForegroundColor Gray
        Write-Host "  - Invalid DATABASE_URL" -ForegroundColor Gray
        Write-Host "  - Docker out of memory" -ForegroundColor Gray
        Write-Host ""
        Write-Host "View logs with: docker compose logs medusa" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Skipping service start" -ForegroundColor Yellow
    Write-Host "To start services later, run: docker compose up -d --build" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Access Admin UI: http://localhost:9000/app" -ForegroundColor Gray
Write-Host "  2. Create Publishable API Key" -ForegroundColor Gray
Write-Host "  3. Update Vercel environment variables" -ForegroundColor Gray
Write-Host "  4. Test Store API with curl or Postman" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Full guide: DOCKER-SETUP.md" -ForegroundColor Gray
Write-Host "  - Quick ref:  DOCKER-QUICK-START.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  docker compose ps              # Check status" -ForegroundColor Gray
Write-Host "  docker compose logs -f medusa  # View logs" -ForegroundColor Gray
Write-Host "  docker compose restart medusa  # Restart backend" -ForegroundColor Gray
Write-Host "  docker compose down            # Stop all services" -ForegroundColor Gray
Write-Host ""
