'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '../ui';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: string;
}

interface BotPreviewProps {
  botData: {
    name: string;
    color: string;
    ai_model_config: {
      tone: string;
    };
    documents: Document[];
  };
  onSubmit: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export default function BotPreview({ botData, onSubmit, onBack, isProcessing }: BotPreviewProps) {
  const [embedCode, setEmbedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Generate embed code based on bot data
    const code = `<iframe
  src="https://nova-ai.vercel.app/embed/${encodeURIComponent(botData.name.toLowerCase().replace(/\s+/g, '-'))}"
  width="100%"
  height="600px"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
></iframe>`;
    
    setEmbedCode(code);
  }, [botData]);

  const handleSubmit = () => {
    onSubmit();
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900">Preview Your AI Assistant</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review your AI assistant before launching it to the world.
        </p>
      </div>

      {/* Bot Summary */}
      <Card>
        <h3 className="font-medium text-gray-800 mb-3">Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Bot Name:</span>
            <span className="text-sm font-medium">{botData.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Brand Color:</span>
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: botData.color }}
              ></div>
              <span className="text-sm font-medium">{botData.color}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Conversation Tone:</span>
            <span className="text-sm font-medium capitalize">{botData.ai_model_config.tone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Documents:</span>
            <span className="text-sm font-medium">{botData.documents.length} files</span>
          </div>
        </div>
      </Card>

      {/* Bot Preview */}
      <Card className="overflow-hidden p-0">
        <div className="bg-gray-100 px-4 py-2 border-b flex items-center" style={{ backgroundColor: `${botData.color}20` }}>
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-xs text-gray-500 mx-auto">AI Assistant Preview</span>
        </div>
        <div className="p-4 h-64 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="flex mb-4">
              <div className="max-w-xs bg-gray-100 rounded-lg p-3 text-sm">
                Hi! I&apos;m your new {botData.name} assistant. How can I help you today?
              </div>
            </div>
            <div className="flex mb-4 justify-end">
              <div className="max-w-xs rounded-lg p-3 text-sm text-white" style={{ backgroundColor: botData.color }}>
                Can you tell me about your features?
              </div>
            </div>
            <div className="flex mb-4">
              <div className="max-w-xs bg-gray-100 rounded-lg p-3 text-sm">
                I&apos;m an AI assistant trained on your documents. I can answer questions, provide information, and help your users find what they need quickly.
              </div>
            </div>
          </div>
          <div className="mt-2 flex">
            <input 
              type="text" 
              placeholder="Type your question here..." 
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              disabled
            />
            <button 
              className="ml-2 px-3 py-2 text-sm rounded-lg text-white disabled:opacity-50 transition-all duration-250"
              style={{ backgroundColor: botData.color }}
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </Card>

      {/* Embed Code */}
      <div>
        <label htmlFor="embed-code" className="block text-sm font-medium text-gray-700 mb-2">
          Embed Code
        </label>
        <div className="relative">
          <textarea
            id="embed-code"
            rows={4}
            className="block w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none text-sm font-mono bg-gray-50"
            value={embedCode}
            readOnly
          />
          <button
            type="button"
            onClick={copyEmbedCode}
            className="absolute top-2 right-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-lg transition-all duration-250 text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Add this code to your website to embed your AI assistant.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isProcessing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          isLoading={isProcessing}
        >
          {isProcessing ? 'Creating Your Bot...' : 'Launch Bot'}
          {!isProcessing && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
} 