# Tasks - January 21, 2026

## Priority Tasks

### 1. Add Video Link in Homepage About Us Section
**Location:** `sixthgear-frontend/src/modules/home/components/about/index.tsx`

**Requirements:**
- Add YouTube/Vimeo video embed or link
- Video should showcase Sixthgear workshop, café, and team
- Responsive video player
- Fallback thumbnail if video fails to load
- Consider autoplay on mute or click-to-play

**Acceptance Criteria:**
- [ ] Video embedded in About section
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading state handled
- [ ] Accessible (captions/transcript link)

---

### 2. Redesign Stats Part in Hero Section
**Location:** `sixthgear-frontend/src/modules/home/components/hero/index.tsx`

**Current Issue:**
- Stats component exists but not integrated in hero
- Need to redesign for better visual impact

**Requirements:**
- Move stats to hero section (below main hero content)
- Update design to match hero aesthetic
- Add animations/counters for numbers
- Make it more prominent and eye-catching
- Consider using actual metrics:
  - Years in business
  - Satisfied customers count
  - Services completed
  - Products available

**Acceptance Criteria:**
- [ ] Stats integrated in hero section
- [ ] Visually appealing design
- [ ] Animated counters (optional)
- [ ] Responsive layout
- [ ] Real data or placeholder numbers

---

### 3. Replace All Image Placeholders with Real Images
**Locations:**
- `sixthgear-frontend/src/modules/home/components/our-team/index.tsx`
- `sixthgear-frontend/src/modules/home/components/client-stories/index.tsx`
- `sixthgear-frontend/src/modules/home/components/our-services/index.tsx`
- `sixthgear-frontend/src/modules/home/components/hero/index.tsx`
- Other components using Unsplash/Dicebear placeholders

**Requirements:**
- Collect real photos from Sixthgear:
  - Team member photos (Martie, James, Marvin)
  - Workshop/garage photos
  - Motorcycle service photos
  - Café interior/exterior
  - Customer bikes
  - Products
- Optimize images for web (WebP format, proper sizing)
- Upload to Cloudflare R2
- Update all image URLs

**Acceptance Criteria:**
- [ ] All team photos replaced with real photos
- [ ] Service images are actual workshop photos
- [ ] Hero images showcase real Sixthgear location
- [ ] Images optimized (< 200KB each)
- [ ] Alt text updated for accessibility

---

### 4. Full Menu Page for First Gear Coffee
**Location:** Create new page at `sixthgear-frontend/src/app/[countryCode]/(main)/menu/page.tsx`

**Requirements:**
- Create dedicated coffee menu page
- Categories:
  - **Hot Coffee** (Espresso, Americano, Cappuccino, Latte, etc.)
  - **Iced Coffee** (Iced Latte, Cold Brew, Frappe, etc.)
  - **Non-Coffee** (Tea, Chocolate, Smoothies, etc.)
  - **Food/Snacks** (Pastries, Sandwiches, etc.)
- Each item should have:
  - Name
  - Description
  - Price (PHP)
  - Image (optional)
  - Size options (if applicable)
  - Customization options (sugar level, milk type, etc.)
- Beautiful, modern design matching brand
- Mobile-friendly menu layout
- Add link to menu in navigation

**Acceptance Criteria:**
- [ ] Menu page created and accessible
- [ ] All coffee drinks listed with prices
- [ ] Non-coffee options included
- [ ] Responsive design
- [ ] Images for popular items
- [ ] Link added to main navigation
- [ ] SEO metadata added

---

### 5. Add Functionality to Contact Us Page
**Location:** `sixthgear-frontend/src/app/[countryCode]/(main)/contact/page.tsx`

**Current State:** Page exists but no form functionality

**Requirements:**
- Create contact form with fields:
  - Name (required)
  - Email (required)
  - Phone (optional)
  - Subject/Inquiry Type (dropdown: General, Service Inquiry, Franchise, Parts, Café)
  - Message (required)
  - Preferred contact method (Email/Phone/SMS)
- Form validation
- Submit to backend API
- Email notification to Sixthgear team
- Success/error messages
- reCAPTCHA or spam protection
- Store inquiries in database

**Backend Requirements:**
- Create API endpoint: `sixthgear-backend/src/api/store/contact/route.ts`
- Create Contact model/entity
- Email integration (SendGrid/Resend)
- Admin notification

**Acceptance Criteria:**
- [ ] Contact form functional
- [ ] Form validation working
- [ ] Email sent to Sixthgear on submission
- [ ] Confirmation email sent to customer
- [ ] Inquiries stored in database
- [ ] Success message displayed
- [ ] Error handling implemented
- [ ] Spam protection added

---

### 6. Integrate CMS via Third-Party Provider
**Recommended Options:**
1. **Strapi** (Self-hosted, free, full control)
2. **Sanity.io** (Cloud, generous free tier, great DX)
3. **Contentful** (Enterprise-grade, free tier available)
4. **Payload CMS** (Modern, TypeScript-native)

**Recommended Choice: Sanity.io**
- Easy integration with Next.js
- Real-time preview
- Structured content
- Image optimization built-in
- Free tier: 3 users, unlimited API requests

**Content to Manage via CMS:**
- Homepage sections (Hero, About, Services)
- Blog posts / Rider Stories
- Team members
- Service offerings
- Café menu items
- Testimonials
- Marketing banners
- FAQ content
- Policy pages (Terms, Privacy, Shipping)

**Implementation Steps:**
1. Set up Sanity project
2. Define schemas for content types
3. Create Sanity Studio (admin interface)
4. Integrate Sanity client in Next.js
5. Migrate existing content to Sanity
6. Update components to fetch from Sanity
7. Set up preview mode
8. Deploy Sanity Studio

**Acceptance Criteria:**
- [ ] CMS provider selected and set up
- [ ] Content schemas defined
- [ ] Admin interface accessible
- [ ] Frontend fetching content from CMS
- [ ] Preview mode working
- [ ] Documentation for content editors
- [ ] At least 3 content types migrated (e.g., Team, Services, Stories)

---

## Additional Notes

### Image Collection Checklist
- [ ] Team photos (high-res, professional)
- [ ] Workshop/garage photos (5-10 images)
- [ ] Service process photos (diagnostics, repairs, etc.)
- [ ] Café interior (3-5 images)
- [ ] Café products (coffee, food)
- [ ] Customer motorcycles (with permission)
- [ ] Product photos (parts, accessories)
- [ ] Logo variations (light/dark backgrounds)

### CMS Content Structure (Sanity Example)
```
- Team Member
  - name
  - role
  - title
  - description
  - image
  - social links (facebook, instagram, tiktok)

- Service
  - title
  - description
  - image
  - icon
  - category

- Menu Item
  - name
  - description
  - price
  - category (hot coffee, iced coffee, non-coffee, food)
  - image
  - sizes
  - customizations

- Story/Blog Post
  - title
  - excerpt
  - content (rich text)
  - author
  - date
  - category
  - featured image

- Testimonial
  - customer name
  - content
  - rating
  - date
  - image (optional)
```

---

## Timeline Estimate

- **Task 1 (Video):** 2-3 hours
- **Task 2 (Stats redesign):** 3-4 hours
- **Task 3 (Replace images):** 4-6 hours (depends on image collection)
- **Task 4 (Menu page):** 6-8 hours
- **Task 5 (Contact form):** 8-10 hours (frontend + backend + email)
- **Task 6 (CMS integration):** 16-20 hours (setup + migration + testing)

**Total Estimated Time:** 39-51 hours (5-7 working days)

---

## Priority Order

1. **Replace images** (improves brand perception immediately)
2. **Contact form** (enables customer communication)
3. **Menu page** (showcases café offerings)
4. **Video in About** (enhances storytelling)
5. **Stats redesign** (improves hero impact)
6. **CMS integration** (long-term content management)
