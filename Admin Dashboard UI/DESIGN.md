---
name: Midnight Onyx High-Fidelity Admin
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#e6bdbc'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#ac8888'
  outline-variant: '#5c3f3f'
  surface-tint: '#ffb3b3'
  primary: '#ffb3b3'
  on-primary: '#680015'
  primary-container: '#dc143c'
  on-primary-container: '#fff1f0'
  inverse-primary: '#bf0030'
  secondary: '#e6feff'
  on-secondary: '#003739'
  secondary-container: '#00f4fe'
  on-secondary-container: '#006c71'
  tertiary: '#fbbc00'
  on-tertiary: '#402d00'
  tertiary-container: '#8f6a00'
  on-tertiary-container: '#fff3e3'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b3'
  on-primary-fixed: '#40000a'
  on-primary-fixed-variant: '#920022'
  secondary-fixed: '#63f7ff'
  secondary-fixed-dim: '#00dce5'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#004f53'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#fbbc00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar_width_expanded: 260px
  sidebar_width_collapsed: 80px
  container_max_width: 1600px
  gutter: 24px
  margin_mobile: 16px
  margin_desktop: 32px
  stack_gap_sm: 8px
  stack_gap_md: 16px
  stack_gap_lg: 24px
---

## Brand & Style

The visual identity of the design system is rooted in the "Midnight Onyx" aesthetic—a sophisticated, dark-mode-first approach that conveys power, precision, and futuristic intelligence. The system is designed for high-level decision-makers and data analysts who require a command-center environment that feels both high-end and technologically advanced.

The style is a synthesis of **Glassmorphism** and **Corporate Modernism**. It utilizes translucent surfaces with precise background blurs to create a sense of depth and hierarchy without the clutter of traditional opaque containers. Subtle 3D effects are achieved through meticulous layering and multi-stage ambient shadows, giving the interface a tactile, "physical software" feel. The emotional response is one of calm control, high-stakes clarity, and premium craftsmanship.

## Colors

The palette is anchored by the **Midnight Onyx** base, a near-black foundation that eliminates visual fatigue. 
- **Deep Crimson (Primary):** Used for critical actions, primary branding elements, and high-priority alerts. It provides a striking contrast against the dark background.
- **Electric Teal (Secondary):** Employed for growth metrics, success states, and interactive data points. It represents vitality and technological precision.
- **Amber (Tertiary):** Reserved for warnings, pending states, and secondary highlights that require attention without the urgency of crimson.
- **Neutral (Onyx Tones):** A range of cool-toned dark greys are used to define surface tiers. Surface containers use semi-transparent hex codes to allow for background blur effects.

## Typography

The system uses **Plus Jakarta Sans** for its modern, friendly yet professional geometric construction. It excels in headlines and UI labels, providing excellent legibility at all scales. For data-intensive areas, terminal outputs, and metric values, **Geist** is introduced to provide a technical, monospaced rhythm that aligns with the futuristic theme.

High contrast is maintained through font weight rather than just color. Large displays and headlines utilize negative letter spacing to create a compact, "editorial" look for dashboard titles.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid Grid**. 
- **Sidebar:** A persistent, collapsible navigation bar sits at the left. It transitions from 260px to 80px, with icons remaining centered.
- **Main Canvas:** A fluid area that stretches to a maximum of 1600px for optimal readability of data visualizations.
- **Spacing Rhythm:** Based on an 8px base unit. Metric cards are high-density, utilizing 16px internal padding, while data visualization areas are spacious with 32px margins to prevent cognitive overload.
- **Breakpoints:** 
  - Mobile (<768px): Sidebar becomes a bottom navigation or hidden drawer. Margins reduce to 16px.
  - Tablet (768px - 1024px): 2-column grid for cards.
  - Desktop (>1024px): 4-column grid for metrics, 12-column system for complex data tables and charts.

## Elevation & Depth

Depth is the primary communicator of hierarchy. 
1. **Background Canvas:** The deepest layer (#050505).
2. **Surface Containers (Glass):** Cards and panels use a `rgba(18, 18, 20, 0.7)` fill with a 20px `backdrop-filter: blur()`. A 1px internal border (`rgba(255, 255, 255, 0.08)`) creates a "rim light" effect on the top and left edges.
3. **Interactive Layers:** Elements like active buttons or hovered cards use **Ambient Glows**. These are low-opacity, wide-spread shadows tinted with the primary Crimson or secondary Teal color (e.g., `box-shadow: 0 20px 40px rgba(220, 20, 60, 0.15)`).
4. **Subtle 3D Depth:** Dropdowns and modals use a double-layered shadow—one sharp for definition and one soft for elevation.

## Shapes

The design system uses **Rounded (0.5rem base)** geometry to balance the futuristic "tech" feel with modern accessibility.
- **Metric Cards:** Use `rounded-lg` (1rem) to create a soft, containerized look for data.
- **Buttons & Inputs:** Use the base 0.5rem rounding for a precise, professional appearance.
- **Active Indicators:** Sidebar active states and selected tabs use a "squircle" influence or pill-shaped indicators to stand out from the rectangular grid.

## Components

- **Buttons:** Primary buttons use a solid Crimson gradient with a subtle inner glow. Ghost buttons use the "rim light" border style with white text.
- **Metric Cards:** High-density layout. Title in `label-caps`, primary value in `display-lg` using the Teal or Crimson accent, and a sparkline trend graph at the bottom.
- **Sidebar Items:** Hover states trigger a subtle lateral shift (4px) and a background glow. Active items utilize a vertical accent bar in Crimson.
- **Input Fields:** Deep Onyx background with a 1px border. On focus, the border transitions to Teal with a soft outer glow.
- **Data Visualization:** Charts should use the accent colors (Teal/Crimson/Amber) against the dark backdrop. Use gradients for area charts to reinforce the glassmorphism theme.
- **Chips/Badges:** Small, pill-shaped elements with low-opacity background tints of the accent colors (e.g., a "Live" badge with 10% Teal background and solid Teal text).