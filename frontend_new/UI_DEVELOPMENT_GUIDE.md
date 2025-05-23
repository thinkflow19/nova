# Nova Frontend UI Development Guide

## Overview
Nova is a modern web application built with Next.js, TypeScript, and Tailwind CSS. This guide serves as a comprehensive reference for UI development, component usage, and styling guidelines.

## Core UI Components

### Layout Components
- `NavBar`: Main navigation component with responsive design
- `Footer`: Site-wide footer with links and information
- `GlassCard`: Reusable glass-morphism card component for content containers
- `Card`: Standard card component for content display

### Interactive Components
- `Button`: Primary button component with variants
- `CustomButton`: Extended button component with additional styling options
- `Input`: Form input component with validation support
- `AutoResizeTextarea`: Self-adjusting textarea for dynamic content
- `ThemeToggle`: Dark/light mode switcher
- `LoadingSpinner` & `Loader`: Loading state indicators

### Content Components
- `HeroSection`: Landing page hero component
- `FeaturesSection`: Product features display
- `HowItWorks`: Process explanation section
- `TestimonialSlider`: Customer testimonials carousel
- `FAQAccordion`: Expandable FAQ section
- `WhyChooseUs`: Value proposition section
- `LogosSection`: Partner/client logos display
- `FinalCTA`: Call-to-action section

### Chat Components
- `ChatMessage`: Message display component for chat interface

## Styling Guidelines

### Theme System
The application uses a dual-theme system (light/dark) with the following key characteristics:
- CSS variables for color schemes
- Tailwind CSS for utility classes
- Custom CSS for complex components
- Glass-morphism effects for modern UI
- Responsive design patterns

### Color Palette
```css
--primary: #2563eb
--secondary: #4f46e5
--accent: #06b6d4
--background: #ffffff (light) / #0f172a (dark)
--text: #1e293b (light) / #e2e8f0 (dark)
```

### Typography
- Font Family: Inter (Primary), SF Pro Display (Secondary)
- Scale:
  - Headings: 2rem - 4rem
  - Body: 1rem - 1.25rem
  - Small: 0.875rem

### Spacing System
- Base unit: 0.25rem (4px)
- Common spacings: 0.5rem, 1rem, 1.5rem, 2rem, 4rem

## Component Best Practices

### Button Usage
```tsx
<Button 
  variant="primary|secondary|outline|ghost"
  size="sm|md|lg"
  onClick={handleClick}
>
  Button Text
</Button>
```

### Card Implementation
```tsx
<GlassCard
  className="p-6 backdrop-blur-lg"
  variant="light|dark"
>
  Content
</GlassCard>
```

### Form Inputs
```tsx
<Input
  type="text|email|password"
  placeholder="Enter value"
  error={errorMessage}
  onChange={handleChange}
/>
```

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1280px

### Media Query Usage
```css
@media (min-width: 640px) { /* Tablet styles */ }
@media (min-width: 1024px) { /* Desktop styles */ }
@media (min-width: 1280px) { /* Large Desktop styles */ }
```

## Animation Guidelines

### Transitions
- Duration: 150ms - 300ms
- Timing: ease-in-out
- Common properties: opacity, transform, background-color

### Hover Effects
- Scale: 1.02 - 1.05
- Shadow increase
- Color shifts
- Smooth transitions

## Performance Considerations

### Image Optimization
- Use Next.js Image component
- Implement lazy loading
- Optimize for WebP format
- Use appropriate sizes

### Component Loading
- Implement code splitting
- Use dynamic imports
- Lazy load below-fold content

## Accessibility Guidelines

### Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA labels
- Color contrast ratios

### Implementation
```tsx
// Example of accessible button
<Button
  aria-label="Submit form"
  role="button"
  tabIndex={0}
>
  Submit
</Button>
```

## Known Issues & Improvements

### Current Issues
1. Theme toggle inconsistency between .tsx and .jsx implementations
2. Duplicate loading components (LoadingSpinner vs Loader)
3. Inconsistent button styling across components
4. Non-optimized images in LogosSection
5. Mobile navigation menu accessibility issues

### Planned Improvements
1. Unify theme toggle implementation
2. Consolidate loading components
3. Standardize button component usage
4. Implement image optimization
5. Enhance mobile navigation accessibility
6. Add animation library for smoother transitions
7. Implement skeleton loading states
8. Add error boundary components
9. Enhance form validation feedback
10. Improve dark mode color contrast

## Development Workflow

### Component Creation
1. Create component in appropriate directory
2. Add TypeScript types/interfaces
3. Implement component logic
4. Add styling (Tailwind + custom CSS if needed)
5. Add documentation
6. Test across breakpoints
7. Validate accessibility

### Style Updates
1. Update global styles in globals.css
2. Component-specific styles in custom-styles.css
3. Use CSS variables for theme values
4. Follow BEM methodology for custom classes
5. Maintain responsive design patterns

## Testing Guidelines

### Component Testing
- Unit tests for logic
- Snapshot tests for UI
- Accessibility tests
- Cross-browser testing
- Responsive design testing

### Visual Regression
- Compare component screenshots
- Test dark/light modes
- Test responsive breakpoints
- Validate animations

## Documentation Requirements

### Component Documentation
- Props interface
- Usage examples
- Styling variants
- Accessibility notes
- Known limitations

### Style Documentation
- Color usage
- Typography scale
- Spacing system
- Animation guidelines
- Responsive patterns 