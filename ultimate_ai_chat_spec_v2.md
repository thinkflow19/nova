# Ultimate AI Chat Interface - Enhanced Technical Specification v2.0

## 🎯 Project Overview
Build a next-generation AI chat interface that combines project management, document processing, and conversational AI in a visually stunning, highly addictive user experience that surpasses ChatGPT, Claude, and Google Gemini.

## 📋 Core Requirements Summary

### Primary Features
- **Project/Agent Management System** - Visual project cards with CRUD operations
- **Advanced Chat Interface** - Real-time messaging with rich media support
- **Document Ingestion System** - Drag-and-drop file processing with progress tracking
- **Dual Theme System** - Sophisticated dark mode (primary) and elegant light mode
- **Progressive Web App** - Mobile-first responsive design with offline capabilities

### Performance Targets
- **Load Time**: < 1.5 seconds initial page load
- **Animation Performance**: Consistent 60 FPS with GPU acceleration
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Performance**: 95+ Lighthouse scores across all categories

## 🎨 Enhanced Design System Specification

### Addictive Color Palettes

#### Dark Mode - "Neural Dopamine" (Primary Theme)
```css
:root[data-theme="dark"] {
  /* Background Layers - Deep Neural Network Inspired */
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-tertiary: #1a1a24;
  --bg-quaternary: #232332;
  --bg-glass: rgba(17, 17, 24, 0.85);
  --bg-overlay: rgba(0, 0, 0, 0.75);

  /* Dopamine-Triggering Accent Colors */
  --accent-electric: #00f5ff;        /* Cyan spark */
  --accent-purple: #8b5cf6;          /* Royal purple */
  --accent-plasma: #00ff88;          /* Neon green */
  --accent-gold: #ffb800;            /* Amber glow */
  --accent-crimson: #ff3366;         /* Energy red */
  --accent-sapphire: #0066ff;        /* Deep blue */
  
  /* Text Colors with Enhanced Contrast */
  --text-primary: #ffffff;
  --text-secondary: #e4e4e9;
  --text-tertiary: #b8b8c3;
  --text-muted: #8a8a96;
  --text-disabled: #5c5c68;

  /* Interactive States - Micro-dopamine Hits */
  --hover-overlay: rgba(0, 245, 255, 0.12);
  --active-overlay: rgba(0, 245, 255, 0.25);
  --focus-ring: rgba(0, 245, 255, 0.4);
  --selected-overlay: rgba(139, 92, 246, 0.15);

  /* Addictive Gradients */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #00f5ff 50%, #00ff88 100%);
  --gradient-secondary: linear-gradient(135deg, #ff3366 0%, #ffb800 100%);
  --gradient-tertiary: linear-gradient(135deg, #0066ff 0%, #8b5cf6 100%);
  --gradient-neural: linear-gradient(45deg, #00f5ff 0%, #8b5cf6 25%, #00ff88 50%, #ffb800 75%, #ff3366 100%);
  --gradient-subtle: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(0, 245, 255, 0.04) 100%);
  
  /* Status Colors */
  --success: #00ff88;
  --warning: #ffb800;
  --error: #ff3366;
  --info: #00f5ff;

  /* Glass Morphism Enhanced */
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.02);
}
```

#### Light Mode - "Dopamine Daylight" (Secondary Theme)
```css
:root[data-theme="light"] {
  /* Background Layers - Clean but Engaging */
  --bg-primary: #fafbfc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f8f9fa;
  --bg-quaternary: #f1f3f4;
  --bg-glass: rgba(255, 255, 255, 0.92);
  --bg-overlay: rgba(255, 255, 255, 0.85);

  /* Vibrant but Professional Accents */
  --accent-electric: #0ea5e9;        /* Sky blue */
  --accent-purple: #7c3aed;          /* Violet */
  --accent-plasma: #10b981;          /* Emerald */
  --accent-gold: #f59e0b;            /* Amber */
  --accent-crimson: #ef4444;         /* Red */
  --accent-sapphire: #3b82f6;        /* Blue */
  
  /* Text Colors with Perfect Readability */
  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  --text-disabled: #cbd5e1;

  /* Interactive States */
  --hover-overlay: rgba(14, 165, 233, 0.08);
  --active-overlay: rgba(14, 165, 233, 0.16);
  --focus-ring: rgba(14, 165, 233, 0.24);
  --selected-overlay: rgba(124, 58, 237, 0.12);

  /* Light Mode Gradients */
  --gradient-primary: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 50%, #10b981 100%);
  --gradient-secondary: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
  --gradient-tertiary: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%);
  --gradient-neural: linear-gradient(45deg, #0ea5e9 0%, #7c3aed 25%, #10b981 50%, #f59e0b 75%, #ef4444 100%);
  --gradient-subtle: linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(14, 165, 233, 0.02) 100%);
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #0ea5e9;

  /* Glass Morphism for Light */
  --glass-border: rgba(0, 0, 0, 0.04);
  --glass-highlight: rgba(255, 255, 255, 0.8);
}
```

### Typography System - Enhanced for Engagement
```css
/* Premium Font Stack */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
  --font-display: 'Inter', system-ui, sans-serif;

  /* Enhanced Type Scale */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
}
```

### Spacing & Layout System
```css
:root {
  /* Refined Spacing Scale */
  --space-px: 1px;
  --space-0: 0;
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-32: 8rem;       /* 128px */

  /* Border Radius Scale */
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-base: 0.375rem; /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-3xl: 2rem;     /* 32px */
  --radius-full: 9999px;

  /* Enhanced Shadow System */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  
  /* Addictive Glow Effects */
  --shadow-glow-electric: 0 0 20px rgba(0, 245, 255, 0.4);
  --shadow-glow-purple: 0 0 20px rgba(139, 92, 246, 0.4);
  --shadow-glow-plasma: 0 0 20px rgba(0, 255, 136, 0.4);
  --shadow-glow-gold: 0 0 20px rgba(255, 184, 0, 0.4);
  --shadow-glow-crimson: 0 0 20px rgba(255, 51, 102, 0.4);
}
```

## 🏗 Enhanced Architecture & File Structure

```
src/
├── components/
│   ├── ui/                     # Base UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Tooltip/
│   │   ├── Dropdown/
│   │   ├── Tabs/
│   │   ├── Progress/
│   │   └── index.ts
│   ├── chat/                   # Chat-specific components
│   │   ├── ChatInterface/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatInterface.module.css
│   │   │   ├── ChatInterface.test.tsx
│   │   │   └── index.ts
│   │   ├── MessageBubble/
│   │   ├── InputArea/
│   │   ├── TypingIndicator/
│   │   ├── MessageThread/
│   │   ├── VoiceRecorder/
│   │   ├── CodeHighlighter/
│   │   └── index.ts
│   ├── project/                # Project management
│   │   ├── ProjectCard/
│   │   ├── ProjectGrid/
│   │   ├── ProjectModal/
│   │   ├── ProjectStats/
│   │   └── index.ts
│   ├── document/               # Document handling
│   │   ├── DocumentUpload/
│   │   ├── DocumentPreview/
│   │   ├── ProcessingStatus/
│   │   ├── DocumentViewer/
│   │   └── index.ts
│   ├── layout/                 # Layout components
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   ├── MainContent/
│   │   ├── Navigation/
│   │   └── index.ts
│   └── effects/                # Visual effects
│       ├── ParticleSystem/
│       ├── GlassMorphism/
│       ├── GradientMesh/
│       └── index.ts
├── hooks/                      # Custom React hooks
│   ├── useChat.ts
│   ├── useProjects.ts
│   ├── useDocuments.ts
│   ├── useTheme.ts
│   ├── useAnimations.ts
│   ├── useKeyboard.ts
│   ├── useWebSocket.ts
│   └── useVirtualization.ts
├── stores/                     # State management (Zustand)
│   ├── chatStore.ts
│   ├── projectStore.ts
│   ├── documentStore.ts
│   ├── themeStore.ts
│   ├── settingsStore.ts
│   └── index.ts
├── utils/                      # Utility functions
│   ├── animations.ts
│   ├── api.ts
│   ├── storage.ts
│   ├── validation.ts
│   ├── performance.ts
│   └── accessibility.ts
├── styles/                     # Global styles
│   ├── globals.css
│   ├── animations.css
│   ├── components.css
│   ├── themes.css
│   └── utilities.css
├── types/                      # TypeScript definitions
│   ├── chat.ts
│   ├── project.ts
│   ├── document.ts
│   ├── ui.ts
│   └── common.ts
└── constants/                  # App constants
    ├── routes.ts
    ├── config.ts
    └── index.ts
```

## 🎭 Advanced Animation System

### GPU-Accelerated Animation Library
```css
/* Performance-First Easing Functions */
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-in-out-quint: cubic-bezier(0.86, 0, 0.07, 1);
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Core Animations - GPU Accelerated */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale3d(0.9, 0.9, 1);
  }
  to {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translate3d(30px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translate3d(-30px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -8px, 0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes neuralPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
  }
}

/* Utility Animation Classes */
.animate-fade-in-up {
  animation: fadeInUp 0.6s var(--ease-out-quart) both;
}

.animate-fade-in-down {
  animation: fadeInDown 0.6s var(--ease-out-quart) both;
}

.animate-scale-in {
  animation: scaleIn 0.4s var(--ease-out-back) both;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s var(--ease-out-quad) both;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s var(--ease-out-quad) both;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-shimmer {
  animation: shimmer 2s linear infinite;
}

.animate-neural-pulse {
  animation: neuralPulse 3s ease-in-out infinite;
}

/* Stagger Animation Delays */
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }

/* Performance Optimizations */
.gpu-accelerated {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

.will-change-transform {
  will-change: transform;
}

.will-change-opacity {
  will-change: opacity;
}
```

## 🧩 Enhanced Component Specifications

### 1. Chat Interface Component
```typescript
// /components/chat/ChatInterface/ChatInterface.tsx
interface ChatInterfaceProps {
  projectId?: string;
  className?: string;
  height?: string | number;
  onMessageSent?: (message: Message) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'streaming';
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  threadId?: string;
  parentId?: string;
}

interface MessageMetadata {
  tokens?: number;
  model?: string;
  temperature?: number;
  processingTime?: number;
  citations?: Citation[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}
```

### 2. Enhanced Message Bubble Component
```css
/* MessageBubble.module.css */
.messageBubble {
  @apply relative p-4 mb-4 rounded-2xl;
  @apply animate-fade-in-up gpu-accelerated;
  transition: all 0.2s var(--ease-out-quad);
}

.userMessage {
  @apply ml-auto mr-4 max-w-4xl;
  background: var(--gradient-primary);
  color: white;
  border-bottom-right-radius: 8px;
}

.userMessage:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-electric);
}

.assistantMessage {
  @apply mr-auto ml-4 max-w-4xl;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg);
}

.assistantMessage:hover {
  background: rgba(17, 17, 24, 0.95);
  border-color: var(--accent-electric);
}

.messageContent {
  @apply text-base leading-relaxed;
}

.messageMetadata {
  @apply flex items-center justify-between mt-3 pt-3;
  @apply text-xs text-gray-400 border-t border-gray-700;
}

.typingAnimation {
  @apply flex space-x-1;
}

.typingDot {
  @apply w-2 h-2 bg-gray-400 rounded-full;
  animation: pulse 1.4s ease-in-out infinite;
}

.typingDot:nth-child(1) { animation-delay: -0.32s; }
.typingDot:nth-child(2) { animation-delay: -0.16s; }
.typingDot:nth-child(3) { animation-delay: 0s; }
```

### 3. Advanced Input Area Component
```typescript
interface InputAreaProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onVoiceRecording?: (audioBlob: Blob) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  supportedFileTypes?: string[];
  disabled?: boolean;
}

// Features to implement:
// - Auto-expanding textarea with smooth height transitions
// - Real-time character/token counter
// - Drag & drop file upload with preview
// - Voice recording with waveform visualization
// - Emoji picker with recent/frequent tracking
// - Keyboard shortcuts (Cmd/Ctrl + Enter to send)
// - Smart text formatting suggestions
// - Command palette for quick actions (/help, /clear, etc.)
```

## 🎨 Advanced Visual Effects

### Glass Morphism System 2.0
```css
.glass-morphism {
  background: var(--bg-glass);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 var(--glass-highlight);
}

.glass-morphism-intense {
  background: var(--bg-glass);
  backdrop-filter: blur(40px) saturate(200%) contrast(120%);
  -webkit-backdrop-filter: blur(40px) saturate(200%) contrast(120%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

/* Neural Network Gradient Mesh Background */
.neural-gradient-mesh {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  background: 
    radial-gradient(circle at 20% 80%, var(--accent-electric) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, var(--accent-purple) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, var(--accent-plasma) 0%, transparent 50%),
    linear-gradient(135deg, transparent 0%, var(--accent-gold) 100%);
  animation: float 20s ease-in-out infinite;
}
```

### Interactive Particle System
```typescript
// /components/effects/ParticleSystem/ParticleSystem.tsx
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

class NeuralParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mouse: { x: number; y: number } = { x: 0, y: 0 };
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
    this.setupEventListeners();
  }

  private init() {
    // Create 80-120 particles for smooth performance
    const particleCount = Math.min(100, Math.max(50, window.innerWidth / 20));
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: this.getRandomColor(),
        life: Math.random() * 1000 + 500,
        maxLife: 1000
      });
    }
  }

  private getRandomColor(): string {
    const colors = [
      'rgba(0, 245, 255, 0.6)',    // Electric
      'rgba(139, 92, 246, 0.6)',   // Purple
      'rgba(0, 255, 136, 0.6)',    // Plasma
      'rgba(255, 184, 0, 0.6)'     // Gold
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  public render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach((particle, index) => {
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      // Boundaries
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      // Mouse interaction
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.vx += dx * force * 0.01;
        particle.vy += dy * force * 0.01;
      }

      // Render particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.opacity * (particle.life / particle.maxLife);
      this.ctx.fill();

      // Connect nearby particles
      this.particles.forEach((otherParticle, otherIndex) => {
        if (index !== otherIndex) {
          const dx2 = particle.x - otherParticle.x;
          const dy2 = particle.y - otherParticle.y;
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          if (distance2 < 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.strokeStyle = `rgba(0, 245, 255, ${0.1 * (1 - distance2 / 80)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      });

      // Regenerate dead particles
      if (particle.life <= 0) {
        this.particles[index] = {
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: this.getRandomColor(),
          life: Math.random() * 1000 + 500,
          maxLife: 1000
        };
      }
    });

    this.animationId = requestAnimationFrame(() => this.render());
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
```

## 📱 Advanced Responsive Design System

### Breakpoint System 2.0
```css
:root {
  /* Enhanced Breakpoints */
  --breakpoint-xs: 375px;    /* Small phones */
  --breakpoint-sm: 640px;    /* Large phones */
  --breakpoint-md: 768px;    /* Tablets */
  --breakpoint-lg: 1024px;   /* Small laptops */
  --breakpoint-xl: 1280px;   /* Desktops */
  --breakpoint-2xl: 1536px;  /* Large desktops */
  --breakpoint-3xl: 1920px;  /* Ultra-wide */
}

/* Container System */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding-left: var(--space-8);
    padding-right: var(--space-8);
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### Layout Variations
```css
/* Mobile-First Chat Layout */
.chat-layout-mobile {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  grid-template-areas:
    "header"
    "messages"
    "input";
}

/* Tablet Split View */
@media (min-width: 768px) {
  .chat-layout-tablet {
    display: grid;
    grid-template-columns: 320px 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "sidebar header"
      "sidebar messages"
      "sidebar input";
  }
}

/* Desktop Multi-Panel */
@media (min-width: