# ChatGPT-like AI Assistant Frontend

This is a modern Next.js frontend for an AI Assistant with a ChatGPT-like interface. It features a clean, elegant UI that focuses on conversation and provides a seamless user experience.

## Features

- **Elegant Chat Interface** - Clean and modern design inspired by OpenAI's ChatGPT
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Dark Mode Support** - Automatic dark mode detection with appropriate styling
- **Accessible UI Components** - Built with accessibility in mind
- **Reusable UI Library** - Modular component system for consistent design

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

The frontend follows a clean architecture pattern with the following structure:

### Component Structure

```
frontend/
├── app/               # Next.js App Router pages
│   ├── dashboard/     # Dashboard and chat pages
│   ├── login/         # Authentication pages
│   └── signup/        # User registration
├── components/        # Reusable React components
│   ├── auth/          # Authentication components
│   ├── bot/           # Bot configuration components
│   ├── chat/          # Chat interface components
│   ├── layout/        # Layout components
│   └── ui/            # Base UI components
├── contexts/          # React context providers
├── public/            # Static assets
└── utils/             # Utility functions
```

### UI Component Library

The UI components are designed to be modular and reusable, with a consistent styling system. Key components include:

- **Button** - Various button styles with support for icons, loading state, and different sizes
- **Input** - Text input with support for icons, validation, and consistent styling
- **Spinner** - Loading indicator with customizable size and color
- **ChatInterface** - The main chat interface component with message bubbles, typing indicators, and copy functionality

## Design Principles

The design follows these key principles:

1. **Simplicity** - Clean, minimalist interface that focuses on content
2. **Consistency** - Uniform spacing, colors, and interaction patterns
3. **Accessibility** - Proper contrast, keyboard navigation, and screen reader support
4. **Responsiveness** - Adapts to different screen sizes with appropriate layouts
5. **Performance** - Optimized for fast loading and smooth interactions

## ChatGPT-like Features

The chat interface includes these ChatGPT-like features:

- Distinct visual styling for user and AI messages
- Typing indicator during response generation
- Copy-to-clipboard functionality for AI responses
- Timestamp display for messages
- Message bubbles with avatar icons for improved identification
- Welcome message to initiate conversation

## Customization

You can customize the appearance by editing the following files:

- `app/globals.css` - Global CSS variables and base styles
- `components/ui/*` - UI component definitions and styling
- `tailwind.config.js` - Tailwind CSS configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
