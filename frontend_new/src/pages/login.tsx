import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { signIn, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Combined loading state
  const isLoading = loading || authLoading;
  
  // Set error message from auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw new Error(signInError.message || 'Failed to login. Please check your credentials.');
      }
      
      // No need to redirect here as it's handled in the AuthContext
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4 sm:p-6">
      <Head>
        <title>Login | Nova AI</title>
        <meta name="description" content="Login to your Nova AI account" />
      </Head>
      
      {/* Left side - branding and messaging */}
      <div className="hidden lg:flex lg:flex-col lg:w-1/2 lg:pr-12 lg:max-w-xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Link href="/" className="inline-flex items-center mb-12">
            <span className="text-5xl font-bold">
              <span className="text-accent">Nova</span><span className="text-foreground">.ai</span>
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Sign in to access your AI assistant and boost your productivity.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium">Personalized AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Get instant responses tailored to your needs</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium">Smart Task Management</h3>
                <p className="text-sm text-muted-foreground">Organize your day with AI-powered efficiency</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Right side - login form */}
      <div className="w-full sm:w-96 lg:w-1/2 lg:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-center lg:hidden mb-8">
              <Link href="/" className="inline-flex items-center">
                <span className="text-3xl font-bold">
                  <span className="text-accent">Nova</span><span className="text-foreground">.ai</span>
                </span>
              </Link>
            </div>
            
            <h2 className="text-2xl font-bold text-center lg:text-left mb-8 lg:hidden">Welcome back</h2>
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start"
                >
                  <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      <AtSign size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background/50 pl-10 pr-4 py-3 rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all duration-200"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-medium">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-accent hover:text-accent/80">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background/50 pl-10 pr-12 py-3 rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/70 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </motion.button>
              </div>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-accent hover:text-accent/80 font-medium">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 