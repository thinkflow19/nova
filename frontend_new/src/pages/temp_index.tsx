import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Button, Card, CardHeader, Kbd, Snippet, Chip } from '@heroui/react'; // Added Chip
import { ArrowRight, Zap, MessageSquare, Brain, Users, CheckCircle, Star, Palette, ShieldCheck, Moon, Sun, Code2, Puzzle, Layers, PlayCircle } from 'lucide-react'; // Added PlayCircle
import { motion } from 'framer-motion';
import Link from 'next/link';

// Mock NavBar - Theme switcher integration will come later
const LandingNavBar = () => (
  <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-foreground/10 dark:border-neutral-800/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Nova
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
        <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
        <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Docs</Link>
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
          <Button as={Link} href="/signup" variant="flat" color="primary" size="sm" className="font-semibold">
            Sign Up Free
          </Button>
        </div>
        {/* Mobile menu button can be added here if needed */}
        {/* Theme Switcher will go here */}
      </div>
    </div>
  </nav>
);

export default function TempHome() { // Changed component name for clarity
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted && user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, mounted, router]);
  
  if (!mounted || (user && !loading)) return <div className="min-h-screen bg-background flex items-center justify-center"><Zap className="w-8 h-8 text-primary animate-pulse"/></div>; // Basic loading/redirect screen
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <Head>
        <title>Nova AI - Intelligent Automation & Collaboration Platform</title>
        <meta name="description" content="Nova AI: The ultimate platform for AI-powered collaboration, intelligent chat, advanced knowledge management, and custom AI agent creation. Streamline workflows and boost productivity." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingNavBar />

      {/* Hero Section - Refined */}
      <motion.header 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 flex flex-col items-center text-center overflow-hidden"
      >
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background to-foreground/5 dark:to-neutral-900"></div>
        <div
          className="absolute inset-0 -z-10 opacity-20 dark:opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 30%, hsl(var(--nextui-primary-500)/.2), transparent 35%), radial-gradient(circle at 85% 65%, hsl(var(--nextui-secondary-500)/.15), transparent 40%), radial-gradient(circle at 50% 50%, hsl(var(--nextui-default-300)/.05), transparent 25%)',
          }}
        />
        <div className="relative z-10 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: "circOut" }}
            className="inline-block mb-6 sm:mb-8">
             <Chip as={Link} href="/blog/new-features" variant="flat" color="primary" startContent={<Star className="w-4 h-4" />}>
                Announcing Nova Agent SDK 2.0 & Enhanced AI Models!
             </Chip>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tighter leading-tight">
            Build, Chat, Automate. <br className="hidden sm:inline" /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary py-1">Intelligently.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground dark:text-neutral-400 mb-10 sm:mb-12 max-w-2xl mx-auto">
            Nova is your unified platform for AI-driven collaboration. Create custom agents, chat with your knowledge, and automate complex workflows with unparalleled ease and power.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105" as={Link} href="/signup" variant="solid" color="primary" endContent={<ArrowRight className="w-5 h-5" />}>
              Start Building Free
            </Button>
            <Button size="lg" className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 transform hover:scale-105" as={Link} href="#demo-video" variant="bordered" color="default" startContent={<PlayCircle className="w-5 h-5" />}>
              Watch Demo (2 min)
            </Button>
          </motion.div>
        </div>
      </motion.header>
      {/* Remainder of the page will be added incrementally */}
    </div>
  );
} 