---
name: Lumina Learning
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e4beb6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ab8982'
  outline-variant: '#5b403a'
  surface-tint: '#ffb4a4'
  primary: '#ffb4a4'
  on-primary: '#630e00'
  primary-container: '#ff5733'
  on-primary-container: '#580c00'
  inverse-primary: '#b72301'
  secondary: '#ffe5b2'
  on-secondary: '#3f2e00'
  secondary-container: '#ffc300'
  on-secondary-container: '#6d5200'
  tertiary: '#ecb2ff'
  on-tertiary: '#520071'
  tertiary-container: '#bf72de'
  on-tertiary-container: '#490065'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a4'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1800'
  secondary-fixed: '#ffdf9a'
  secondary-fixed-dim: '#f8be00'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4300'
  tertiary-fixed: '#f8d8ff'
  tertiary-fixed-dim: '#ecb2ff'
  on-tertiary-fixed: '#320047'
  on-tertiary-fixed-variant: '#6c228c'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 2rem
  gutter: 1.5rem
  stack-gap: 1rem
  section-gap: 2.5rem
---

## Brand & Style

This design system is built for education and productivity platforms that value focus, warmth, and modern efficiency. The brand personality is encouraging yet professional, acting as a "calm mentor" for the user. 

The visual style follows a **Modern Corporate** aesthetic with **Tactile** influences. It utilizes deep, sophisticated backgrounds paired with vibrant, warm primary accents to guide the eye toward key actions. The UI relies on soft elevation, generous whitespace, and high-clarity typography to reduce cognitive load during learning or administrative tasks.

**Key Principles:**
- **Clarity over Clutter:** Every element must serve a functional purpose.
- **Warmth through Accents:** Use the primary orange and secondary amber tones to make the digital space feel inviting.
- **Soft Geometry:** Rounded corners and smooth transitions create a friendly, approachable atmosphere.

## Colors

The palette is anchored by a vibrant **Primary Orange** (#FF5733) used for main calls to action and critical brand moments. This is complemented by a **Secondary Amber** and **Tertiary Violet** used for categorization and progress tracking (e.g., step indicators).

The system supports dual modes:
- **Dark Mode (Default):** Uses a deep charcoal (#121212) for backgrounds with slightly lighter elevated surfaces (#1E1E1E).
- **Light Mode:** Uses a soft off-white (#F8F9FA) with pure white containers to minimize stark glare.

Semantic colors for "Demo Accounts" or "Switching" contexts should utilize the tertiary violet to distinguish them from standard transactional flows.

## Typography

This design system uses **Plus Jakarta Sans** for headlines to provide a modern, slightly geometric, and friendly character. For body text and functional labels, **Inter** is used to ensure maximum legibility at smaller sizes and within data-heavy containers.

- **Headlines:** Use a bold weight and slightly tighter letter-spacing to create a strong visual hierarchy.
- **Labels:** Small labels (like "OR EMAIL" or "DEMO ACCOUNTS") should use the `label-sm` style with increased letter-spacing and uppercase styling for distinct separation from body content.
- **Mobile Scaling:** On devices smaller than 768px, `headline-xl` should scale down to 32px and `headline-lg` to 28px.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for centralized containers (like login cards) and a **Fluid 12-column Grid** for dashboard views. 

**Spacing Rhythm:**
- A base unit of **8px** is used to maintain vertical rhythm.
- **Margins:** Large views use 24px margins on mobile, scaling to 64px or "Auto" on desktop to keep content centered and readable.
- **Gutters:** Standard 24px gutters between columns.
- **Stacking:** Elements within a card (inputs, labels, buttons) use a 16px (2 units) or 12px gap to maintain a compact, organized feel.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Ambient Shadows**.

- **Surfaces:** In dark mode, the base background is at the lowest level. Cards and modals are elevated using a slightly lighter hex and a very soft, diffused shadow (15% opacity black with a 20px blur).
- **Glassmorphism:** The "Theme Toggle" and certain overlays use a backdrop filter (blur: 10px) with a semi-transparent border (white at 10% opacity) to feel lightweight and modern.
- **Interaction:** Buttons and interactive cards should lift slightly on hover (shadow increases, Y-offset decreases) to provide tactile feedback.

## Shapes

The design system adopts a **Rounded** shape language to reinforce the brand's approachable nature.

- **Base Radius:** 0.5rem (8px) for input fields and small buttons.
- **Large Radius:** 1rem (16px) for main containers, cards, and large call-to-action buttons.
- **Extra Large Radius:** 1.5rem (24px) for modals and the "Demo Accounts" selector to make them feel distinct from the background.
- **Pill:** Used exclusively for tags, chips, and the theme toggle button.

## Components

### Buttons
- **Primary:** Solid background (Primary Orange), white text, 16px border-radius. High-contrast and center-aligned.
- **Secondary/Social:** White or Dark-Grey background with subtle borders. Icons (Google/GitHub) should be center-aligned with the text.
- **Ghost:** No background, primary-colored text, used for less urgent actions like "Forgot password?".

### Input Fields
- **Styling:** Subtle background fill (slightly lighter than the card), no border (or very thin 1px border in light mode). 
- **Labels:** Placed above the input using `label-md` for clarity.

### Demo Account Selector (Modal/Dropdown)
- **Visuals:** Use a "Surface" tier higher than the login card. 
- **Header:** Use `label-sm` in primary or tertiary color to clearly mark the section.
- **Items:** Each account option should be a wide button or list item with a hover state. Show the role (e.g., Student) on the left and the email on the right in a muted color.
- **Border:** Use a dashed or dotted border for the "Demo Accounts" container if it's embedded, or a clean shadow if it's a floating modal.

### Chips & Steps
- **Step Indicators:** Circular with a background color (Amber, Violet, Orange) and a bold number.
- **Status Chips:** Small, pill-shaped with low-opacity background fills matching the text color.