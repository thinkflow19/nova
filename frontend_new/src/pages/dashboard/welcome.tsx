import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, FileText, ChevronRight, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

const steps = [
  {
    title: 'Create your first agent',
    description: 'Start by creating an AI agent tailored to your specific needs and knowledge domain.',
    icon: Bot,
    href: '/dashboard/agents/new',
    cta: 'Create Agent',
  },
  {
    title: 'Upload knowledge',
    description: 'Enhance your AI agent with documents and data to make it more capable and accurate.',
    icon: FileText,
    href: '/dashboard/knowledge',
    cta: 'Upload Documents',
  },
  {
    title: 'Start a conversation',
    description: 'Chat with your AI agent and see how it uses your knowledge to provide intelligent responses.',
    icon: Bot,
    href: '/dashboard/chat',
    cta: 'Start Chatting',
  },
];

export default function Welcome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // On a real application, we would fetch the completed steps from the backend
  useEffect(() => {
    // Simulate fetching completed steps
    const fetchCompletedSteps = async () => {
      // This would be replaced with an actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For demo purposes, let's assume the user has completed step 1
      setCompletedSteps([0]);
    };
    
    if (user) {
      fetchCompletedSteps();
    }
  }, [user]);
  
  const handleSkip = () => {
    router.push('/dashboard');
  };
  
  if (loading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Welcome to Nova AI</title>
        <meta name="description" content="Get started with Nova AI" />
      </Head>
      
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 premium-text-gradient">
              Welcome to Nova AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Let's set up your AI workspace. Follow these steps to get started and make the most of your AI assistant.
            </p>
          </motion.div>
        </div>
        
        <div className="space-y-8 mb-12">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const Icon = step.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className={`relative border ${isCompleted ? 'border-accent/30 bg-accent/5' : 'border-border bg-card'} rounded-xl p-6 shadow-sm`}>
                  {isCompleted && (
                    <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-xs rounded-bl-lg rounded-tr-lg">
                      Completed
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${isCompleted ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'} flex items-center justify-center mb-4 md:mb-0 md:mr-6`}>
                      <Icon className="w-6 h-6" />
                      <span className="sr-only">Step {index + 1}</span>
                    </div>
                    
                    <div className="flex-grow">
                      <h2 className="text-xl font-semibold mb-2 flex items-center">
                        <span>Step {index + 1}: {step.title}</span>
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {step.description}
                      </p>
                      
                      <Link href={step.href}>
                        <Button
                          variant={isCompleted ? "outline" : "default"}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          {isCompleted ? 'View' : step.cta}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleSkip}
          >
            Skip tutorial
          </Button>
          
          <Link href="/dashboard">
            <Button
              variant="default"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 