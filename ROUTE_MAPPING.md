# SmartRider Route Mapping & Navigation System

## High-Fidelity UI Architecture

This document defines the complete route, button, and component navigation system across three distinct user layouts.

---

## 1. PUBLIC GUEST LAYOUT

### Primary Routes

**Route: `/` (Landing Page)**
- **Component**: `src/routes/index.tsx`
- **Purpose**: High-impact conversion funnel for new riders
- **Key Elements**:
  - Hero section with orange-to-deep-orange gradient
  - **"Get My Sticker"** gradient button (primary action)
    - Class: `bg-gradient-to-r from-primary to-secondary`
    - Routes to: `/signup`
  - **"How It Works"** outline button
    - Class: `variant="outline"`
    - Behavior: Scrolls to features section (anchor scroll)
  - Feature grid showcasing product benefits
  - Social proof section with rider testimonials
  - Premium pricing card with transparent CTA
  - Footer with links to support pages
- **Performance**: Optimized landing with image lazy-loading
- **Mobile**: Fully responsive with touch-optimized buttons

**Route: `/r/{id}` (Public Profile / QR Scan Result)**
- **Component**: `src/routes/r.$slug.tsx`
- **Purpose**: Ultra-fast rider profile displayed after QR scan
- **Load Target**: < 300ms on 3G networks
- **Glassmorphic Design**: 
  - Backdrop blur effects (glass morphism)
  - High contrast text (WCAG AAA)
  - Optimized for direct sunlight readability
- **Key Elements**:
  - Sticky header with verified badge
  - Large profile photo with orange gradient background
  - Rider name, vehicle type, plate number
  - Route and city info in compact cards
  - **Four Core High-Speed Scan Actions**:
    1. **"Copy M-Pesa"** Full-width primary button
       - Class: `bg-gradient-to-r from-primary to-secondary`
       - Instant clipboard copy with toast confirmation
       - Hottest action on page
    2. **"Open M-Pesa App"** green text link
       - Deep linking to M-Pesa app or fallback
       - Direct app trigger for seamless payment
    3. **"Save Contact"** orange full-width element
       - Generates .vcf file download
       - vCard includes: name, phone, vehicle, route
    4. **"Call Rider"** outline dialer trigger
       - `href="tel:{phone}"` native phone dialer
       - Secondary action for contact
  - Additional payment methods (till, paybill, bank)
  - Trust badges and verification indicators
  - CTA: "Get your QR sticker" → `/signup`

**Route: `/how-it-works` (Marketing Page)**
- **Component**: `src/routes/how-it-works.tsx`
- **Purpose**: Educational funnel explaining product
- **Key Sections**:
  - Step-by-step utility grid (3 steps)
  - Feature breakdown cards
  - FAQ accordion
  - CTA linking to signup

**Route: `/login` (Authentication)**
- **Component**: `src/routes/login.tsx`
- **Purpose**: Existing rider authentication
- **Flow**: Email/password → `/dashboard`

**Route: `/signup` (Registration)**
- **Component**: `src/routes/signup.tsx`
- **Purpose**: New rider onboarding entry point
- **Flow**: Email/password validation → `/onboarding/step-1`

---

## 2. RIDER PROTECTED LAYOUT

### Authentication & Onboarding Routes

**Route: `/onboarding/step-1` through `/onboarding/step-5`**
- **Purpose**: Multi-step wizard for new rider profile creation
- **Steps**:
  1. **Step 1**: Basic info (name, display name, phone)
  2. **Step 2**: Vehicle details (type, plate, route, city)
  3. **Step 3**: Profile photo upload & bio
  4. **Step 4**: Payment methods (M-Pesa, Till, Paybill, Bank)
  5. **Step 5**: Review & merch checkout
- **Key Buttons**:
  - "Next" → progresses to next step
  - "Confirm Payment" → modal for QR sticker order (KES 500)
  - "Complete" → redirects to `/dashboard`
- **Design**: Consistent orange/green accent system
- **Mobile**: Full-screen step components with progress indicator

### Protected Dashboard Routes

**Route: `/dashboard` (Rider Dashboard Home)**
- **Component**: `src/routes/dashboard.tsx`
- **Purpose**: Central hub for rider operations
- **Layout**:
  - Top header with profile picture & quick stats
  - Bottom navigation bar (sticky):
    - Home icon → `/dashboard`
    - Profile icon → `/dashboard/profile/edit`
    - Payment icon → `/dashboard/payments`
    - Orders icon → `/dashboard/orders`
    - QR icon → `/dashboard/qr`
  - Quick action cards:
    - **"Edit Profile"** button → `/dashboard/profile/edit`
    - **"Manage Payments"** button → `/dashboard/payments`
    - **"View Orders"** button → `/dashboard/orders`
    - **"Download QR"** button → `/dashboard/qr`
  - Recent activity feed
  - Performance metrics (earnings, scans, conversions)

**Route: `/dashboard/profile/edit` (Profile Editor)**
- **Component**: `src/routes/dashboard.profile.edit.tsx` (to create)
- **Purpose**: Update rider profile information
- **Form Fields**:
  - Display name, phone, vehicle details
  - Route and city
  - Photo upload (WebP compression)
  - Bio text
- **Actions**:
  - Save button → updates profile, shows toast
  - Cancel → back to `/dashboard`
- **Key Features**: Real-time photo preview, client-side validation

**Route: `/dashboard/payments` (Payment Configuration)**
- **Component**: `src/routes/dashboard.payments.tsx` (to create)
- **Purpose**: Manage payment methods
- **Sections**:
  - List of configured payment methods
  - **"Add Payment Method"** button
    - Modal form for each method type
  - Set primary payment (radio selection)
  - Edit/delete actions per method
- **Method Types**: M-Pesa, Till, Paybill, Bank Transfer

**Route: `/dashboard/orders` (Order Fulfillment)**
- **Component**: `src/routes/dashboard.orders.tsx` (to create)
- **Purpose**: Track merch orders and QR sticker status
- **Order States**:
  - Pending (awaiting payment)
  - Paid (confirmed)
  - Printed (in production)
  - Shipped (tracking available)
  - Delivered
- **UI**: Status card per order, tracking number display
- **Actions**: View details, download receipt

**Route: `/dashboard/qr` (QR Viewer & Download)**
- **Component**: `src/routes/dashboard.qr.tsx` (to create)
- **Purpose**: Display downloadable QR code asset
- **Features**:
  - Dynamic SVG QR code generation
  - Overlay QR onto white "Scan to pay tag" asset (PNG)
  - Download as PNG/SVG
  - Share URL button
  - Print-ready formatting (300 DPI)
- **Visual**: QR positioned on center-right of white rectangle

---

## 3. ADMIN OPERATIONAL LAYOUT

### Admin Authentication

**Route: `/admin` (Admin Home - Dark Mode)**
- **Component**: `src/routes/_admin/admin.index.tsx`
- **Purpose**: Analytical dashboard for platform operations
- **Dark Theme**: `#121212` background, high-contrast orange/green
- **Key Metrics**:
  - Total riders (KPI card)
  - Active profiles count
  - Orders pending/paid/shipped
  - Revenue (sum of paid orders)
  - Signup trends (7-day, 30-day charts)
  - Recent activity feed (last 10 orders/signups)
- **Layout**: Grid of metric cards, chart widgets
- **Navigation**: Sidebar with admin section links
  - Overview
  - Riders
  - Orders
  - Roles
  - Print Queue (new)

### Rider Management

**Route: `/admin/riders` (Rider Directory)**
- **Component**: `src/routes/_admin/admin.riders.tsx`
- **Purpose**: Tabular rider list with search/filter
- **Table Columns**: Name, Phone, Plate, Route, Status, Created
- **Search**: Real-time search by name/phone/plate/slug
- **Filter Dropdown**: Status (all, draft, active, pending_payment, suspended)
- **Pagination**: 50 per page
- **Row Actions**:
  - View → opens detail overlay
  - Edit → inline edit modal
  - Suspend/Activate → toggle status
  - Open QR → link to `/r/{slug}`
- **Bulk Actions**: Mark multiple as active, export CSV

**Route: `/admin/riders/$id` (Rider Detail & Edit)**
- **Component**: `src/routes/_admin/admin.riders.$id.tsx`
- **Purpose**: Deep-dive rider profile management
- **Tabs**:
  - **Profile**: Edit all rider info fields
  - **Payments**: Add/remove/set primary payment methods
  - **Orders**: List of merch orders for this rider
  - **QR**: Display & regenerate QR slug
  - **Danger Zone**: Suspend/delete rider
- **Key Actions**:
  - Save changes → updates DB, shows confirmation
  - Regenerate QR → creates new UUID, invalidates old
  - Export vCard → rider contact file
  - View public page → link to `/r/{slug}`

### Order Logistics

**Route: `/admin/orders` (Order Dashboard)**
- **Component**: `src/routes/_admin/admin.orders.tsx`
- **Purpose**: Order fulfillment state tracker
- **Layout Options**:
  - Kanban-style: columns for Pending → Paid → Printed → Shipped → Delivered
  - Table view: sortable by date, status, rider
- **Card/Row Data**:
  - Rider name (clickable → rider detail)
  - Order amount (KES)
  - Status with progress indicator
  - Dates: created, paid_at, printed_at, shipped_at
  - Actions: View details, change status
- **Bulk Actions**:
  - Mark selected as printed
  - Mark selected as shipped
  - Generate shipping labels
  - Export order list (CSV)
- **Modals**:
  - **Confirm Payment**: Sets status="paid", paid_at=now(), confirms profile activation
    - Confirmation modal with rider name
    - Button: "Confirm Payment" (primary action)
  - **Add Tracking**: Input tracking note/number
    - Auto-transitions to shipped state
  - **Print Label**: Pre-fills shipping info

**Route: `/admin/print-queue` (Print-Ready Export Pipeline)**
- **Component**: `src/routes/_admin/admin.print-queue.tsx` (new)
- **Purpose**: Batch export custom vector stickers to print sheets
- **Features**:
  - Filter orders: by date range, status (ready for print)
  - Preview: Grid of sticker thumbnails (6-8 per page layout)
  - Batch select: Checkboxes for each order
  - Export formats:
    - **PDF**: Print-ready, 4x6 labels per page
    - **SVG**: Vector-editable, individual files
    - **ZIP**: All selected as batch download
  - DPI selector: 300 DPI (print standard)
  - Preset layouts: 1x1, 2x2, 4x6 grid
- **Workflow**:
  1. Select orders ready to print
  2. Choose export format & layout
  3. Click "Generate Print Sheet"
  4. Download PDF/ZIP
  5. Send to printer
- **Visual**: QR code + rider name + plate on each sticker label

---

## Navigation Cross-Links

### Public Guest Layout Navigation

```
/ (Landing)
├─ [Get My Sticker] → /signup
├─ [How It Works] → /how-it-works (anchor scroll)
├─ [Learn More] → /how-it-works
└─ /r/{id} (QR scan result)
    ├─ [Copy M-Pesa] → clipboard action
    ├─ [Open M-Pesa App] → deep link
    ├─ [Save Contact] → vCard download
    ├─ [Call Rider] → tel: dialer
    ├─ [Get your QR sticker] → /signup
    └─ [Support] → /contact
```

### Rider Protected Layout Navigation

```
/login → /signup → /onboarding/step-1
/onboarding/step-1 → step-2 → step-3 → step-4 → step-5
/onboarding/step-5 → /dashboard (on successful payment)

/dashboard (Home)
├─ [Edit Profile] → /dashboard/profile/edit → [Save] → /dashboard
├─ [Manage Payments] → /dashboard/payments
│  └─ [Add Method] → form modal → [Save] → /dashboard/payments
├─ [View Orders] → /dashboard/orders
│  └─ [Order Details] → modal view
├─ [Download QR] → /dashboard/qr
│  └─ [Download PNG] → file download
│  └─ [Share] → copy URL to clipboard
└─ Bottom nav: home|profile|payments|orders|qr
```

### Admin Operational Layout Navigation

```
/admin (Dark mode home)
├─ Sidebar:
│  ├─ Overview → /admin
│  ├─ Riders → /admin/riders
│  │  └─ [Rider Row] → /admin/riders/$id
│  │     ├─ Tabs: Profile | Payments | Orders | QR | Danger Zone
│  │     └─ [Save] → update & confirmation
│  ├─ Orders → /admin/orders
│  │  ├─ Kanban: Pending, Paid, Printed, Shipped, Delivered
│  │  └─ [Confirm Payment] → modal → [Confirm] → update DB
│  ├─ Roles → /admin/roles
│  │  └─ [Grant Role] → modal form
│  └─ Print Queue → /admin/print-queue
│     ├─ [Filter] → date, status
│     ├─ [Select Orders] → checkbox multi-select
│     └─ [Generate Print Sheet] → PDF/SVG download
```

---

## Design Token Enforcement

### Colors
- **Primary Orange**: `#F37021` (oklch equivalent)
- **Deep Orange**: `#E35205` for secondary/gradients
- **Olive Green**: `#A4C639` for success/accent highlights
- **Background**: Clean white (#FFFFFF, never dark yellow)
- **Dark Mode (Admin)**: `#121212` with orange/green accents

### Typography
- **Headings**: Black font weight (900)
- **Body**: 16px base, line-height 150%
- **High Contrast**: WCAG AAA compliant on all backgrounds

### Glassmorphism (Mobile Sunlight Optimization)
- Backdrop blur: `backdrop-blur-xl`
- Background opacity: `bg-white/60` to `bg-white/80` (light)
- Border: `border-white/60` with subtle definition
- Shadow: Drop shadow for depth on flat surfaces
- Purpose: Maintain readability in direct sunlight on low-bandwidth mobile

### Spacing System
- 8px grid system (8, 16, 24, 32, 40, etc.)
- Consistent padding/margin across all components

---

## Performance Targets

- **Landing Page**: < 2s load time
- **Public QR Profile (`/r/{id}`)**: < 300ms load time (edge cached)
- **Dashboard**: < 1s initial load
- **Admin Metrics**: < 1.5s with real-time updates
- **Image Optimization**: WebP transformation, lazy-loading
- **Compression**: Gzip, minification, code-splitting

---

## State Management

- **Auth State**: Supabase session with RLS
- **Admin Role**: Checked via `has_role()` function
- **Navigation Context**: Route-aware bottom nav on dashboard
- **Form State**: React Hook Form with Zod validation
- **Toast Notifications**: Sonner for real-time feedback

---

## Database Schema Reflection

```sql
-- Riders & Profiles
profiles (id, display_name, phone, vehicle_type, plate_number, route, city, photo_url, bio, status, qr_slug)

-- Payments
payment_methods (id, profile_id, method_type, account_number, paybill_number, is_primary)

-- Orders
merch_orders (id, profile_id, amount_kes, status, paid_at, printed_at, shipped_at, tracking_note, confirmed_by)

-- Admin
user_roles (id, user_id, role, created_at)
```

All routes and components are RLS-protected and strictly validate user access per role.
