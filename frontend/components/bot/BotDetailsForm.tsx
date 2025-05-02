'use client';

import { useState, FormEvent } from 'react';
import { Button } from '../ui';

interface BotDetailsFormProps {
  initialData: {
    name: string;
    brandColor: string;
    tone: string;
  };
  onSubmit: (data: { name: string; brandColor: string; tone: string }) => void;
  isProcessing?: boolean;
}

export default function BotDetailsForm({ initialData, onSubmit, isProcessing = false }: BotDetailsFormProps) {
  const [name, setName] = useState(initialData.name);
  const [brandColor, setBrandColor] = useState(initialData.brandColor);
  const [tone, setTone] = useState(initialData.tone);
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!name.trim()) {
      setNameError('Bot name is required');
      return;
    }
    
    onSubmit({ name, brandColor, tone });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Bot Details</h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize how your AI assistant will look and interact with users.
          </p>
        </div>

        <div className="space-y-4">
          {/* Bot Name */}
          <div>
            <label htmlFor="bot-name" className="block text-sm font-medium text-gray-700">
              Bot Name
            </label>
            <input
              type="text"
              id="bot-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              className={`mt-1 block w-full rounded-lg border ${
                nameError ? 'border-red-300' : 'border-gray-300'
              } shadow-sm px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none`}
              placeholder="e.g., Support Assistant, Knowledge Base"
            />
            {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
          </div>

          {/* Brand Color */}
          <div>
            <label htmlFor="brand-color" className="block text-sm font-medium text-gray-700">
              Brand Color
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="color"
                id="brand-color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-10 rounded border border-gray-300 mr-2"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
                placeholder="#6366F1"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Choose a color that matches your brand identity.
            </p>
          </div>

          {/* Bot Tone */}
          <div>
            <label htmlFor="bot-tone" className="block text-sm font-medium text-gray-700">
              Conversation Tone
            </label>
            <select
              id="bot-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
            >
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="technical">Technical</option>
              <option value="supportive">Supportive</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              How your AI assistant will communicate with users.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit"
            disabled={isProcessing}
            isLoading={isProcessing}
            fullWidth
          >
            {!isProcessing && (
              <>
                Continue to Document Upload
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
} 