'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';

export default function HomePage() {
  const [demoText, setDemoText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoAction = async () => {
    setLoading(true);
    // Simulate async action
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <AppLayout 
      headerTitle="Nova AI" 
      headerSubtitle="Next-generation AI Chat Interface"
    >
      <div className="p-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="text-8xl mb-8 animate-float">🚀</div>
          
          <h1 className="text-display-xl bg-gradient-to-r from-[var(--accent-electric)] via-[var(--accent-purple)] to-[var(--accent-plasma)] bg-clip-text text-transparent">
            Welcome to Nova AI
          </h1>
          
          <p className="text-body-lg text-[var(--text-secondary)] max-w-3xl mx-auto">
            Experience the future of AI interaction with our neural-inspired design system. 
            Built for performance, accessibility, and an extraordinary user experience.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card variant="glass" hover className="animate-fade-in-up stagger-1">
            <div className="text-center p-6">
              <div className="text-4xl mb-4 animate-neural-pulse">💬</div>
              <h3 className="text-heading-lg text-[var(--text-primary)] mb-3">
                Smart Chat
              </h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                Advanced AI conversations with context awareness and neural processing
              </p>
            </div>
          </Card>
          
          <Card variant="glass" hover className="animate-fade-in-up stagger-2">
            <div className="text-center p-6">
              <div className="text-4xl mb-4 animate-neural-pulse">📊</div>
              <h3 className="text-heading-lg text-[var(--text-primary)] mb-3">
                Deep Analytics
              </h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                Comprehensive insights into your AI interactions and performance metrics
              </p>
            </div>
          </Card>
          
          <Card variant="glass" hover className="animate-fade-in-up stagger-3">
            <div className="text-center p-6">
              <div className="text-4xl mb-4 animate-neural-pulse">⚡</div>
              <h3 className="text-heading-lg text-[var(--text-primary)] mb-3">
                Lightning Fast
              </h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                Optimized for speed with GPU-accelerated animations and smart caching
              </p>
            </div>
          </Card>
        </div>

        {/* Interactive Demo Section */}
        <Card variant="neural" className="animate-fade-in-up stagger-4 neural-glow">
          <div className="p-8">
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
              Try Our Enhanced Components
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Demo */}
              <div className="space-y-4">
                <h3 className="text-heading-md text-[var(--text-secondary)]">
                  Neural Input System
                </h3>
                <Input
                  label="Experience Neural Inputs"
                  placeholder="Type something to see the magic..."
                  value={demoText}
                  onChange={setDemoText}
                />
                <Input
                  label="Password Input"
                  type="password"
                  placeholder="Password with visibility toggle"
                />
              </div>

              {/* Button Demo */}
              <div className="space-y-4">
                <h3 className="text-heading-md text-[var(--text-secondary)]">
                  Enhanced Button System
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="primary" 
                    onClick={handleDemoAction}
                    loading={loading}
                  >
                    Primary Action
                  </Button>
                  <Button variant="secondary">
                    Secondary
                  </Button>
                  <Button variant="ghost">
                    Ghost Button
                  </Button>
                  <Button variant="danger" size="sm">
                    Danger
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center animate-fade-in-up stagger-5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--accent-electric)] to-[var(--accent-purple)] flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <h4 className="text-heading-md text-[var(--text-primary)] mb-2">
              Neural Design
            </h4>
            <p className="text-body-sm text-[var(--text-muted)]">
              Glass morphism with neural gradients
            </p>
          </div>

          <div className="text-center animate-fade-in-up stagger-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-plasma)] flex items-center justify-center">
              <span className="text-2xl">♿</span>
            </div>
            <h4 className="text-heading-md text-[var(--text-primary)] mb-2">
              Accessibility
            </h4>
            <p className="text-body-sm text-[var(--text-muted)]">
              WCAG 2.1 AA compliant throughout
            </p>
          </div>

          <div className="text-center animate-fade-in-up stagger-7">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--accent-plasma)] to-[var(--accent-gold)] flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="text-heading-md text-[var(--text-primary)] mb-2">
              Performance
            </h4>
            <p className="text-body-sm text-[var(--text-muted)]">
              GPU-accelerated animations
            </p>
          </div>

          <div className="text-center animate-fade-in-up stagger-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-electric)] flex items-center justify-center">
              <span className="text-2xl">🔧</span>
            </div>
            <h4 className="text-heading-md text-[var(--text-primary)] mb-2">
              Customizable
            </h4>
            <p className="text-body-sm text-[var(--text-muted)]">
              Design tokens and CSS variables
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-caption text-[var(--text-muted)]">
            Explore the sidebar to navigate through the enhanced interface
          </p>
        </div>
      </div>
    </AppLayout>
  );
} 