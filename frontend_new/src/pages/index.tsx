import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Dynamically import JSX components with proper types
const NavBar = dynamic(() => import('../components/NavBar'), { ssr: true });
const HeroSection = dynamic(() => import('../components/HeroSection'), { ssr: true });
const LogosSection = dynamic(() => import('../components/LogosSection'), { ssr: true });
const FeaturesSection = dynamic(() => import('../components/FeaturesSection'), { ssr: true });
const HowItWorks = dynamic(() => import('../components/HowItWorks'), { ssr: true });
const WhyChooseUs = dynamic(() => import('../components/WhyChooseUs'), { ssr: true });
const TestimonialSlider = dynamic(() => import('../components/TestimonialSlider'), { ssr: true });
const FAQAccordion = dynamic(() => import('../components/FAQAccordion'), { ssr: true });
const FinalCTA = dynamic(() => import('../components/FinalCTA'), { ssr: true });
const Footer = dynamic(() => import('../components/Footer'), { ssr: true });

export default function Home() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const router = useRouter();
  
  // Handle hydration issues by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (mounted && user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, mounted, router]);
  
  if (!mounted) {
    return null;
  }
  
  // Don't render landing page content for logged-in users
  if (user) {
    return null; // Will redirect via the useEffect
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Nova AI - Your Intelligent Assistant</title>
        <meta 
          name="description" 
          content="Nova AI is your intelligent AI assistant for seamless productivity." 
        />
      </Head>
      
      {/* @ts-ignore - JSX components don't have TypeScript definitions */}
      <NavBar user={user} loading={loading} />
      
      <main>
        {/* @ts-ignore - JSX components don't have TypeScript definitions */}
        <HeroSection user={user} />
        <LogosSection />
        <FeaturesSection />
        <HowItWorks />
        <WhyChooseUs />
        <TestimonialSlider />
        <FAQAccordion />
        {/* @ts-ignore - JSX components don't have TypeScript definitions */}
        <FinalCTA user={user} />
      </main>
      
      <Footer />
    </div>
  );
} 