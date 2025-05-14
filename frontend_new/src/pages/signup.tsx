import { useState, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, Lock, User, AlertCircle, Loader2, Eye, EyeOff, Check, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signUp, loading: authLoading } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  
  // Combined loading state
  const isLoading = loading || authLoading;
  
  // Password validation function
  const validatePassword = (password: string): void => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Uppercase letters check
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Lowercase letters check
    if (/[a-z]/.test(password)) strength += 1;
    
    // Numbers check
    if (/[0-9]/.test(password)) strength += 1;
    
    // Special characters check
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 3) {
      setError('Please use a stronger password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { error: signUpError } = await signUp(email, password, { name });
      
      if (signUpError) {
        throw new Error(signUpError.message || 'Failed to create account. Please try again.');
      }
      
      // No need to redirect here as it's handled in the AuthContext
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Function to get password strength color
  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-destructive';
    if (passwordStrength <= 3) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  // Function to get password strength text
  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };
  
  // Function to render password requirements
  const renderPasswordRequirement = (label: string, met: boolean) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <div className="w-4 h-4 border border-muted-foreground rounded-full" />
      )}
      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4 sm:p-6">
      <Head>
        <title>Sign Up | Nova AI</title>
        <meta name="description" content="Create a new Nova AI account" />
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
          
          <h1 className="text-4xl font-bold mb-4">Join Nova AI</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Create your account and start experiencing the power of AI tailored to your needs.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent mr-4">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-medium">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Your data is encrypted and never shared with third parties</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium">Free Trial</h3>
                <p className="text-sm text-muted-foreground">Start with a 14-day free trial, no credit card required</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Right side - signup form */}
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
            
            <h2 className="text-2xl font-bold text-center lg:text-left mb-8 lg:hidden">Create your account</h2>
            
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
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      <User size={18} />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-background/50 pl-10 pr-4 py-3 rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all duration-200"
                      placeholder="John Doe"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
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
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
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
                  
                  {/* Password strength indicator */}
                  {password && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 bg-background/70 p-3 rounded-lg border border-border"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium">Password strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength <= 1 ? 'text-destructive' : 
                          passwordStrength <= 3 ? 'text-amber-500' : 
                          'text-green-500'
                        }`}>
                          {getStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-full h-1.5 mb-3">
                        <div 
                          className={`h-1.5 rounded-full ${getStrengthColor()}`} 
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                        {renderPasswordRequirement('8+ characters', password.length >= 8)}
                        {renderPasswordRequirement('Uppercase (A-Z)', /[A-Z]/.test(password))}
                        {renderPasswordRequirement('Lowercase (a-z)', /[a-z]/.test(password))}
                        {renderPasswordRequirement('Number (0-9)', /[0-9]/.test(password))}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      <Lock size={18} />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-background/50 pl-10 pr-4 py-3 rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/70 text-white font-medium py-3 px-4 rounded-lg transition-colors mt-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </motion.button>
              </div>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-accent hover:text-accent/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 