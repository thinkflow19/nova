# Nova AI Design System & Style Guide

## Overview

Nova AI uses a modern, neural-inspired design system that emphasizes futuristic aesthetics while maintaining excellent usability and accessibility. The design system is built on a foundation of design tokens, consistent typography, and a cohesive color palette.

## Design Principles

### 1. Neural Aesthetics
- **Glass Morphism**: Subtle transparency and blur effects create depth
- **Neural Gradients**: Multi-stop gradients inspired by neural networks
- **Soft Shadows**: Layered shadows that create natural depth
- **Smooth Animations**: 60fps micro-interactions for enhanced UX

### 2. Accessibility First
- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **High Contrast Support**: Automatic adaptation for high contrast modes
- **Reduced Motion**: Respects user's motion preferences
- **Keyboard Navigation**: Full keyboard accessibility throughout

### 3. Performance Optimized
- **GPU Acceleration**: Transform3d and will-change for smooth animations
- **Efficient Rendering**: Minimal repaints and reflows
- **Progressive Enhancement**: Core functionality works without JavaScript

## Color System

### Neural Palette
Our neutral colors are based on a sophisticated gray scale that works in both light and dark modes:

```css
--neural-50: #f8fafc   /* Lightest */
--neural-100: #f1f5f9
--neural-200: #e2e8f0
--neural-300: #cbd5e1
--neural-400: #94a3b8
--neural-500: #64748b
--neural-600: #475569
--neural-700: #334155
--neural-800: #1e293b
--neural-900: #0f172a
--neural-950: #020617  /* Darkest */
```

### Accent Colors
Vibrant colors inspired by neural networks and electric signals:

#### Electric Blue
- Primary: `#00f5ff` (Dark) / `#0ea5e9` (Light)
- Use for: Primary actions, links, focus states

#### Neural Purple  
- Primary: `#8b5cf6` (Dark) / `#7c3aed` (Light)
- Use for: Secondary actions, highlights

#### Plasma Green
- Primary: `#00ff88` (Dark) / `#059669` (Light)
- Use for: Success states, positive feedback

#### Neural Gold
- Primary: `#fbbf24` (Dark) / `#d97706` (Light)
- Use for: Warnings, attention states

#### Crimson Red
- Primary: `#ef4444` (Dark) / `#dc2626` (Light)
- Use for: Errors, destructive actions

## Typography

### Font Stack
- **Primary**: `Inter` - For all UI text
- **Monospace**: `JetBrains Mono` - For code and technical content
- **Display**: `Inter` - For headings and display text

### Type Scale
We use a fluid type scale that adapts to screen size:

```css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem)
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 1.875rem)
--text-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)
--text-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem)
--text-5xl: clamp(3rem, 2.5rem + 2.5vw, 4rem)
```

### Typography Classes

#### Display Text
```css
.text-display-xl   /* Hero headings */
.text-display-lg   /* Page titles */
.text-display-md   /* Section headers */
.text-display-sm   /* Sub-section headers */
```

#### Headings
```css
.text-heading-xl   /* Major headings */
.text-heading-lg   /* Section headings */
.text-heading-md   /* Component headings */
```

#### Body Text
```css
.text-body-lg      /* Large body text */
.text-body-md      /* Standard body text */
.text-body-sm      /* Small body text */
```

#### Utility
```css
.text-caption      /* Labels, captions */
```

## Spacing System

### Scale
Based on a consistent 4px grid system:

```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
--space-24: 6rem      /* 96px */
--space-32: 8rem      /* 128px */
```

## Border Radius

### Scale
```css
--radius-xs: 0.125rem   /* 2px */
--radius-sm: 0.25rem    /* 4px */
--radius-md: 0.375rem   /* 6px */
--radius-lg: 0.5rem     /* 8px */
--radius-xl: 0.75rem    /* 12px */
--radius-2xl: 1rem      /* 16px */
--radius-3xl: 1.5rem    /* 24px */
--radius-full: 9999px   /* Fully rounded */
```

## Shadows

### Neural Shadows
```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Glow Effects
```css
--glow-electric: 0 0 20px rgba(0, 245, 255, 0.3)
--glow-purple: 0 0 20px rgba(139, 92, 246, 0.3)
--glow-plasma: 0 0 20px rgba(0, 255, 136, 0.3)
--glow-gold: 0 0 20px rgba(251, 191, 36, 0.3)
```

## Animations

### Timing Functions
```css
--ease-linear: linear
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94)
--ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1)
--ease-neural: cubic-bezier(0.645, 0.045, 0.355, 1)
```

### Duration Scale
```css
--duration-75: 75ms
--duration-100: 100ms
--duration-150: 150ms
--duration-200: 200ms
--duration-300: 300ms
--duration-500: 500ms
--duration-700: 700ms
--duration-1000: 1000ms
```

### Animation Classes
```css
.animate-fade-in-up     /* Fade in from bottom */
.animate-fade-in-down   /* Fade in from top */
.animate-scale-in       /* Scale up fade in */
.animate-slide-in-right /* Slide in from right */
.animate-slide-in-left  /* Slide in from left */
.animate-pulse          /* Subtle pulsing */
.animate-float          /* Gentle floating */
.animate-shimmer        /* Loading shimmer */
.animate-neural-pulse   /* Neural network pulse */
```

## Components

### Buttons

#### Variants
- **Primary**: Gradient background, high contrast
- **Secondary**: Glass morphism, subtle
- **Ghost**: Transparent, minimal
- **Danger**: Red gradient, destructive actions

#### Sizes
- **Small**: 32px height, compact spacing
- **Medium**: 40px height, standard spacing
- **Large**: 48px height, generous spacing

#### Usage
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

### Inputs

#### Features
- **Auto-resize**: Textareas grow with content
- **Password Toggle**: Show/hide password visibility
- **Error States**: Clear error indication
- **Focus Ring**: Neural glow on focus

#### Usage
```tsx
<Input
  label="Email"
  type="email"
  required
  error={errors.email}
  onChange={setEmail}
/>
```

### Cards

#### Variants
- **Default**: Standard card styling
- **Glass**: Glass morphism effect
- **Intense**: Higher contrast
- **Neural**: Glowing border effects

#### Usage
```tsx
<Card variant="glass" hover>
  <CardContent>
    Card content here
  </CardContent>
</Card>
```

## Layout

### Grid System
Use CSS Grid for complex layouts, Flexbox for simple ones:

```css
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## Accessibility Guidelines

### Color Contrast
- **Normal Text**: 4.5:1 minimum ratio
- **Large Text**: 3:1 minimum ratio
- **UI Elements**: 3:1 minimum ratio

### Focus Management
- All interactive elements must have visible focus states
- Focus order should be logical and predictable
- Skip links for keyboard navigation

### Screen Readers
- Proper semantic HTML structure
- ARIA labels where needed
- Alt text for images
- Status announcements for dynamic content

### Motion
- Respect `prefers-reduced-motion`
- Essential motion only
- Provide static alternatives

## Best Practices

### Performance
1. Use `transform` and `opacity` for animations
2. Add `will-change` for elements that will animate
3. Remove `will-change` after animation completes
4. Use `transform3d(0,0,0)` for GPU acceleration

### Maintainability
1. Use design tokens instead of hardcoded values
2. Follow the component naming convention
3. Write semantic, accessible HTML
4. Test in multiple browsers and devices

### Development
1. Use TypeScript for all components
2. Write comprehensive prop interfaces
3. Include proper error handling
4. Add loading and empty states

## Code Examples

### Using Design Tokens
```css
.my-component {
  background: var(--bg-glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  color: var(--text-primary);
  transition: all var(--duration-200) var(--ease-out);
}
```

### Neural Effects
```css
.neural-glow {
  position: relative;
}

.neural-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--gradient-neural);
  border-radius: inherit;
  opacity: 0;
  z-index: -1;
  filter: blur(12px);
  transition: opacity var(--duration-300) var(--ease-out);
}

.neural-glow:hover::before {
  opacity: 0.3;
}
```

### Responsive Design
```css
.responsive-component {
  padding: var(--space-2);
  font-size: var(--text-sm);
}

@media (min-width: 768px) {
  .responsive-component {
    padding: var(--space-4);
    font-size: var(--text-base);
  }
}
```

## Tools and Resources

### Design Tools
- **Figma**: For design mockups and prototypes
- **Contrast Checker**: For accessibility compliance
- **Color Palette Generator**: For consistent color schemes

### Development Tools
- **CSS Variables**: For consistent theming
- **PostCSS**: For CSS processing
- **Tailwind CSS**: For utility classes
- **TypeScript**: For type safety

### Testing Tools
- **axe-core**: For accessibility testing
- **Lighthouse**: For performance audits
- **Cross-browser Testing**: For compatibility

---

This style guide should be updated as the design system evolves. Always prioritize accessibility and performance in any changes or additions. 