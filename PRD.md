# Product Requirements Document (PRD)
# Sixthgear Moto Supply & Café E-Commerce Platform

**Version:** 1.0  
**Last Updated:** January 21, 2026  
**Project Status:** 70% Complete - Pre-Production  
**Target Launch:** Q1 2026

---

## 📋 Executive Summary

Sixthgear is a comprehensive e-commerce platform for a motorcycle service center, parts supply, and café business based in Makati City, Philippines. The platform combines professional motorcycle maintenance services, premium parts and accessories, riding gear, and a café experience powered by First Gear Coffee.

### Vision
To become the premier digital destination for motorcycle enthusiasts in the Philippines, offering seamless online shopping, service booking, and community engagement.

### Mission
Provide riders with a professional, user-friendly platform to purchase motorcycle parts, book services, order café products, and connect with the riding community.

---

## 🎯 Product Overview

### What is Sixthgear?

Sixthgear is a full-stack e-commerce platform consisting of:

1. **E-Commerce Store** - Online shop for motorcycle parts, accessories, riding gear, and café products
2. **Service Booking System** - Online appointment scheduling for motorcycle maintenance and repairs
3. **Café Menu & Ordering** - Digital menu and ordering system for First Gear Coffee
4. **Community Hub** - Platform for rider stories, testimonials, and community engagement
5. **Franchise Portal** - Information and application system for franchise opportunities

### Target Audience

**Primary Users:**
- Motorcycle owners and riders in Metro Manila
- Motorcycle enthusiasts seeking quality parts and service
- Coffee lovers and café customers
- Potential franchise partners

**User Personas:**

1. **The Daily Commuter (Mark, 28)**
   - Rides a Honda Click 150i for daily commute
   - Needs regular PMS and affordable parts
   - Values convenience and quick service

2. **The Weekend Warrior (Sarah, 35)**
   - Owns a Kawasaki Ninja 400
   - Seeks performance upgrades and premium gear
   - Active in riding community

3. **The Adventure Rider (Carlos, 42)**
   - Rides a BMW GS 850
   - Needs specialized service and touring accessories
   - Appreciates quality coffee and rider lounge

4. **The Café Regular (Ana, 26)**
   - Not a rider but loves the café atmosphere
   - Enjoys specialty coffee and community vibe
   - Potential motorcycle enthusiast

---

## 🏗️ System Architecture

### Technology Stack

**Backend:**
- **Framework:** Medusa v2.12.4 (Node.js e-commerce platform)
- **Database:** PostgreSQL (Supabase)
- **Cache/Queue:** Redis
- **File Storage:** Cloudflare R2 (S3-compatible)
- **API:** RESTful API with Medusa SDK

**Frontend:**
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS 3
- **State Management:** React Server Components
- **Data Fetching:** Medusa JS SDK
- **Deployment:** Vercel (recommended)

**Infrastructure:**
- **Database:** Supabase PostgreSQL
- **File Storage:** Cloudflare R2
- **CDN:** Cloudflare
- **Email:** SendGrid/Resend (to be configured)
- **Payments:** Stripe + Paymongo (to be configured)

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     SIXTHGEAR PLATFORM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Frontend   │◄────────┤   Backend    │                  │
│  │  (Next.js)   │  API    │   (Medusa)   │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                        │                            │
│         │                        ├──► PostgreSQL (Supabase)  │
│         │                        ├──► Redis (Cache/Queue)    │
│         │                        ├──► Cloudflare R2 (Files)  │
│         │                        └──► Email Service          │
│         │                                                     │
│         └──► CDN (Cloudflare)                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Core Features

### 1. E-Commerce Functionality

**Product Management:**
- Product catalog with categories (Parts, Accessories, Gear, Café)
- Product variants (size, color, specifications)
- Inventory tracking
- Product images and descriptions
- Price management with sale prices
- Product collections (Hot Deals, Best Sellers, New Arrivals)

**Shopping Experience:**
- Product search and filtering
- Product detail pages with specifications
- Add to cart functionality
- Wishlist (planned)
- Product reviews and ratings (planned)
- Recently viewed products (planned)

**Checkout Process:**
- Guest and registered checkout
- Address management
- Shipping method selection
- Payment processing (Stripe + local methods)
- Order confirmation
- Email notifications

**User Account:**
- User registration and login
- Profile management
- Order history
- Address book
- Password reset
- Account settings

### 2. Service Booking System (Planned)

**Features:**
- Service catalog (PMS, Repairs, Diagnostics, etc.)
- Calendar-based booking
- Time slot selection
- Service history tracking
- Appointment reminders
- Workshop capacity management

**Service Types:**
- Preventive Maintenance Service (PMS)
- Oil Change & Fluid Replacement
- Brake System Repair
- Electrical Diagnostics
- Tyre Replacement
- Chain & Sprocket Replacement
- Accessory Installation
- Performance Upgrades

### 3. Café Integration

**Current:**
- Café showcase section on homepage
- Coffee product listings

**Planned:**
- Full digital menu (Hot Coffee, Iced Coffee, Non-Coffee, Food)
- Online ordering system
- Table reservation
- Loyalty program
- Special offers and promotions

**Menu Categories:**
- Hot Coffee (Espresso, Americano, Cappuccino, Latte)
- Iced Coffee (Iced Latte, Cold Brew, Frappe)
- Non-Coffee (Tea, Chocolate, Smoothies)
- Food & Snacks (Pastries, Sandwiches)

### 4. Marketing & Content

**Marketing Module:**
- Admin-managed announcement strips
- Dynamic banners with placement control
- Popup ads with frequency control
- Schedule-based display (start/end dates)
- Device targeting (mobile/desktop)
- Page-specific targeting
- Preview mode for draft content

**Content Sections:**
- Hero section with call-to-action
- About Us with video
- Services showcase
- Featured products
- Customer testimonials
- Rider stories and blog
- Team member profiles
- Franchise information
- Store location and hours

### 5. Community Features

**Current:**
- Customer testimonials
- Satisfied customers showcase (Polaroid carousel)
- Rider stories section
- Team member profiles

**Planned:**
- User-generated content
- Ride reports and reviews
- Community forum
- Event calendar
- Rider meetups

### 6. Franchise Portal (Partial)

**Current:**
- Franchise information section
- Visual showcase

**Planned:**
- Franchise application form
- Requirements and investment calculator
- Inquiry management system
- Franchise dashboard
- Document upload system
- Application tracking

---

## 🔧 Technical Requirements

### Backend Requirements

**Minimum Server Specifications:**
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- 2GB RAM minimum
- 20GB storage

**Environment Variables:**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
COOKIE_SECRET=...
STORE_CORS=...
ADMIN_CORS=...
AUTH_CORS=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_ENDPOINT=...
S3_FILE_URL=...
```

### Frontend Requirements

**Minimum Specifications:**
- Node.js 20+
- 1GB RAM minimum
- 10GB storage

**Environment Variables:**
```
MEDUSA_BACKEND_URL=...
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=...
NEXT_PUBLIC_DEFAULT_REGION=ph
```

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📊 User Flows

### 1. Product Purchase Flow

```
1. User lands on homepage
2. Browse products or search
3. View product details
4. Add to cart
5. Continue shopping or proceed to checkout
6. Enter/select shipping address
7. Choose shipping method
8. Select payment method
9. Review order
10. Complete payment
11. Receive order confirmation (email)
12. Track order status
```

### 2. Service Booking Flow (Planned)

```
1. User navigates to Services page
2. Browse available services
3. Select service type
4. Choose date and time slot
5. Enter motorcycle details
6. Provide contact information
7. Review booking details
8. Confirm appointment
9. Receive confirmation (email/SMS)
10. Receive reminder before appointment
```

### 3. Café Order Flow (Planned)

```
1. User navigates to Menu page
2. Browse menu categories
3. Select items and customize
4. Add to cart
5. Choose pickup or dine-in
6. Select pickup time (if applicable)
7. Proceed to payment
8. Complete order
9. Receive order confirmation
10. Pickup order or wait for table service
```

---

## 🎨 Design Requirements

### Brand Identity

**Colors:**
- Primary: `#fca311` (Orange/Yellow)
- Secondary: `#0A0A0A` (Dark Black)
- Accent: `#F16D34` (Orange)
- Background: `#FFFFFF` (White), `#F9FAFB` (Light Gray)

**Typography:**
- Headings: Tanker (Display font)
- Body: Inter Display (Sans-serif)

**Design Principles:**
- Modern and professional
- Motorcycle culture aesthetic
- Clean and minimal
- Mobile-first responsive design
- High-quality imagery
- Smooth animations and transitions

### UI Components

**Reusable Components:**
- Navigation bar with mega menu
- Product cards
- Service cards
- Testimonial cards
- Team member cards
- Banner/hero sections
- Forms (contact, booking, checkout)
- Modals and popups
- Loading skeletons
- Error states

---

## 🔐 Security Requirements

### Authentication & Authorization

- Secure user authentication (JWT tokens)
- Password hashing (bcrypt)
- Session management
- Role-based access control (Customer, Admin)
- Password reset functionality
- Email verification (planned)

### Data Protection

- HTTPS/SSL encryption
- Secure payment processing (PCI DSS compliant)
- Data encryption at rest
- Regular security audits
- GDPR/Privacy compliance
- Secure file uploads

### API Security

- Rate limiting
- CORS configuration
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

---

## 📈 Performance Requirements

### Speed & Optimization

**Target Metrics:**
- Page load time: < 3 seconds
- Time to Interactive (TTI): < 5 seconds
- First Contentful Paint (FCP): < 1.5 seconds
- Largest Contentful Paint (LCP): < 2.5 seconds

**Optimization Strategies:**
- Image optimization (WebP format, lazy loading)
- Code splitting and lazy loading
- Server-side rendering (SSR)
- Incremental Static Regeneration (ISR)
- CDN for static assets
- Database query optimization
- Redis caching

### Scalability

**Expected Load:**
- 1,000 concurrent users
- 10,000 daily active users
- 100,000 monthly page views
- 1,000 orders per month

**Scaling Strategy:**
- Horizontal scaling for backend
- CDN for frontend assets
- Database read replicas
- Redis cluster for caching
- Load balancing

---

## 🧪 Testing Requirements

### Testing Strategy

**Unit Testing:**
- Backend API endpoints
- Frontend components
- Utility functions
- Data transformations

**Integration Testing:**
- Checkout flow
- Payment processing
- Email notifications
- File uploads

**End-to-End Testing:**
- Complete user journeys
- Cross-browser testing
- Mobile responsiveness
- Performance testing

**User Acceptance Testing (UAT):**
- Beta testing with select users
- Feedback collection
- Bug reporting and fixing

---

## 📱 Mobile Requirements

### Responsive Design

- Mobile-first approach
- Touch-friendly interface
- Optimized images for mobile
- Fast loading on 3G/4G networks
- Progressive Web App (PWA) features (planned)

### Mobile Features

- Mobile-optimized checkout
- Touch gestures (swipe, pinch-to-zoom)
- Mobile navigation menu
- Click-to-call functionality
- Location services integration

---

## 🚀 Deployment & DevOps

### Deployment Strategy

**Backend Deployment:**
- Platform: Railway, Render, or DigitalOcean
- Database: Supabase (managed PostgreSQL)
- Redis: Railway Redis or Upstash
- File Storage: Cloudflare R2

**Frontend Deployment:**
- Platform: Vercel (recommended)
- CDN: Cloudflare
- Domain: sixthgearmoto.com

### CI/CD Pipeline

- Automated testing on pull requests
- Automated deployment on merge to main
- Environment-specific deployments (dev, staging, production)
- Rollback capability

### Monitoring & Logging

- Application performance monitoring (APM)
- Error tracking (Sentry)
- Analytics (Google Analytics, Mixpanel)
- Uptime monitoring
- Log aggregation

---

## 📊 Success Metrics (KPIs)

### Business Metrics

- Monthly Revenue
- Average Order Value (AOV)
- Conversion Rate
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (CLV)
- Return on Ad Spend (ROAS)

### Product Metrics

- Daily/Monthly Active Users (DAU/MAU)
- Session Duration
- Bounce Rate
- Cart Abandonment Rate
- Checkout Completion Rate
- Product Page Views

### Technical Metrics

- Page Load Time
- API Response Time
- Error Rate
- Uptime (99.9% target)
- Database Query Performance

---

## 🗓️ Roadmap

### Phase 1: MVP Launch (Current - Week 4)
- ✅ Core e-commerce functionality
- ✅ Product catalog and shopping cart
- ✅ User authentication and accounts
- ⚠️ Payment integration (in progress)
- ⚠️ Email notifications (in progress)
- ⚠️ Essential pages (in progress)

### Phase 2: Service & Café (Week 5-8)
- Service booking system
- Full café menu page
- Online ordering
- Product reviews and ratings
- Enhanced product features

### Phase 3: Community & Growth (Week 9-12)
- Franchise application system
- Loyalty program
- Advanced search and filters
- Live chat support
- Mobile app (PWA)

### Phase 4: Optimization & Scale (Week 13+)
- Multi-location support
- Advanced analytics
- Marketing automation
- API for third-party integrations
- International expansion

---

## 🎯 Success Criteria

### Launch Readiness Checklist

**Must Have (Blocking Launch):**
- [ ] Payment processing working
- [ ] Email notifications active
- [ ] All policy pages complete
- [ ] Shipping integration functional
- [ ] Mobile-responsive design
- [ ] Security audit passed
- [ ] Performance optimization complete

**Should Have (Launch with limitations):**
- [ ] Service booking system
- [ ] Product reviews
- [ ] Café menu page
- [ ] Franchise application form
- [ ] FAQ page
- [ ] Track order page

**Nice to Have (Post-launch):**
- [ ] Loyalty program
- [ ] Advanced search
- [ ] Live chat
- [ ] Multi-location inventory
- [ ] Analytics dashboard

---

## 📞 Support & Maintenance

### Support Channels

- Email: info@sixthgear.ph
- Phone: 0995 093 0157
- Facebook: facebook.com/camille.sixthgear
- Instagram: @sixthgear_moto_supply
- TikTok: @sixthgear.moto.su

### Maintenance Schedule

- Regular updates: Weekly
- Security patches: As needed
- Feature releases: Monthly
- Database backups: Daily
- System monitoring: 24/7

---

## 📝 Appendix

### Glossary

- **PMS:** Preventive Maintenance Service
- **SKU:** Stock Keeping Unit
- **AOV:** Average Order Value
- **CAC:** Customer Acquisition Cost
- **CLV:** Customer Lifetime Value
- **ISR:** Incremental Static Regeneration
- **SSR:** Server-Side Rendering
- **PWA:** Progressive Web App

### References

- Medusa Documentation: https://docs.medusajs.com
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com
- Cloudflare R2: https://developers.cloudflare.com/r2

---

**Document Owner:** Sixthgear Development Team  
**Last Review:** January 21, 2026  
**Next Review:** February 21, 2026
