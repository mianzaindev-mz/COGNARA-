---
name: Lumina Student Intelligence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e1bfb6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a88a81'
  outline-variant: '#59413a'
  surface-tint: '#ffb59f'
  primary: '#ffb59f'
  on-primary: '#5f1600'
  primary-container: '#ff6b3d'
  on-primary-container: '#611700'
  inverse-primary: '#ae3203'
  secondary: '#ffdf9e'
  on-secondary: '#3f2e00'
  secondary-container: '#fabd00'
  on-secondary-container: '#6a4e00'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#9b9999'
  on-tertiary-container: '#323131'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#862300'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#fabd00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  card-padding: 24px
---

## Brand & Style

The design system embodies a **Futuristic Dark Glassmorphism** aesthetic tailored for high-performance learning environments. It targets a modern student demographic that values efficiency, focus, and a "tech-forward" feel. 

The brand personality is **intelligent, sleek, and high-energy**. The visual language uses deep onyx backgrounds to minimize eye strain during long study sessions, while vibrant orange accents inject energy and signal progress. The interface feels like a digital cockpit for the mind—layered, translucent, and highly responsive. 

Key stylistic pillars include:
- **Depth through Translucency:** Using frosted glass effects to create a sense of organized layers.
- **Vibrant Accents:** Utilizing high-saturation orange for critical path actions and data visualization.
- **Tech-Optimized:** Clean lines and precise spacing that mimic advanced developer tools and dashboards.

## Colors

The palette is anchored in a **Pitch Dark** environment to make the orange "Lumina" glow feel intentional and functional.

- **Primary (Electric Orange):** Used for primary buttons, active progress bars, and high-priority highlights. It signifies action and momentum.
- **Secondary (Muted Amber):** Reserved for secondary status indicators (like the 'Home' active state in the sidebar) and spotlight tags.
- **Surfaces:** The background is a true neutral black (`#0F0F0F`). Interactive surfaces use a tiered dark grey (`#1E1E1E`) with low-opacity glass overlays.
- **Functional Accents:** Subtle color coding (Teal, Purple, Blue) is used sparingly for category tagging (e.g., Marketing vs. Computer Science) to keep the primary orange dominant.

## Typography

The typography system uses a tri-font strategy to balance readability with a technical edge.

- **Manrope** handles headlines with a modern, friendly but geometric presence.
- **Hanken Grotesk** is the workhorse for body text, providing high legibility in dark mode where "halation" (text glowing) can occur.
- **Geist** is used for labels, navigation items, and data points, providing a monospaced-adjacent feel that reinforces the "Intelligence" aspect of the brand.

**Scaling Note:** On mobile devices, `headline-xl` should scale down to 32px (`headline-lg`) to ensure it fits within the viewport without excessive wrapping.

## Layout & Spacing

This design system utilizes a **Fluid Grid** with fixed maximum containers for readability. 

- **Grid System:** 12-column grid for desktop, 8-column for tablet, and 4-column for mobile.
- **Spacing Rhythm:** Based on a 4px baseline. Most components use 8px, 16px, or 24px increments to maintain a rigorous mathematical feel.
- **Vertical Spacing:** Generous whitespace between sections (48px+) helps prevent the dark interface from feeling cluttered or overwhelming.
- **Mobile Reflow:** Cards that appear in a horizontal row on desktop (e.g., Course Cards) stack vertically on mobile to maximize the touch target of the orange "Continue" buttons.

## Elevation & Depth

Depth is communicated through **Tonal Layering and Backdrop Blurs** rather than traditional drop shadows.

1.  **Base Layer:** Solid `#0F0F0F`.
2.  **Surface Layer (Cards/Sidebar):** Darker grey (`#1E1E1E`) with a subtle 1px border at 10% white opacity to define edges against the black background.
3.  **Overlay Layer (Modals/Active Popovers):** Use a `backdrop-filter: blur(12px)` and a semi-transparent black fill (`rgba(0,0,0,0.6)`).
4.  **The Glow:** High-priority elements like the active Orange progress bar or a hovered "Continue" button should have a soft, low-spread outer glow using the primary orange color (`rgba(255, 107, 61, 0.2)`) to simulate light emission.

## Shapes

The shape language is **Rounded**, striking a balance between approachable and professional.

- **Default Border Radius:** 0.5rem (8px) for input fields and small cards.
- **Large Components:** Course cards and main containers use `rounded-lg` (16px).
- **Search Bar:** Uses the `rounded-xl` (24px) or full pill shape to differentiate it as a primary interaction point in the header.
- **Progress Bars:** Fully pill-shaped to feel fluid and continuous.

## Components

### Buttons
- **Primary:** Solid Electric Orange (`#FF6B3D`) with white or very dark grey text. Should have a subtle glow on hover.
- **Secondary:** Transparent background with a 1px border of white (20% opacity).
- **Ghost:** No border, orange text for navigation-style actions.

### Progress Bars
- **Track:** Deep grey (`#2A2A2A`).
- **Fill:** Gradient or solid Electric Orange.
- **Detail:** Include a percentage label in `label-sm` (Geist) positioned above or to the right of the bar.

### Cards (Course/Module)
- **Background:** High-gloss glassmorphism. A subtle colored border (10% opacity of the category color) can be used to distinguish subjects.
- **Interaction:** On hover, the 1px border should increase in opacity, and the primary action button (e.g., "Continue") should appear or animate into focus.

### Input Fields
- **Search:** Darker than the background, pill-shaped, with a 1px orange border that appears only on `:focus`.
- **Labels:** Use `label-sm` in a medium-grey color for field titles to maintain hierarchy.

### Chips & Tags
- **Category Tags:** Rounded shapes with a low-opacity background of the category color and high-contrast text.
- **Status Tags (e.g., 'Spotlight'):** Bright Amber background with black text to draw immediate attention.