'use client';

import React from 'react';
import { AppLayout } from '@/components/layout';

export default function HomePage() {
  return (
    <AppLayout 
      headerTitle="Nova AI" 
      headerSubtitle="Next-generation AI Chat Interface"
    >
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center space-y-8">
          <div className="text-8xl mb-8">🚀</div>
          
          <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-6">
            Welcome to Nova AI
          </h1>
          
          <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            Your next-generation AI workspace with neural dopamine design. 
            Experience the future of AI interaction.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="glass-morphism p-6 rounded-xl text-center">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Smart Chat
              </h3>
              <p className="text-[var(--text-secondary)]">
                Advanced AI conversations with context awareness
              </p>
            </div>
            
            <div className="glass-morphism p-6 rounded-xl text-center">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Analytics
              </h3>
              <p className="text-[var(--text-secondary)]">
                Deep insights into your AI interactions
              </p>
            </div>
            
            <div className="glass-morphism p-6 rounded-xl text-center">
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Customizable
              </h3>
              <p className="text-[var(--text-secondary)]">
                Tailor the experience to your needs
              </p>
            </div>
          </div>
          
          <div className="mt-12">
            <p className="text-[var(--text-muted)] text-sm">
              Check the sidebar on the left to navigate through the app
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 