# Nova AI Frontend

A modern, fully functional AI chat interface built with Next.js, TypeScript, and a neural-inspired design system. Features real-time chat, project management, and seamless backend integration.

## ✨ Features

- 🎨 **Neural Design System** - Futuristic UI with glass morphism and neural gradients
- 🌙 **Dark/Light Mode** - Seamless theme switching with system preference detection
- ⚡ **Real-time Chat** - Streaming AI responses with typing indicators
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🔐 **Authentication** - Secure login/signup with JWT tokens and session management
- 📊 **Project Management** - Create, organize, and manage AI conversation projects
- 🔍 **Search & Filter** - Find conversations and messages quickly
- 🎯 **TypeScript** - Full type safety throughout the application
- 🚀 **Performance Optimized** - GPU-accelerated animations and smart caching
- ♿ **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Custom CSS with neural design system + Tailwind CSS utilities
- **State Management**: React Context API for auth and global state
- **Data Fetching**: Custom API client with automatic token management
- **Forms**: Controlled components with validation
- **Animations**: CSS animations with GPU acceleration
- **Icons**: Custom SVG icons
- **Testing**: Jest + React Testing Library (configured)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+
- Backend API running on port 8000

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
   NEXT_PUBLIC_ENVIRONMENT=development
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── auth/           # Authentication pages (login, signup)
│   │   ├── dashboard/      # Main dashboard and chat interface
│   │   ├── globals.css     # Global styles with neural design system
│   │   ├── layout.tsx      # Root layout with providers
│   │   └── page.tsx        # Landing page with component demos
│   ├── components/         # Reusable components
│   │   ├── ui/            # Basic UI components (Button, Input, Card, etc.)
│   │   ├── auth/          # Authentication components
│   │   ├── chat/          # Chat-related components
│   │   ├── layout/        # Layout components (Header, Sidebar, AppLayout)
│   │   └── projects/      # Project management components
│   ├── contexts/          # React contexts for global state
│   │   ├── AuthContext.tsx # Authentication state management
│   │   └── ToastContext.tsx # Toast notifications
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   └── api.ts         # API client with token management
│   ├── styles/            # Design system and global styles
│   │   └── design-system.css # Neural design tokens and utilities
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # All application types
│   └── utils/             # Utility functions
├── public/                # Static assets
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Design System

### Neural Color Palette

The application uses a sophisticated neural color system:

- **Neural Grays**: 50-950 scale for backgrounds and text
- **Accent Electric**: `#00f5ff` (dark) / `#0ea5e9` (light) - Primary actions
- **Accent Purple**: `#8b5cf6` (dark) / `#7c3aed` (light) - Secondary actions
- **Accent Plasma**: `#00ff88` (dark) / `#059669` (light) - Success states
- **Accent Gold**: `#fbbf24` (dark) / `#d97706` (light) - Warnings
- **Accent Crimson**: `#ef4444` (dark) / `#dc2626` (light) - Errors

### Typography

- **Primary Font**: Inter - Clean, modern sans-serif
- **Monospace Font**: JetBrains Mono - For code and technical content
- **Fluid Type Scale**: Responsive typography using clamp() functions
- **Typography Classes**: `.text-display-xl`, `.text-heading-lg`, `.text-body-md`, etc.

### Components

All components follow neural design principles:

- **Glass Morphism**: Subtle transparency with backdrop blur
- **Neural Shadows**: Layered shadows for natural depth
- **Smooth Animations**: 60fps micro-interactions
- **Consistent Spacing**: 4px grid system
- **Accessibility**: WCAG 2.1 AA compliant

## 🔌 API Integration

The frontend communicates with the backend through a centralized API client (`src/lib/api.ts`):

### Authentication API
- Login/signup with JWT tokens
- Automatic token refresh
- Secure token storage
- User profile management

### Projects API
- CRUD operations for projects
- Project sharing and permissions
- Bulk operations

### Chat API
- Real-time message streaming
- Session management
- Message reactions and editing
- File attachments (planned)

### Error Handling
- Consistent error responses
- Automatic retry logic
- User-friendly error messages
- Network failure handling

## 🔐 Authentication Flow

1. **Login/Signup**: User enters credentials
2. **Token Storage**: JWT tokens stored securely
3. **Auto-refresh**: Tokens refreshed automatically
4. **Protected Routes**: Automatic redirect to login if unauthenticated
5. **Logout**: Clean token removal and redirect

## 💬 Chat Features

### Real-time Messaging
- Streaming AI responses
- Typing indicators
- Message status indicators
- Auto-scroll to latest messages

### Message Management
- Message reactions
- Message deletion
- Message editing (planned)
- Message search (planned)

### Session Management
- Multiple chat sessions per project
- Session persistence
- Session history
- Session sharing (planned)

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1920px

### Mobile Features
- Touch-optimized interface
- Swipe gestures
- Mobile-first design
- Optimized performance

## 🎭 Theming

### Dark Mode (Default)
- Neural dark backgrounds
- High contrast text
- Vibrant accent colors
- Reduced eye strain

### Light Mode
- Clean white backgrounds
- Adjusted accent colors
- Maintained contrast ratios
- Professional appearance

### System Integration
- Automatic theme detection
- Smooth theme transitions
- Persistent theme preference
- CSS variable-based theming

## 🚀 Performance

### Optimization Techniques
- Code splitting with Next.js
- Image optimization
- GPU-accelerated animations
- Efficient re-rendering
- Smart caching strategies

### Bundle Analysis
```bash
npm run build
npm run analyze
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion support
- Focus management
- ARIA labels and roles

### Testing
```bash
npm run test:a11y
```

## 🧪 Testing

### Unit Tests
- Component testing with React Testing Library
- Hook testing
- Utility function testing
- API client testing

### Integration Tests
- User flow testing
- API integration testing
- Authentication flow testing

### E2E Tests (Planned)
- Full user journey testing
- Cross-browser testing
- Performance testing

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables
Set these for production:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Deployment Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** containers

## 🔧 Development Guidelines

### Component Structure
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.module.css # Component styles
├── ComponentName.test.tsx # Tests
└── index.ts              # Barrel export
```

### Styling Guidelines
- Use CSS variables for theming
- Follow neural design system
- Implement responsive design
- Add hover and focus states
- Use GPU-accelerated animations

### TypeScript Guidelines
- Strict TypeScript configuration
- Proper interface definitions
- Type-safe API responses
- Avoid `any` type

### Performance Guidelines
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Minimize bundle size

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   npm run dev
   ```

2. **API connection issues**
   - Check backend is running on port 8000
   - Verify environment variables
   - Check network connectivity

3. **Build errors**
   ```bash
   rm -rf .next
   npm run build
   ```

4. **Type errors**
   ```bash
   npm run type-check
   ```

## 🤝 Contributing

1. Follow the component structure guidelines
2. Write tests for new components
3. Use TypeScript strictly
4. Follow the neural design system
5. Test on multiple screen sizes
6. Ensure accessibility compliance

## 📄 License

MIT License - see LICENSE file for details 

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the component documentation
3. Check the API integration guide
4. Create an issue with detailed information 