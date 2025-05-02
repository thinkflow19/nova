# Nova UI Components

This directory contains reusable UI components for the Nova application, following the design system and style guidelines.

## Components

### Button

A flexible button component with multiple variants, sizes and states.

```tsx
import { Button } from '../components/ui';

// Primary button (default)
<Button onClick={handleClick}>Click Me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Loading state
<Button isLoading={true}>Saving...</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Card

A container component for grouping related content.

```tsx
import { Card } from '../components/ui';

// Basic usage
<Card>
  <h2 className="text-xl font-semibold mb-4">Card Title</h2>
  <p>Card content goes here...</p>
</Card>

// With hover effect
<Card hoverable>
  <h2 className="text-xl font-semibold mb-4">Hoverable Card</h2>
  <p>This card has a hover effect.</p>
</Card>

// With custom className
<Card className="bg-gray-50">
  <p>Card with custom background</p>
</Card>
```

### Toast

A notification component to display success, error, or info messages.

```tsx
import { Toast } from '../components/ui';
import { useState } from 'react';

// In your component
const [showToast, setShowToast] = useState(false);

// Render conditionally
{showToast && (
  <Toast 
    message="Action completed successfully!"
    variant="success"
    duration={3000}
    onClose={() => setShowToast(false)}
  />
)}

// Error toast
<Toast 
  message="Something went wrong. Please try again."
  variant="error"
/>

// Info toast
<Toast 
  message="Please complete all required fields."
  variant="info"
/>
```

### Spinner

A loading indicator component.

```tsx
import { Spinner } from '../components/ui';

// Default spinner
<Spinner />

// Different sizes
<Spinner size="sm" />
<Spinner size="md" /> // default
<Spinner size="lg" />

// With custom className
<Spinner className="text-red-500" />
```

### FileUpload

A drag-and-drop file upload component.

```tsx
import { FileUpload } from '../components/ui';

// Basic usage
<FileUpload onUpload={handleFilesUpload} />

// With loading state
<FileUpload 
  onUpload={handleFilesUpload}
  isLoading={uploading}
/>

// With custom accept types
<FileUpload 
  onUpload={handleFilesUpload}
  accept={{
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc', '.docx']
  }}
  maxFiles={5}
  maxSize={5242880} // 5MB
  label="Drop your documents here or click to browse"
/>
```

## Style Guide Summary

- Use TailwindCSS utility classes for styling
- Buttons use rounded corners (rounded-lg) with smooth hover transitions
- Follow a clean, modern SaaS visual style like Linear, Notion, or Vercel
- Cards used for displaying major components (bots, file uploads, etc.)
- Mobile responsive design using Tailwind breakpoints
- Proper loading states using spinner component
- No confetti animations
- Simple, elegant toast notifications for success/error states
- Brand color is customizable by users and applied dynamically

## Accessibility

All components include proper ARIA attributes and support keyboard navigation. 