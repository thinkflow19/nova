# Nova UI/UX Style Guide

## Overview

Nova follows a professional, clean, modern SaaS visual style with a focus on minimalistic, whitespace-heavy design like Linear, Notion, or Vercel.

## Core Principles

- **Simplicity**: Clean, uncluttered interfaces
- **Whitespace**: Generous spacing to improve readability and focus
- **Responsiveness**: All interfaces adapt perfectly to any screen size
- **Performance**: Fast loading times and smooth transitions
- **Accessibility**: Basic accessibility support via ARIA labels and keyboard navigation

## Colors

- **Background**: Light gray (#f9fafb)
- **Text**: Dark gray (#111827)
- **Brand**: User-selected color with a calculated darker variant for hover states
- **Accent**: Used sparingly for highlighting important UI elements

## Typography

- **Base Font**: Inter, system-ui
- **Sizes**:
  - Headings: text-2xl (24px), text-xl (20px), text-lg (18px)
  - Body: text-base (16px)
  - Small/Meta: text-sm (14px), text-xs (12px)

## Components

### Cards

Use the `Card` component for:
- Bot listings
- File upload zones
- Settings panels
- Information containers

```tsx
import { Card } from '../components/ui';

<Card>Content goes here</Card>
<Card hoverable>Cards can have hover effects</Card>
```

### Buttons

Buttons have rounded corners (rounded-lg) and smooth hover animations (250ms transitions).

```tsx
import { Button } from '../components/ui';

<Button>Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button isLoading={true}>Loading State</Button>
```

### Loading States

Always visualize loading states using the Spinner component:

```tsx
import { Spinner } from '../components/ui';

<Spinner />
<Spinner size="lg" />
```

### Forms

- Center forms vertically and horizontally on standalone pages
- Use proper spacing between form elements
- Include clear validation messages

### File Uploads

Use the FileUpload component with dropzone functionality:

```tsx
import { FileUpload } from '../components/ui';

<FileUpload onUpload={handleUpload} />
```

### Notifications

Use the Toast component for success/error notifications:

```tsx
import { Toast } from '../components/ui';

<Toast message="Operation completed successfully" variant="success" />
```

## Animations and Transitions

- **Page Transitions**: Subtle fade-in or slide-in effects
- **Button Hover**: Smooth transitions (250ms)
- **NO Confetti**: Per requirements, no confetti animations are used

## Responsive Design

Use Tailwind breakpoints consistently:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## Branding Options

Users can customize their chatbot's brand color in the bot settings. This color is applied automatically throughout the bot interface.

## Accessibility Guidelines

- Always include alt text for images
- Use semantic HTML elements (button, nav, article, etc.)
- Ensure proper color contrast (at least 4.5:1 for normal text)
- Include ARIA labels for interactive elements
- Support keyboard navigation

## Implementation

Use Tailwind CSS utility classes for all frontend styling:

```tsx
// Primary heading
<h1 className="text-2xl font-semibold text-gray-900">Title</h1>

// Card example
<div className="bg-white rounded-lg shadow-sm p-6">
  {/* Content */}
</div>

// Button example
<button className="rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand-dark transition-all duration-250">
  Click Me
</button>
``` 