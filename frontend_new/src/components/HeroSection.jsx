import { motion } from 'framer-motion';
import { Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 md:pt-36 md:pb-24 overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="mb-4">
              Build AI Agents to <span className="text-accent">Automate</span> Your Workflow
            </h1>
            <p className="text-lg md:text-xl text-textMuted mb-8 max-w-xl mx-auto lg:mx-0">
              Create custom AI agents to handle tasks, automate coding workflows, and engage with your documents for faster operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Link href="/dashboard/new-bot" className="btn btn-primary w-full sm:w-auto">
                  Try It Free
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href="#demo-video" className="btn btn-secondary w-full sm:w-auto relative z-10">
                  <Play className="mr-2 h-4 w-4" />
                  See It in Action
                </Link>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-10 flex flex-wrap justify-center lg:justify-start gap-8 items-center text-sm text-textMuted"
            >
              <div className="flex items-center">
                <span className="flex h-2 w-2 bg-success rounded-full mr-2"></span>
                <span>Rated #1 AI App of 2025</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">⭐</span>
                <span>10k+ GitHub Stars</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔒</span>
                <span>Enterprise-grade Security</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Content - Terminal Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="bg-border/20 rounded-xl overflow-hidden shadow-premium backdrop-blur-sm border border-border/10">
              <div className="bg-border/30 px-4 py-3 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm text-textMuted mx-auto">Nova Agent Builder</div>
              </div>
              
              <div className="p-4 font-mono text-sm">
                <div className="flex">
                  <span className="text-accent mr-2">$</span>
                  <span className="text-textMain">nova create-agent --name "CodeHelper"</span>
                </div>
                
                <div className="mt-4 text-textMuted">
                  <div>Initializing agent configuration...</div>
                  <div className="mt-2">✅ Base model selected: GPT-4</div>
                  <div>✅ Context window: 128k tokens</div>
                  <div>✅ Tool access: GitHub, VSCode, Terminal</div>
                </div>
                
                <div className="mt-4">
                  <span className="text-accent mr-2">$</span>
                  <span className="text-textMain">nova agent:add-capability "code-review"</span>
                </div>
                
                <div className="mt-2 text-textMuted">
                  <div>Adding code review capability...</div>
                  <div className="mt-1">✅ Capability added successfully</div>
                </div>
                
                <div className="mt-4">
                  <span className="text-accent mr-2">$</span>
                  <span className="text-textMain">nova agent:deploy</span>
                </div>
                
                <div className="mt-2 text-textMuted">
                  <div>Deploying agent to your workspace...</div>
                  <div className="animate-pulse mt-1">■ Finalizing configuration</div>
                </div>
              </div>
            </div>
            
            {/* Decorative gradient */}
            <div className="absolute -z-10 top-1/3 left-1/3 w-2/3 h-2/3 bg-accent/20 rounded-full blur-[120px]"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 