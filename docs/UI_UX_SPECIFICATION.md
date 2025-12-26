# SmartStay - UI/UX Design Specification

## Design Philosophy

### Core Principles
1. **Mobile-First**: Design for smallest screen, scale up
2. **Clarity Over Cleverness**: Obvious interactions, no hidden features
3. **Speed**: Perceived performance through optimistic UI and skeleton screens
4. **Trust**: Professional design that instills confidence in booking
5. **Accessibility**: WCAG 2.1 AA compliant

### Visual Style
- **Aesthetic**: Modern, clean, premium hotel-tech
- **Tone**: Professional yet approachable
- **Color Psychology**: Trust (blue), Success (green), Urgency (amber)

---

## Design System

### Color Palette

```
PRIMARY COLORS
├─ Brand Primary: #0066FF (Blue) - CTAs, links, active states
├─ Brand Secondary: #00D4AA (Teal) - Accents, success states
└─ Brand Accent: #FF6B35 (Coral) - Promotions, highlights

NEUTRAL COLORS
├─ Gray 900: #1A1A1A - Headings (dark mode: #F5F5F5)
├─ Gray 700: #4A4A4A - Body text (dark mode: #E0E0E0)
├─ Gray 500: #9E9E9E - Secondary text
├─ Gray 300: #E0E0E0 - Borders, dividers
├─ Gray 100: #F5F5F5 - Backgrounds
└─ White: #FFFFFF - Card backgrounds

SEMANTIC COLORS
├─ Success: #00C853 - Confirmed bookings, available rooms
├─ Warning: #FFC107 - Pending actions, expiring soon
├─ Error: #F44336 - Errors, unavailable
└─ Info: #2196F3 - Information, tips

ROOM STATUS COLORS
├─ Available: #00C853 (Green)
├─ Locked: #FFC107 (Amber)
├─ Booked: #2196F3 (Blue)
├─ Occupied: #9C27B0 (Purple)
├─ Cleaning: #FF9800 (Orange)
└─ Maintenance: #F44336 (Red)
```

### Typography

```
FONT FAMILY
├─ Primary: Inter (Headings, UI)
└─ Secondary: System UI Stack (Body text for performance)

FONT SCALE
├─ Display: 48px / 56px (Hero sections)
├─ H1: 36px / 44px (Page titles)
├─ H2: 28px / 36px (Section headers)
├─ H3: 24px / 32px (Card titles)
├─ H4: 20px / 28px (Subsections)
├─ Body Large: 18px / 28px (Prominent text)
├─ Body: 16px / 24px (Default)
├─ Body Small: 14px / 20px (Secondary info)
└─ Caption: 12px / 16px (Labels, metadata)

FONT WEIGHTS
├─ Regular: 400
├─ Medium: 500
└─ Bold: 700
```

### Spacing System

```
BASE UNIT: 4px

SCALE
├─ xs: 4px   (Tight spacing, icon padding)
├─ sm: 8px   (Compact lists, button padding)
├─ md: 16px  (Default spacing, card padding)
├─ lg: 24px  (Section spacing)
├─ xl: 32px  (Page margins)
├─ 2xl: 48px (Major sections)
└─ 3xl: 64px (Hero sections)
```

### Component Library

#### 1. Buttons

```
PRIMARY BUTTON
├─ Background: Brand Primary (#0066FF)
├─ Text: White
├─ Padding: 12px 24px
├─ Border Radius: 8px
├─ Font: 16px Medium
├─ States:
│   ├─ Hover: Darken 10%
│   ├─ Active: Darken 20%
│   └─ Disabled: Opacity 50%
└─ Use: Main CTAs (Book Now, Confirm Payment)

SECONDARY BUTTON
├─ Background: Transparent
├─ Border: 2px solid Gray 300
├─ Text: Gray 900
└─ Use: Cancel, Back

GHOST BUTTON
├─ Background: Transparent
├─ Text: Brand Primary
└─ Use: Tertiary actions

ICON BUTTON
├─ Size: 40px × 40px
├─ Icon: 20px
└─ Use: Navigation, actions
```

#### 2. Cards

```
HOTEL CARD (List View)
┌────────────────────────────────┐
│ [Image]          Hotel Name    │
│  200×150         ★★★★☆ 4.2     │
│                  📍 2.3 km     │
│                  From ₦15,000  │
│                  [View Rooms]  │
└────────────────────────────────┘
├─ Shadow: 0 2px 8px rgba(0,0,0,0.1)
├─ Border Radius: 12px
├─ Padding: 16px
└─ Hover: Lift (translateY -4px)

ROOM CARD
┌────────────────────────────────┐
│ Deluxe King Room               │
│ 🛏 King Bed · 🚿 Private Bath  │
│ 👤 2 Guests · 📏 32 sqm        │
│                                │
│ ₦25,000 / night                │
│ [●] Available                  │
│ [Book Now]                     │
└────────────────────────────────┘
├─ Shows real-time availability
└─ Status badge with color coding
```

#### 3. Forms

```
INPUT FIELD
├─ Height: 48px
├─ Border: 1px solid Gray 300
├─ Border Radius: 8px
├─ Padding: 12px 16px
├─ Font: 16px Regular
├─ States:
│   ├─ Focus: Border → Brand Primary, shadow
│   ├─ Error: Border → Error Red
│   └─ Disabled: Background Gray 100
└─ Label: Above input, 14px Medium

DATE PICKER
├─ Calendar dropdown
├─ Shows availability heat map
└─ Disables fully booked dates

DROPDOWN
├─ Native select on mobile
└─ Custom dropdown on desktop
```

#### 4. Navigation

```
MOBILE BOTTOM TAB BAR
┌────────────────────────────────┐
│ [🏠] [🔍] [📍] [📋] [👤]      │
│ Home  Search  Map  Bookings Me │
└────────────────────────────────┘
├─ Height: 64px (includes safe area)
├─ Active: Brand Primary
└─ Inactive: Gray 500

DESKTOP TOP NAVIGATION
┌────────────────────────────────┐
│ [SmartStay Logo]  🏠 🔍 📋    │
│                        🔔 [👤] │
└────────────────────────────────┘
├─ Height: 72px
├─ Sticky on scroll
└─ Shows search bar on homepage
```

---

## Screen Specifications

### 🎯 GUEST EXPERIENCE

#### Screen 1: Onboarding (Mobile Only)

```
FLOW: 3 Screens (Swipeable)

Screen 1: Welcome
┌─────────────────────────────┐
│         [Skip] ──────────→  │
│                             │
│     [Illustration:          │
│      Hotel Search]          │
│                             │
│   Find Your Perfect Stay    │
│   Discover hotels nearby    │
│   with real-time booking    │
│                             │
│         ● ○ ○               │
│         [Next]              │
└─────────────────────────────┘

Screen 2: Location
┌─────────────────────────────┐
│         [Skip] ──────────→  │
│                             │
│     [Illustration:          │
│      Location Pin]          │
│                             │
│   Smart Location Search     │
│   We'll show you hotels     │
│   near your current spot    │
│                             │
│         ○ ● ○               │
│         [Next]              │
└─────────────────────────────┘

Screen 3: Ready
┌─────────────────────────────┐
│                             │
│     [Illustration:          │
│      Booking Success]       │
│                             │
│   Book in Seconds           │
│   Secure payments & instant │
│   confirmation guaranteed   │
│                             │
│         ○ ○ ●               │
│     [Get Started]           │
└─────────────────────────────┘
```

**Implementation**:
- Show only on first launch
- Skip button saves preference
- Auto-advance after 5s (optional)

---

#### Screen 2: Location Permission

```
┌─────────────────────────────┐
│         [✕ Dismiss]         │
│                             │
│     [Icon: Location Pin]    │
│                             │
│   Enable Location Access    │
│                             │
│   To show you nearby hotels │
│   and accurate distances,   │
│   we need your location.    │
│                             │
│   📍 Used only for search   │
│   🔒 Never stored/shared    │
│   ⚙️  Change anytime         │
│                             │
│   [Enable Location]         │
│   [Enter Manually] ────┐    │
│                        ↓    │
│          (Opens city input) │
└─────────────────────────────┘
```

**States**:
1. **Denied**: Show manual entry + explanation
2. **Granted**: Proceed to home
3. **Blocked**: Show settings deep-link

---

#### Screen 3: Home / Search

```
MOBILE VIEW
┌─────────────────────────────┐
│ 📍 Lagos, Nigeria [Change]  │
│ ┌─────────────────────────┐ │
│ │ 🔍 Search hotels...     │ │
│ └─────────────────────────┘ │
│                             │
│ [List View] [Map View]      │
│                             │
│ Nearby Hotels (23)          │
│ ┌─────────────────────────┐ │
│ │ [Image] Golden Suites   │ │
│ │ ★★★★☆ 4.3 (120 reviews)│ │
│ │ 📍 1.2 km · 5 min drive │ │
│ │ From ₦18,000/night      │ │
│ │ [View Rooms]            │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Image] Royal Palace    │ │
│ │ ★★★★★ 4.8 (89 reviews) │ │
│ │ 📍 2.1 km · 8 min drive │ │
│ │ From ₦25,000/night      │ │
│ │ [View Rooms]            │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘

DESKTOP VIEW
┌──────────────────────────────────────────┐
│ [SmartStay Logo]    🏠 🔍 📋     🔔 [👤] │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ 📍 Lagos  |  📅 Check-in | 👤 Guests │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────┬─────────────────────────┐  │
│ │ FILTERS  │  Hotels (23)            │  │
│ │          │  Sort: Distance ▼       │  │
│ │ Price    │  ┌──────────────────┐   │  │
│ │ [Slider] │  │ Golden Suites    │   │  │
│ │          │  │ ★★★★☆ 4.3        │   │  │
│ │ Rating   │  │ 1.2 km away      │   │  │
│ │ ★★★★★    │  │ ₦18,000/night    │   │  │
│ │          │  └──────────────────┘   │  │
│ │ Amenities│  ┌──────────────────┐   │  │
│ │ □ WiFi   │  │ Royal Palace     │   │  │
│ │ □ Pool   │  │ ★★★★★ 4.8        │   │  │
│ │ □ Gym    │  │ 2.1 km away      │   │  │
│ │          │  │ ₦25,000/night    │   │  │
│ └──────────┤  └──────────────────┘   │  │
└──────────────────────────────────────────┘
```

**Features**:
- Real-time location display
- Sort: Distance, Price, Rating
- Filter: Price range, Rating, Amenities
- Skeleton screens while loading
- Infinite scroll / pagination

---

#### Screen 4: Hotel Details

```
┌─────────────────────────────┐
│ [← Back]            [♡ Save]│
├─────────────────────────────┤
│ [Image Gallery - Swipeable] │
│ ← → →                1/8    │
├─────────────────────────────┤
│ Golden Suites Hotel         │
│ ★★★★☆ 4.3 (120 reviews)    │
│ 📍 15 Allen Avenue, Ikeja   │
│    1.2 km · 5 min drive     │
│    [View on Map]            │
│                             │
│ ─────────────────────────   │
│ About This Hotel            │
│ Modern hotel with luxury    │
│ amenities in the heart...   │
│ [Read More]                 │
│                             │
│ ─────────────────────────   │
│ Amenities                   │
│ ✓ Free WiFi   ✓ Pool        │
│ ✓ Restaurant  ✓ Parking     │
│ ✓ Gym         ✓ 24/7 Front  │
│                             │
│ ─────────────────────────   │
│ Available Rooms             │
│ ┌─────────────────────────┐ │
│ │ Standard Room           │ │
│ │ 🛏 Double · 🚿 Shower   │ │
│ │ 👤 2 Guests             │ │
│ │ ₦18,000/night           │ │
│ │ ● 3 Available           │ │
│ │ [Book Now]              │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Deluxe Room             │ │
│ │ 🛏 King · 🛁 Bathtub    │ │
│ │ 👤 2 Guests             │ │
│ │ ₦25,000/night           │ │
│ │ ● 1 Available           │ │
│ │ [Book Now]              │ │
│ └─────────────────────────┘ │
│                             │
│ ─────────────────────────   │
│ Reviews (120)               │
│ [Review Component]          │
│                             │
└─────────────────────────────┘
```

**Features**:
- Image gallery with zoom
- Real-time room counts update
- "Last booked 5 min ago" social proof
- Reviews with verification badges

---

#### Screen 5: Booking Flow

```
STEP 1: Room Selection (Covered in Hotel Details)

STEP 2: Guest Details
┌─────────────────────────────┐
│ [← Back]   Guest Information│
├─────────────────────────────┤
│ Booking Details             │
│ ┌─────────────────────────┐ │
│ │ Deluxe Room             │ │
│ │ Golden Suites Hotel     │ │
│ │ 📅 Dec 20-22, 2025 (2N) │ │
│ │ 👤 2 Guests             │ │
│ └─────────────────────────┘ │
│                             │
│ Your Information            │
│ ┌─────────────────────────┐ │
│ │ Full Name *             │ │
│ │ [_________________]     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Email *                 │ │
│ │ [_________________]     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Phone Number *          │ │
│ │ [+234] [___________]    │ │
│ └─────────────────────────┘ │
│                             │
│ Special Requests (Optional) │
│ ┌─────────────────────────┐ │
│ │ [___________________]   │ │
│ │ [___________________]   │ │
│ └─────────────────────────┘ │
│                             │
│ ─────────────────────────   │
│ Room is locked for you      │
│ ⏱ 14:32 remaining           │
│ ─────────────────────────   │
│                             │
│ [Continue to Payment]       │
└─────────────────────────────┘

STEP 3: Payment
┌─────────────────────────────┐
│ [← Back]   Payment          │
├─────────────────────────────┤
│ Booking Summary             │
│ ┌─────────────────────────┐ │
│ │ Room: ₦25,000 × 2 nights│ │
│ │                  ₦50,000│ │
│ │ Service Fee        ₦500 │ │
│ │ ─────────────────────── │ │
│ │ Total          ₦50,500  │ │
│ └─────────────────────────┘ │
│                             │
│ Payment Method              │
│ ┌─────────────────────────┐ │
│ │ ○ Card (Paystack)       │ │
│ │ ○ Bank Transfer         │ │
│ │ ○ Pay at Hotel          │ │
│ └─────────────────────────┘ │
│                             │
│ □ I agree to terms and      │
│   cancellation policy       │
│                             │
│ ⏱ 12:15 remaining           │
│                             │
│ [🔒 Pay ₦50,500]            │
└─────────────────────────────┘

STEP 4: Confirmation
┌─────────────────────────────┐
│          [✕ Close]          │
│                             │
│     [✓ Success Icon]        │
│                             │
│   Booking Confirmed!        │
│                             │
│ Your reservation at Golden  │
│ Suites is confirmed.        │
│                             │
│ Booking Reference           │
│ BS-2025-12345               │
│                             │
│ [View Booking]              │
│ [Download Receipt]          │
│ [Back to Home]              │
└─────────────────────────────┘
```

**Features**:
- Countdown timer (lock expiration)
- Auto-save form data
- Payment via Paystack modal
- Instant confirmation
- Email + SMS confirmation

---

#### Screen 6: Map View

```
┌─────────────────────────────┐
│ [← Back]          [⚙ Filter]│
├─────────────────────────────┤
│                             │
│      [  Map  Canvas  ]      │
│                             │
│    📍 (You)                 │
│                             │
│    🏨 ($18k)                │
│          🏨 ($25k)          │
│                             │
│    🏨 ($15k)                │
│                             │
└─────────────────────────────┘
│ ┌─────────────────────────┐ │
│ │ Golden Suites     [→]   │ │
│ │ ₦18,000 · 1.2 km        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Features**:
- Clusters for dense areas
- Price on markers
- Tap marker → Preview card
- Drag map → Update results
- Current location button

---

#### Screen 7: Bookings List

```
┌─────────────────────────────┐
│          My Bookings        │
│ [Upcoming] [Past] [Canceled]│
├─────────────────────────────┤
│ UPCOMING (2)                │
│ ┌─────────────────────────┐ │
│ │ Golden Suites           │ │
│ │ Deluxe Room             │ │
│ │ 📅 Dec 20-22, 2025      │ │
│ │ Status: ✓ Confirmed     │ │
│ │ BS-2025-12345           │ │
│ │ [View Details] [Cancel] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Royal Palace            │ │
│ │ Executive Suite         │ │
│ │ 📅 Jan 5-7, 2026        │ │
│ │ Status: ✓ Confirmed     │ │
│ │ BS-2026-00123           │ │
│ │ [View Details] [Cancel] │ │
│ └─────────────────────────┘ │
│                             │
│ PAST (5)                    │
│ ┌─────────────────────────┐ │
│ │ Sunset Inn              │ │
│ │ Standard Room           │ │
│ │ 📅 Dec 1-3, 2025        │ │
│ │ Status: ✓ Completed     │ │
│ │ [Leave Review]          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

### 🏨 HOTEL ADMIN DASHBOARD

#### Dashboard Home

```
DESKTOP VIEW
┌──────────────────────────────────────────┐
│ [SmartStay Admin]          🔔 [👤 Logout]│
├─────────┬────────────────────────────────┤
│ 🏠 Dash │  Golden Suites Dashboard       │
│ 🛏 Rooms│  ┌──────┐ ┌──────┐ ┌──────┐   │
│ 📋 Book │  │ 45   │ │ 12   │ │ ₦450K│   │
│ 👥 Staff│  │Rooms │ │Booked│ │Today │   │
│ 📊 Analyt│ └──────┘ └──────┘ └──────┘   │
│ ⚙ Settings│                              │
│         │  Today's Check-ins (8)         │
│         │  ┌──────────────────────────┐  │
│         │  │ John Doe · Room 101      │  │
│         │  │ Deluxe Room · 3:00 PM    │  │
│         │  │ [Check In]               │  │
│         │  └──────────────────────────┘  │
│         │                                │
│         │  Room Status Overview          │
│         │  ┌──────────────────────────┐  │
│         │  │ Available:    32 (71%)   │  │
│         │  │ Occupied:     10 (22%)   │  │
│         │  │ Cleaning:      2 (4%)    │  │
│         │  │ Maintenance:   1 (2%)    │  │
│         │  └──────────────────────────┘  │
└─────────┴────────────────────────────────┘
```

---

#### Room Management

```
┌──────────────────────────────────────────┐
│ Room Inventory                   [+ Add] │
├──────────────────────────────────────────┤
│ [All] [Available] [Occupied] [Maintenance]│
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ 101 · Standard Room                  ││
│ │ Status: ● Available                  ││
│ │ Price: ₦18,000/night                 ││
│ │ [Edit] [View] [Change Status] ▼      ││
│ └──────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐│
│ │ 201 · Deluxe Room                    ││
│ │ Status: ● Occupied (Check-out: 12PM) ││
│ │ Guest: John Doe                      ││
│ │ [View Booking] [Early Checkout]      ││
│ └──────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐│
│ │ 105 · Standard Room                  ││
│ │ Status: ● Cleaning                   ││
│ │ Started: 11:30 AM                    ││
│ │ [Mark as Clean]                      ││
│ └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

---

### 👔 PLATFORM ADMIN

```
┌──────────────────────────────────────────┐
│ SmartStay Platform Admin     🔔 [👤]     │
├─────────┬────────────────────────────────┤
│ 🏠 Dash │  Platform Overview             │
│ 🏨 Hotels│ ┌──────┐ ┌──────┐ ┌──────┐   │
│ 👥 Users│  │ 45   │ │ 1.2K │ │ ₦2.5M│   │
│ 💰 Rev  │  │Hotels│ │Users │ │Rev   │   │
│ ⚙ Config│  └──────┘ └──────┘ └──────┘   │
│         │                                │
│         │  Pending Hotel Approvals (3)   │
│         │  ┌──────────────────────────┐  │
│         │  │ Sunset Inn               │  │
│         │  │ 📍 Lagos · 25 Rooms      │  │
│         │  │ [Review] [Approve] [Deny]│  │
│         │  └──────────────────────────┘  │
└─────────┴────────────────────────────────┘
```

---

## Interaction Patterns

### Loading States

```
SKELETON SCREEN (Hotel List)
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ [████████]  ▓▓▓▓▓▓▓▓▓▓  │ │
│ │             ▓▓▓▓ ▓▓▓▓   │ │
│ │             ▓▓▓▓▓▓      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [████████]  ▓▓▓▓▓▓▓▓▓▓  │ │
│ │             ▓▓▓▓ ▓▓▓▓   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

SPINNER (Payments)
    [⟳ Processing payment...]
    Please do not close this window
```

### Empty States

```
NO BOOKINGS YET
┌─────────────────────────────┐
│                             │
│    [Illustration: Empty]    │
│                             │
│   No Bookings Yet           │
│   Start exploring hotels    │
│   near you                  │
│                             │
│   [Explore Hotels]          │
│                             │
└─────────────────────────────┘
```

### Error States

```
ERROR
┌─────────────────────────────┐
│    [⚠ Icon]                 │
│                             │
│   Something Went Wrong      │
│   Could not load hotels.    │
│   Check your connection.    │
│                             │
│   [Try Again]               │
└─────────────────────────────┘
```

### Toast Notifications

```
✓ Booking confirmed!
⚠ Room lock expires in 5 minutes
✗ Payment failed. Please try again.
```

---

## Responsive Breakpoints

```
Mobile:   < 640px  (Single column)
Tablet:   640-1024px (2 columns)
Desktop:  > 1024px (Sidebar + content)
Wide:     > 1440px (Max-width 1440px)
```

---

## Accessibility

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Text: 4.5:1 minimum
   - Large text: 3:1 minimum
   - UI components: 3:1 minimum

2. **Keyboard Navigation**
   - All actions accessible via keyboard
   - Visible focus indicators
   - Skip to main content link

3. **Screen Reader Support**
   - Semantic HTML
   - ARIA labels for icons
   - Alt text for images
   - Live regions for real-time updates

4. **Focus Management**
   - Trap focus in modals
   - Return focus on close
   - Logical tab order

---

## Animation & Motion

### Principles
- **Purposeful**: Animations guide attention
- **Subtle**: 200-300ms durations
- **Respectful**: Respect `prefers-reduced-motion`

### Common Animations

```css
/* Page transitions */
.page-enter {
  animation: fadeIn 300ms ease-in;
}

/* Card hover */
.card:hover {
  transform: translateY(-4px);
  transition: transform 200ms ease;
}

/* Button press */
.button:active {
  transform: scale(0.98);
}

/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## Component Hierarchy

```
App
├─ Layout
│  ├─ Navigation (Top/Bottom)
│  ├─ Content
│  └─ Footer (Web only)
│
├─ Pages
│  ├─ Guest
│  │  ├─ Home/Search
│  │  ├─ HotelDetails
│  │  ├─ Booking
│  │  ├─ BookingList
│  │  └─ Profile
│  │
│  ├─ HotelAdmin
│  │  ├─ Dashboard
│  │  ├─ RoomManagement
│  │  ├─ BookingManagement
│  │  └─ Analytics
│  │
│  └─ PlatformAdmin
│     ├─ Dashboard
│     ├─ HotelApprovals
│     └─ PlatformAnalytics
│
└─ Shared Components
   ├─ Button
   ├─ Card
   ├─ Input
   ├─ Modal
   ├─ Toast
   ├─ Skeleton
   ├─ Map
   └─ DatePicker
```

---

## Dark Mode

### Toggle Behavior
- Respects system preference
- Manual override saved to localStorage
- Instant switch (no reload)

### Color Adjustments
```
Dark Mode Colors
├─ Background: #121212
├─ Surface: #1E1E1E
├─ Text Primary: #F5F5F5
├─ Text Secondary: #B0B0B0
└─ Borders: #333333
```

---

## Performance Optimization

### Image Optimization
- WebP with JPEG fallback
- Lazy loading (below fold)
- Responsive images (srcset)
- Blur placeholder (LQIP)

### Code Splitting
- Route-based splitting
- Component lazy loading
- Vendor chunk separation

### Perceived Performance
- Optimistic UI updates
- Skeleton screens
- Instant feedback (local state)

---

## Mobile-Specific Considerations

### Touch Targets
- Minimum 44×44px (iOS HIG)
- 48×48dp (Material Design)

### Safe Areas
- Respect notch/home indicator
- Bottom navigation above safe area

### Platform Patterns
- iOS: Bottom sheets, swipe gestures
- Android: FAB, snackbar

### Permissions
- Request just-in-time
- Explain why (educational modal)
- Fallback if denied

---

## Conclusion

This design system provides a comprehensive foundation for building SmartStay. All components are designed to be:
- Reusable across web and mobile
- Accessible to all users
- Performant and responsive
- Brand-consistent
- Production-ready

Next: Database Schema & Architecture
