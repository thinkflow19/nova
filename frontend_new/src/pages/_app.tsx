'use client'; // Required for next-themes

// @ts-nocheck
import '@/styles/globals.css';
import '@/styles/theme.css';
import { Outfit } from 'next/font/google';
// import { ThemeProvider } from '@/contexts/ThemeContext'; // Will be replaced by next-themes
import { AuthProvider } from '@/contexts/AuthContext';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useRouter } from 'next/router';
import { HeroUIProvider } from '@heroui/react'; // Keep for HeroUI components
import { ThemeProvider } from '@/theme/ThemeProvider'; // Use our local ThemeProvider

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  adjustFontFallback: true,
});

const queryClient = new QueryClient();

// Error Boundary for global error handling
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log error to an error reporting service here
    // eslint-disable-next-line no-console
    console.error('Global ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-lg text-gray-500 mb-6">An unexpected error occurred. Please refresh the page or try again later.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // ClientOnly wrapper to avoid hydration issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.15 });
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  // HeroUI docs: For Next.js Pages Directory, wrap with HeroUIProvider and NextThemesProvider.
  // We use `class` attribute for theme switching with HeroUI.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HeroUIProvider>
      <Head>
        <title>Nova AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Nova AI - Your intelligent assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
          {/* Skip link for accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-white dark:bg-gray-900 text-black dark:text-white px-4 py-2 rounded shadow transition-all">Skip to main content</a>
          <ErrorBoundary>
              <main id="main-content" className={`${outfit.variable} font-sans min-h-screen`}>
                {/* bg-main and text-primary will now be handled by Tailwind dark mode and HeroUI theme colors */}
              <Component {...pageProps} />
            </main>
          </ErrorBoundary>
      </AuthProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} 