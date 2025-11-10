# Design System

Modern SaaS aesthetic based on Linear, Vercel, and Stripe design patterns with full dark mode support.

---

## 🎨 Color Palette

### Primary & Accent Colors

```
PRIMARY (Blue)
Light Mode:  #2563EB
Hover:       #1D4ED8
Light bg:    #DBEAFE
Dark:        #1E40AF

Dark Mode:   #3B82F6
Hover:       #60A5FA

ACCENT (Cyan)
Main:        #06B6D4
Hover:       #0891B2
Light bg:    #CFFAFE

SEMANTIC COLORS
Success:     #10B981 (light bg: #D1FAE5)
Warning:     #F59E0B (light bg: #FEF3C7)
Error:       #EF4444 (light bg: #FEE2E2)
Highlight:   #FCD34D (for badges/accents)
```

### Neutral Colors

**Light Mode:**
```
Backgrounds:
--bg-primary:    #FFFFFF (main background)
--bg-secondary:  #F9FAFB (subtle contrast)
--bg-tertiary:   #F3F4F6 (deeper contrast)

Borders:
--border-light:  #E5E7EB
--border-medium: #D1D5DB
--border-dark:   #9CA3AF

Text:
--text-primary:   #111827 (headings, body)
--text-secondary: #6B7280 (descriptions)
--text-tertiary:  #9CA3AF (captions)
--text-disabled:  #D1D5DB
```

**Dark Mode:**
```
Backgrounds:
--bg-primary:    #0F172A (slate-900)
--bg-secondary:  #1E293B (slate-800)
--bg-tertiary:   #334155 (slate-700)

Borders:
--border-light:  #334155
--border-medium: #475569
--border-dark:   #64748B

Text:
--text-primary:   #F1F5F9
--text-secondary: #94A3B8
--text-tertiary:  #64748B
--text-disabled:  #475569
```

### Glassmorphism

```
Light Mode:  background: rgba(255, 255, 255, 0.8)
             border: rgba(255, 255, 255, 0.18)
             backdrop-filter: blur(12px)

Dark Mode:   background: rgba(30, 41, 59, 0.8)
             border: rgba(255, 255, 255, 0.1)
             backdrop-filter: blur(12px)
```

---

## ✍️ Typography

### Font Families

```
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Code:    'JetBrains Mono', 'Fira Code', 'Consolas', monospace
```

### Font Sizes & Usage

```
DISPLAY (Hero sections)
--display-xl:  72px / 4.5rem   (weight: 700, line-height: 1.1)
--display-lg:  60px / 3.75rem  (weight: 700, line-height: 1.1)
--display-md:  48px / 3rem     (weight: 700, line-height: 1.15)

HEADINGS
--h1: 36px / 2.25rem   (weight: 700, line-height: 1.25)
--h2: 30px / 1.875rem  (weight: 600, line-height: 1.3)
--h3: 24px / 1.5rem    (weight: 600, line-height: 1.35)
--h4: 20px / 1.25rem   (weight: 600, line-height: 1.4)
--h5: 18px / 1.125rem  (weight: 600, line-height: 1.5)
--h6: 16px / 1rem      (weight: 600, line-height: 1.5)

BODY
--body-lg: 18px / 1.125rem  (line-height: 1.75)
--body:    16px / 1rem      (line-height: 1.5) ← DEFAULT
--body-sm: 14px / 0.875rem  (line-height: 1.5)
--body-xs: 12px / 0.75rem   (line-height: 1.5)
```

### Font Weights

```
Light:     300
Regular:   400  ← Body text
Medium:    500
Semibold:  600  ← Headings, buttons
Bold:      700  ← Display text
```

---

## 📐 Spacing System

### Base Unit: 4px

```
space-0:  0
space-1:  4px    (0.25rem)
space-2:  8px    (0.5rem)
space-3:  12px   (0.75rem)
space-4:  16px   (1rem)
space-5:  20px   (1.25rem)
space-6:  24px   (1.5rem)
space-8:  32px   (2rem)
space-10: 40px   (2.5rem)
space-12: 48px   (3rem)
space-16: 64px   (4rem)
space-20: 80px   (5rem)
space-24: 96px   (6rem)
space-32: 128px  (8rem)
```

### Usage Guidelines

```
Component padding:  12-24px (space-3 to space-6)
Card padding:       20-32px (space-5 to space-8)
Section padding:    48-96px (space-12 to space-24)
Element gaps:       8-16px (space-2 to space-4)
List item spacing:  12px vertical (space-3)
```

---

## 🧩 Components

### Buttons

**Primary Button**
```
Structure:
- padding: 12px 24px
- border-radius: 8px
- font-weight: 600
- font-size: 15px
- transition: all 200ms ease

Light Mode:
- background: #2563EB
- color: white
- shadow: 0 1px 2px rgba(0,0,0,0.05)

Hover:
- background: #1D4ED8
- transform: translateY(-1px)
- shadow: 0 4px 8px rgba(37,99,235,0.2)

Sizes:
- Small:  8px 16px, 14px text
- Medium: 12px 24px, 15px text (default)
- Large:  14px 28px, 16px text
```

**Secondary Button**
```
- background: white (dark: slate-800)
- border: 1px solid border-medium
- color: text-primary
- hover: background to bg-tertiary
```

**Ghost Button**
```
- background: transparent
- color: text-secondary
- hover: background to surface-hover
```

### Cards

**Standard Card**
```
- background: surface-primary
- border-radius: 12px
- padding: 24px
- border: 1px solid border-light
- shadow: 0 1px 3px rgba(0,0,0,0.05)

Hover (if interactive):
- transform: translateY(-2px)
- shadow: 0 8px 16px rgba(0,0,0,0.08)
- border-color: border-medium
```

**Elevated Card (Featured)**
```
- background: #2563EB
- color: white
- shadow: 0 20px 40px rgba(37,99,235,0.25)
- transform: scale(1.05)
- z-index: 10
- Use for: Highlighted pricing tiers, featured content
```

**Glassmorphic Card**
```
- background: rgba(255,255,255,0.8) or rgba(30,41,59,0.8)
- backdrop-filter: blur(12px)
- border: 1px solid rgba(255,255,255,0.18)
- shadow: 0 8px 32px rgba(0,0,0,0.08)
- Use for: Hero sections, floating elements
```

### Input Fields

```
Structure:
- padding: 10px 14px
- border-radius: 8px
- font-size: 15px
- transition: all 150ms ease

Default:
- background: white (dark: slate-800)
- border: 1px solid border-medium
- color: text-primary

Focus:
- border-color: primary
- box-shadow: 0 0 0 3px rgba(37,99,235,0.1)
- outline: none

Placeholder:
- color: text-tertiary
```

### Badges / Pills

```
Structure:
- padding: 4px 12px
- border-radius: 9999px (fully rounded)
- font-size: 13px
- font-weight: 500
- display: inline-flex
- align-items: center
- gap: 6px

Variants:
Primary:  background: #DBEAFE, color: #1E40AF
Success:  background: #D1FAE5, color: #065F46
Warning:  background: #FEF3C7, color: #92400E
Error:    background: #FEE2E2, color: #991B1B
```

### Avatars

```
Sizes:
- XS: 24px
- SM: 32px
- MD: 40px (default)
- LG: 48px
- XL: 64px

Style:
- border-radius: 50%
- border: 2px solid white (dark: slate-700)
- box-shadow: 0 2px 4px rgba(0,0,0,0.1)

Avatar Groups:
- margin-left: -8px (overlapping effect)
```

### Progress Indicators

**Progress Bar**
```
- height: 6px
- border-radius: 9999px
- background: bg-tertiary
- fill: gradient from primary to accent
- transition: width 300ms ease
```

**Circular Progress** (Multi-ring from screenshots)
```
- width/height: 80px
- stroke-width: 8px
- stroke-linecap: round
- colors: cyan (#06B6D4), orange (#F59E0B), blue (#2563EB)
```

### Navigation Pills

```
- padding: 8px 16px
- border-radius: 8px
- font-size: 14px
- font-weight: 500
- color: text-secondary
- transition: all 150ms ease

Active State:
- background: bg-tertiary (dark: surface-hover-dark)
- color: text-primary
```

---

## 🌈 Shadows & Effects

### Shadow Scale

```
--shadow-xs:       0 1px 2px rgba(0,0,0,0.04)
--shadow-sm:       0 1px 3px rgba(0,0,0,0.06)
--shadow-md:       0 4px 8px rgba(0,0,0,0.08)
--shadow-lg:       0 8px 16px rgba(0,0,0,0.1)
--shadow-xl:       0 12px 24px rgba(0,0,0,0.12)
--shadow-2xl:      0 20px 40px rgba(0,0,0,0.14)
--shadow-featured: 0 24px 48px rgba(0,0,0,0.16)

Dark Mode: Increase opacity (0.3-0.8 range)
```

### Border Radius

```
--radius-sm:   6px   (small elements)
--radius-md:   8px   (buttons, inputs)
--radius-lg:   12px  (cards, modals)
--radius-xl:   16px  (large cards)
--radius-2xl:  24px  (hero sections)
--radius-full: 9999px (pills, avatars)
```

### Backdrop Blur

```
Glassmorphism:  blur(12px)
Overlays:       blur(8px)
Always include: -webkit-backdrop-filter for Safari support
```

---

## ⚡ Animations

### Timing Functions

```
--ease-in:     cubic-bezier(0.4, 0, 1, 1)
--ease-out:    cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  ← DEFAULT
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Durations

```
--duration-fast:   100ms  (instant feedback)
--duration-normal: 200ms  (standard transitions) ← DEFAULT
--duration-slow:   300ms  (emphasis)
--duration-slower: 500ms  (page transitions)
```

### Common Patterns

```
Standard Interactive Element:
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

Hover Lift:
transform: translateY(-2px);
transition: transform 200ms ease, box-shadow 200ms ease;

Button Press:
transform: scale(0.98);
transition: transform 150ms ease;

Fade In:
animation: fadeIn 300ms ease-out;
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Micro-interactions

```
ALL interactive elements must have:
✓ Hover state (lift 2px + shadow enhancement)
✓ Active state (scale down slightly)
✓ Focus state (outline or ring for keyboard users)
✓ Smooth transition (200ms)
```

---

## 📱 Layout Patterns

### Container Widths

```
--container-sm:  640px
--container-md:  768px
--container-lg:  1024px
--container-xl:  1280px  ← PRIMARY
--container-2xl: 1536px
--content-max:   65ch (for readable text)
```

### Common Layouts

**Hero Section**
```
Structure:
- padding: 96px 24px (vertical, horizontal)
- text-align: center
- max-width: 1280px
- margin: 0 auto

Elements:
1. Badge/pill at top (margin-bottom: 24px)
2. Display heading (font-size: 3.75rem, margin-bottom: 24px)
3. Subtitle (font-size: 1.125rem, max-width: 65ch, margin-bottom: 32px)
4. CTA buttons (gap: 16px)
5. Feature cards below (grid, gap: 24px, margin-top: 48px)
```

**Pricing Cards**
```
Grid:
- display: grid
- grid-template-columns: repeat(3, 1fr)
- gap: 24px
- max-width: 1200px

Center Card Special Treatment:
- transform: scale(1.05)
- z-index: 10
- Use elevated card style
- Add badge/lightning icon
```

**Dashboard Layout**
```
Grid Structure:
- grid-template-columns: 64px 280px 1fr
- height: 100vh

Sections:
1. Icon sidebar (64px)
2. Navigation panel (280px)
3. Main content (flexible)
```

**Sidebar Navigation**
```
- width: 280px
- padding: 16px
- background: surface-primary
- border-right: 1px solid border-light

Items:
- padding: 10px 12px
- border-radius: 8px
- margin-bottom: 4px
- gap: 12px between icon and text
```

### Responsive Grid

```
3-Column Grid (Auto-fit):
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 24px;

Breakpoints (use with Tailwind or media queries):
- Mobile:  < 640px  (sm)
- Tablet:  640-1024px (md-lg)
- Desktop: > 1024px (xl+)
```

---

## ♿ Accessibility

### Focus States

```
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

Alternative (Ring Style):
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.5);
}
```

### Contrast Requirements

```
Normal text:    4.5:1 minimum
Large text:     3:1 minimum
UI elements:    3:1 minimum
```

### Required Attributes

```
- All icon buttons: aria-label
- Form inputs: <label> or aria-label
- Navigation: <nav> landmark
- Main content: <main> landmark
- Status messages: role="status" or aria-live
- Disabled elements: disabled + aria-disabled="true"
```

### Keyboard Navigation

```
✓ Tab order follows visual order
✓ All interactive elements focusable
✓ Escape closes modals/dropdowns
✓ Enter activates buttons
✓ Space toggles checkboxes
✓ Arrow keys navigate lists/menus
```
