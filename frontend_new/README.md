# Nova.ai Premium Frontend

A luxurious, intuitive SaaS web application for building AI agents for task and coding automation.

## 🚀 Features

- Modern, premium UI with Apple-inspired design principles
- Responsive layout for all device sizes
- Framer Motion animations for enhanced user experience
- Dark mode by default with high-contrast, accessible design
- Component-based architecture for easy maintenance
- Supabase authentication for secure user management

## 🧱 Tech Stack

- **Framework**: React with Next.js
- **Styling**: Tailwind CSS with custom theme
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Satoshi, Inter, JetBrains Mono
- **Authentication**: Supabase Auth

## 🛠️ Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-repo/nova.git
cd nova/frontend_new
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
# Create a .env.local file with the following variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Supabase Authentication Setup

### Creating a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Create a new project
3. Navigate to the "Settings" icon in the sidebar
4. Go to "API" in the settings menu
5. Copy your Project URL and anon/public key

### Enabling Authentication Methods

1. In your Supabase dashboard, go to "Authentication" > "Providers"
2. Enable "Email" authentication
3. Configure additional providers as needed (Google, GitHub, etc.)

### User Management

- Create test users in the "Authentication" > "Users" section
- You can use these users to test your application

## 🧩 Directory Structure

```
frontend_new/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Next.js pages
│   ├── styles/        # Global styles and Tailwind configuration
│   ├── utils/         # Utility functions
│   │   ├── auth.js    # Authentication utilities using Supabase
│   │   ├── supabase.js # Supabase client setup
│   │   └── api.js     # API functions for backend communication
│   └── assets/        # Static assets like images and icons
├── public/            # Static files served by Next.js
└── package.json       # Project dependencies and scripts
```

## 🎨 Design System

The UI follows a premium design system with:

- **Colors**: Dark theme with indigo accent
- **Typography**: Clean, modern typefaces with proper hierarchy
- **Spacing**: Consistent spacing and layout grid
- **Animation**: Purposeful, subtle animations for feedback
- **Components**: Card, button, input, and other reusable UI patterns

## 🔄 Component Usage

### Basic Layout Components

```jsx
// Example usage in a new page
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function YourPage() {
  return (
    <>
      <NavBar />
      <main className="container py-24">
        {/* Your page content */}
      </main>
      <Footer />
    </>
  );
}
```

### Authentication in Components

```jsx
// Example of a protected component
import { useAuth } from '../utils/auth';

export default function ProtectedComponent() {
  const { user, loading } = useAuth({ redirectTo: '/login' });
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {/* Protected content */}
    </div>
  );
}
```

### UI Components

See individual component files for props and implementation details.

## 📱 Responsive Design

The UI is built with a mobile-first approach and includes:

- Responsive navigation (mobile menu)
- Grid layouts that adjust based on screen size
- Proper spacing adjustments for different devices
- Touch-friendly controls for mobile users

## 🔧 Customization

To customize the theme colors, edit `tailwind.config.js`:

```js
// Example: Change the accent color
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        accent: '#4F46E5', // Change to your preferred color
        // ...
      }
    }
  }
}
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 