# Nova AI Frontend

A modern, clean AI chat interface built with Next.js, TypeScript, and Tailwind CSS. Designed to be similar to ChatGPT and Gemini with enhanced features and neural design system.

## Features

- 🎨 **Modern Neural Design System** - Clean, professional interface with glass morphism effects
- 🌙 **Dark/Light Mode** - Seamless theme switching with system preference detection
- ⚡ **Real-time Chat** - Streaming responses with typing indicators
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🔐 **Authentication** - Secure login/signup with JWT tokens
- 📊 **Project Management** - Organize conversations into projects
- 🔍 **Search & Filter** - Find conversations and messages quickly
- 🎯 **TypeScript** - Full type safety throughout the application
- 🚀 **Performance Optimized** - Fast loading with code splitting and optimization

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom neural design system
- **State Management**: Zustand for global state
- **Data Fetching**: React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Heroicons
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=Nova AI
   NEXT_PUBLIC_APP_DESCRIPTION=Next-generation AI Chat Interface
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard and chat interface
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable components
│   │   ├── ui/            # Basic UI components
│   │   ├── auth/          # Authentication components
│   │   ├── chat/          # Chat-related components
│   │   ├── layout/        # Layout components
│   │   └── projects/      # Project management components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   └── api.ts         # API client
│   ├── store/             # Zustand stores
│   │   ├── auth.ts        # Authentication state
│   │   └── projects.ts    # Project state
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── styles/            # Additional styles
├── public/                # Static assets
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies and scripts
```

## Design System

### Colors

The application uses a neural color palette with accent colors:

- **Neural**: 50-950 scale for backgrounds and text
- **Accent Primary**: Blue (#3b82f6)
- **Accent Secondary**: Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)

### Components

All components follow the neural design principles:

- **Glass Morphism**: Subtle transparency effects
- **Neural Shadows**: Soft, natural shadows
- **Smooth Animations**: 60fps micro-interactions
- **Consistent Spacing**: 4px grid system
- **Typography**: Inter font family with proper hierarchy

### Responsive Design

- **Mobile First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexible Layouts**: CSS Grid and Flexbox for adaptive layouts

## API Integration

The frontend communicates with the backend through a centralized API client (`src/lib/api.ts`) that handles:

- **Authentication**: Login, signup, token refresh
- **Projects**: CRUD operations for projects
- **Chat**: Sessions, messages, and completions
- **Error Handling**: Consistent error responses
- **Token Management**: Automatic token storage and refresh

## State Management

### Authentication State (Zustand)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // ... other methods
}
```

### Project State (Zustand)

```typescript
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (project: ProjectCreate) => Promise<Project>;
  // ... other methods
}
```

## Development Guidelines

### Component Structure

Each component follows this structure:
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests
├── styles.module.css      # Component-specific styles
└── index.ts              # Barrel export
```

### Styling Guidelines

- Use Tailwind CSS classes for styling
- Follow the neural design system
- Use CSS modules for component-specific styles
- Implement both dark and light theme variants
- Add hover and focus states for interactive elements

### TypeScript Guidelines

- Use strict TypeScript configuration
- Define interfaces for all props and state
- Use proper typing for API responses
- Avoid `any` type - use proper types or `unknown`

### Performance Guidelines

- Use React.memo for expensive components
- Implement proper loading states
- Use React Query for server state caching
- Optimize images with Next.js Image component
- Implement code splitting for large components

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Set the following environment variables for production:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Deployment Platforms

The application can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** containers

## Contributing

1. Follow the component structure guidelines
2. Write tests for new components
3. Use TypeScript strictly
4. Follow the neural design system
5. Test on multiple screen sizes
6. Ensure accessibility compliance

## License

MIT License - see LICENSE file for details 