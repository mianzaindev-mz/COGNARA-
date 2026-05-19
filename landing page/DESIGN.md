---
name: Cognara Intelligence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201F1F'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#E1BFB6'
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
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00af79'
  on-tertiary-container: '#003a25'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#862300'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  accent-warm: '#FF8E6E'
  glass-border: rgba(255, 255, 255, 0.1)
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  micro-tag:
    fontFamily: Hanken Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.2em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

Cognara is a high-performance, AI-native educational ecosystem. The brand personality is **sophisticated, forward-thinking, and academic**, yet distinctly technological. It avoids the dry aesthetics of traditional LMS platforms in favor of a "Command Center" feel.

The design style is a refined mix of **Glassmorphism** and **Modern Corporate Dark Mode**. It utilizes deep tonal layering and vibrant, "liquid" glows to simulate a sense of high-energy intelligence. The atmosphere is immersive, designed to minimize distraction while providing high-impact visual feedback through light-based interactive states.

## Colors

The palette is anchored by a deep **Neutral (#131313)** base, providing a high-contrast canvas for energetic accents. 

*   **Primary (Warm Orange):** Used for critical actions, progress indicators, and "intelligence" signifiers. It represents energy and growth.
*   **Secondary (Indigo/Violet):** Used for technical or computer science contexts, providing a cool-toned counterpoint to the primary orange.
*   **Tertiary (Emerald):** Reserved for success states, completed paths, and soft-skill categories like Psychology.
*   **Glass Layers:** Semi-transparent white overlays (3% to 12% opacity) are used extensively to create depth without introducing new hues.

## Typography

The system uses a two-family pairing to balance personality with readability.

**Plus Jakarta Sans** is the display face, chosen for its friendly yet precise geometric construction. It should be used for all headlines and major navigation elements. It often uses tight tracking and heavy weights (Extrabold/Bold) to command attention.

**Hanken Grotesk** is the functional workhorse. It provides a sharp, contemporary feel for body copy and metadata. To maintain the "technical" vibe, micro-labels and tags often use uppercase styling with generous letter spacing (0.2em) to ensure legibility at small sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop, centering content within a 1280px max-width container to maintain focus. 

*   **Vertical Rhythm:** Sections are separated by large 128px (16 units) pads to allow the "glow" effects space to breathe.
*   **Grid System:** On desktop, a 12-column grid is used. Cards typically span 4 columns (3-up) or 6 columns (2-up).
*   **Mobile Adaptation:** Margins shrink to 16px. Multi-column grids reflow to a single stack. Interactive elements maintain a minimum 48px hit area regardless of visual size.

## Elevation & Depth

Depth is the primary communicator of hierarchy in this system. It is achieved through a three-tier **Glassmorphism** model:

1.  **Depth 1 (Base):** Subtle blur (12px) and 3% white fill. Used for background navigation or secondary containers.
2.  **Depth 2 (Standard):** Medium blur (24px) and 5% white fill. Used for interactive cards. Includes a subtle inner-white highlight (top edge) to simulate light catching glass.
3.  **Depth 3 (High):** Heavy blur (40px) and 8% white fill. Reserved for primary CTAs or featured content. Includes a prominent drop shadow with a high spread and low opacity.

**Glows:** Absolute-positioned blurred circles (Primary/Secondary colors) sit behind containers to create a "liquid light" effect, signifying active intelligence or focus areas.

## Shapes

The shape language is **distinctly rounded**, reinforcing the "friendly intelligence" brand pillar.

*   **Primary Cards:** Use `4xl` (2.5rem/40px) corner radii to feel approachable and substantial.
*   **Buttons & Tags:** Use full-rounded (Pill) shapes for global actions and sharp `xl` (0.75rem/12px) for utility-based actions.
*   **Visual Continuity:** Every "glass" container should have a 1px border. This border acts as a "specular highlight," defining the shape's edges against the dark background.

## Components

### Buttons
*   **Primary:** Gradient fill (`#FF6B3D` to `#FF8E6E`), white text, and a matching orange outer glow on hover.
*   **Secondary (Glass):** Depth 2 glass background with high-contrast text. Scales slightly (1.02x) on hover.

### Progress Indicators
Progress bars use a "Glow Liquid" animation. The track is a low-opacity white line, while the fill is a saturated brand color with a trailing glow animation (`liquid-slide`) to imply movement and active processing.

### Cards
Cards are never "flat." They must use a Glass-Depth tier. Featured cards include a 4px left-border accent in the representative category color (e.g., Primary Orange for Marketing, Indigo for CS).

### Tags & Chips
Uppercase, tracked-out text inside a low-opacity glass capsule. They use high-contrast text to remain legible against the blur.

### Iconography
Utilize **Material Symbols Outlined**. Icons should use a `fill` setting of 1 for active states and 0 for inactive. Icons are often encased in a `rounded-xl` gradient square to serve as a focal point.