# Sixthgear Backend - Medusa E-Commerce Platform

> **Professional motorcycle service center, parts supply, and café e-commerce backend**

This is the backend API for Sixthgear Moto Supply & Café, built on Medusa v2.12.4 - a modern, composable e-commerce platform.

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 About

Sixthgear Backend provides the complete e-commerce infrastructure for:

- **Motorcycle Parts & Accessories** - Online catalog and inventory management
- **Service Booking** - Appointment scheduling for motorcycle maintenance
- **Café Products** - First Gear Coffee menu and ordering
- **User Management** - Customer accounts, authentication, and profiles
- **Order Processing** - Cart, checkout, payment, and fulfillment
- **Marketing Content** - Dynamic banners, popups, and announcements

---

## ✨ Features

### Core E-Commerce
- ✅ Product catalog with variants and inventory
- ✅ Shopping cart and checkout flow
- ✅ Order management and tracking
- ✅ Customer authentication and accounts
- ✅ Multi-region support (Philippines primary)
- ✅ Payment processing (Stripe + local methods)
- ✅ Shipping and fulfillment

### Custom Features
- ✅ **Marketing Module** - Admin-managed banners, popups, and strips
- ✅ **Cloudflare R2 Integration** - S3-compatible file storage
- ✅ **Preview System** - Draft content preview with tokens
- ✅ **Multi-device Targeting** - Mobile/desktop specific content

### Admin Features
- ✅ Product management
- ✅ Order management
- ✅ Customer management
- ✅ Marketing content management
- ✅ Inventory tracking
- ✅ Sales analytics

---

## 🛠️ Tech Stack

- **Framework:** Medusa v2.12.4 (Node.js)
- **Database:** PostgreSQL (Supabase)
- **Cache/Queue:** Redis 7
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Language:** TypeScript
- **Package Manager:** npm/pnpm

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v20 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js) or **pnpm**
   - Verify installation: `npm --version`
   - Or install pnpm: `npm install -g pnpm`

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### Required Services

1. **PostgreSQL Database**
   - Option A: Use Supabase (recommended) - https://supabase.com
   - Option B: Install locally - https://www.postgresql.org/download/

2. **Redis** (optional but recommended)
   - Option A: Use Docker: `docker run -d -p 6379:6379 redis:7-alpine`
   - Option B: Install locally - https://redis.io/download

3. **Cloudflare R2 Account** (for file storage)
   - Sign up at: https://cloudflare.com
   - Create R2 bucket and get API credentials

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
# Clone the main project
git clone https://github.com/JomariTheAnalyst/sixthgear-backend.git

# Navigate to backend directory
cd sixthgear/sixthgear-backend
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (faster)
pnpm install
```

This will install all required packages including:
- @medusajs/framework
- @medusajs/medusa
- @aws-sdk/client-s3 (for R2 storage)
- And all other dependencies

---

## ⚙️ Configuration

### Step 1: Set Up Environment Variables

1. **Copy the template file:**

```bash
# Windows
copy .env.template .env

# Mac/Linux
cp .env.template .env
```

2. **Edit the `.env` file with your configuration:**

```env
# CORS Configuration
# Add your frontend URL here
STORE_CORS=http://localhost:8000,https://yourdomain.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:5173,http://localhost:9000

# Redis Configuration
# If using Docker: redis://localhost:6379
# If using cloud Redis: redis://username:password@host:port
REDIS_URL=redis://localhost:6379

# Security Secrets
# IMPORTANT: Change these in production!
# Generate secure secrets: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this
COOKIE_SECRET=your-super-secret-cookie-key-change-this

# Database Configuration
# Get this from Supabase or your PostgreSQL provider
DATABASE_URL=postgresql://username:password@host:port/database
DB_NAME=medusa-v2

# Cloudflare R2 Storage Configuration
# Get these from Cloudflare Dashboard > R2 > Manage R2 API Tokens
S3_ACCESS_KEY_ID=your-r2-access-key-id
S3_SECRET_ACCESS_KEY=your-r2-secret-access-key
S3_REGION=auto
S3_BUCKET=your-bucket-name
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_FILE_URL=https://your-cdn-domain.com
```

### Step 2: Database Setup

#### Option A: Using Supabase (Recommended)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy the "Connection string" (URI format)
5. Paste it as `DATABASE_URL` in your `.env` file

#### Option B: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
```sql
CREATE DATABASE medusa_v2;
```
3. Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/medusa_v2
```

### Step 3: Redis Setup (Optional)

#### Option A: Using Docker (Easiest)

```bash
# Start Redis container
docker-compose up -d redis

# Or manually
docker run -d -p 6379:6379 --name sixthgear-redis redis:7-alpine
```

#### Option B: Local Installation

1. Download and install Redis from https://redis.io/download
2. Start Redis server: `redis-server`
3. Verify it's running: `redis-cli ping` (should return "PONG")

### Step 4: Cloudflare R2 Setup

1. **Create Cloudflare Account:**
   - Go to https://cloudflare.com
   - Sign up for a free account

2. **Create R2 Bucket:**
   - Go to R2 in Cloudflare dashboard
   - Click "Create bucket"
   - Name it (e.g., `sixthgear-assets`)
   - Note the bucket name

3. **Generate API Tokens:**
   - Go to R2 > Manage R2 API Tokens
   - Click "Create API token"
   - Give it a name (e.g., "Sixthgear Backend")
   - Set permissions: "Object Read & Write"
   - Copy the Access Key ID and Secret Access Key
   - Copy the endpoint URL

4. **Configure Public Access (Optional):**
   - Go to your bucket settings
   - Enable public access if you want direct file URLs
   - Or set up a custom domain for CDN

5. **Update `.env` file:**
```env
S3_ACCESS_KEY_ID=your-access-key-id-here
S3_SECRET_ACCESS_KEY=your-secret-access-key-here
S3_BUCKET=sixthgear-assets
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_FILE_URL=https://cdn.yourdomain.com
```

---

## 🏃 Running the Project

### Step 1: Run Database Migrations

```bash
# This creates all necessary database tables
npm run db:migrate

# Or with pnpm
pnpm db:migrate
```

### Step 2: Seed Initial Data (Optional)

```bash
# This adds sample products, categories, and regions
npm run seed

# Or with pnpm
pnpm seed
```

### Step 3: Start the Development Server

```bash
# Start in development mode
npm run dev

# Or with pnpm
pnpm dev
```

The server will start on **http://localhost:9000**

You should see:
```
✓ Server is ready on http://localhost:9000
✓ Admin dashboard: http://localhost:9000/app
```

### Step 4: Access the Admin Dashboard

1. Open your browser and go to: **http://localhost:9000/app**
2. Create your admin account:
   - Email: admin@sixthgear.ph
   - Password: (choose a secure password)
3. Log in and start managing your store!

### Step 5: Create a Publishable API Key

1. In the admin dashboard, go to **Settings > Publishable API Keys**
2. Click "Create API Key"
3. Give it a name (e.g., "Storefront")
4. Select the sales channel
5. Copy the generated key (starts with `pk_`)
6. Save this key - you'll need it for the frontend!

---

## 📁 Project Structure

```
sixthgear-backend/
├── src/
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin API endpoints
│   │   │   └── marketing/     # Marketing content management
│   │   └── store/             # Storefront API endpoints
│   │       └── marketing/     # Public marketing content
│   ├── modules/               # Custom modules
│   │   └── marketing/         # Marketing module
│   │       ├── models/        # Database models
│   │       ├── services/      # Business logic
│   │       └── index.ts       # Module definition
│   ├── scripts/               # Utility scripts
│   │   └── seed.ts           # Database seeding
│   └── workflows/             # Custom workflows (future)
├── .env                       # Environment variables (create from template)
├── .env.template             # Environment template
├── medusa-config.ts          # Medusa configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

---

## 📚 API Documentation

### Base URL
- Development: `http://localhost:9000`
- Production: `https://api.yourdomain.com`

### Admin API Endpoints

**Authentication:**
```
POST /admin/auth/token
POST /admin/auth/session
DELETE /admin/auth/session
```

**Products:**
```
GET    /admin/products
POST   /admin/products
GET    /admin/products/:id
PUT    /admin/products/:id
DELETE /admin/products/:id
```

**Orders:**
```
GET    /admin/orders
GET    /admin/orders/:id
PUT    /admin/orders/:id
```

**Marketing (Custom):**
```
GET    /admin/marketing              # List all marketing items
POST   /admin/marketing              # Create marketing item
GET    /admin/marketing/:id          # Get marketing item
PUT    /admin/marketing/:id          # Update marketing item
DELETE /admin/marketing/:id          # Delete marketing item
POST   /admin/marketing/:id/preview-token  # Generate preview token
```

### Store API Endpoints

**Products:**
```
GET /store/products
GET /store/products/:id
```

**Cart:**
```
POST   /store/carts
GET    /store/carts/:id
POST   /store/carts/:id/line-items
PUT    /store/carts/:id/line-items/:line_id
DELETE /store/carts/:id/line-items/:line_id
```

**Checkout:**
```
POST /store/carts/:id/complete
```

**Marketing (Custom):**
```
GET /store/marketing?path=/&device=desktop
```

### Full API Documentation

For complete API documentation, visit:
- Admin API: http://localhost:9000/docs/admin
- Store API: http://localhost:9000/docs/store

---

## 🚀 Deployment

### Recommended Platforms

1. **Railway** (Easiest)
   - Go to https://railway.app
   - Connect your GitHub repository
   - Add PostgreSQL and Redis databases
   - Set environment variables
   - Deploy!

2. **Render**
   - Go to https://render.com
   - Create PostgreSQL and Redis instances
   - Create Web Service from GitHub
   - Set environment variables
   - Deploy!

3. **DigitalOcean App Platform**
   - Go to https://digitalocean.com
   - Create managed databases
   - Deploy from GitHub
   - Configure environment variables

### Deployment Checklist

- [ ] Set up production database (PostgreSQL)
- [ ] Set up production Redis
- [ ] Configure Cloudflare R2
- [ ] Update CORS settings for production domain
- [ ] Generate secure JWT_SECRET and COOKIE_SECRET
- [ ] Set up email service (SendGrid/Resend)
- [ ] Configure payment gateway (Stripe/Paymongo)
- [ ] Run database migrations
- [ ] Seed initial data (regions, admin user)
- [ ] Test all API endpoints
- [ ] Set up monitoring and logging
- [ ] Configure backups

### Environment Variables for Production

```env
# Production URLs
STORE_CORS=https://yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
AUTH_CORS=https://yourdomain.com

# Secure secrets (generate new ones!)
JWT_SECRET=<generate-secure-secret>
COOKIE_SECRET=<generate-secure-secret>

# Production database
DATABASE_URL=<production-database-url>

# Production Redis
REDIS_URL=<production-redis-url>

# Cloudflare R2
S3_ACCESS_KEY_ID=<your-key>
S3_SECRET_ACCESS_KEY=<your-secret>
S3_BUCKET=<your-bucket>
S3_ENDPOINT=<your-endpoint>
S3_FILE_URL=https://cdn.yourdomain.com
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"

**Solution:**
- Check if PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Test connection: `psql <DATABASE_URL>`
- Check firewall settings

#### 2. "Redis connection failed"

**Solution:**
- Check if Redis is running: `redis-cli ping`
- Verify `REDIS_URL` in `.env`
- If using Docker: `docker ps` to check container status
- Try restarting Redis: `docker restart sixthgear-redis`

#### 3. "File upload failed"

**Solution:**
- Verify Cloudflare R2 credentials in `.env`
- Check bucket permissions
- Test R2 connection with AWS CLI
- Ensure `S3_ENDPOINT` is correct

#### 4. "Port 9000 already in use"

**Solution:**
- Check what's using the port: `netstat -ano | findstr :9000` (Windows)
- Kill the process or change port in `medusa-config.ts`
- Or use a different port: `npm run dev -- --port 9001`

#### 5. "Module not found" errors

**Solution:**
- Delete `node_modules` and reinstall:
```bash
rm -rf node_modules
npm install
```

#### 6. "Migration failed"

**Solution:**
- Check database connection
- Ensure database is empty or run: `npm run db:reset`
- Check for syntax errors in migration files

### Getting Help

- **Medusa Documentation:** https://docs.medusajs.com
- **Medusa Discord:** https://discord.gg/medusajs
- **GitHub Issues:** https://github.com/medusajs/medusa/issues
- **Sixthgear Support:** info@sixthgear.ph

---

## 📝 Scripts Reference

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database (WARNING: deletes all data)
npm run seed             # Seed initial data

# Testing
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.  
© 2026 Sixthgear Moto Supply & Café. All rights reserved.

---

## 📞 Support

- **Email:** info@sixthgear.ph
- **Phone:** 0995 093 0157
- **Address:** 3610 Bautista St, Makati City, Metro Manila
- **Website:** https://sixthgearmoto.com

---

**Happy Coding! 🏍️☕**
