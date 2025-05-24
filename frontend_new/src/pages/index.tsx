import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Button, Card, Snippet, Chip, Accordion, AccordionItem } from '@heroui/react';
import { ArrowDown, ArrowRight, Zap, MessageSquare, Brain, Users, CheckCircle, Star, Palette, ShieldCheck, Moon, Sun, Code2, Puzzle, Layers, PlayCircle, Database, Settings2, HelpCircle, Lightbulb, Target, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      isIconOnly
      variant="light"
      aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-muted-foreground hover:text-primary transition-colors"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
};

const LandingNavBar = () => (
  <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-foreground/10 dark:border-neutral-800/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Nova
      </Link>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
        <Link href="#solution" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Solution</Link>
        <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
        <ThemeSwitcher />
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
          <Button as={Link} href="/signup" variant="flat" color="primary" size="sm" className="font-semibold">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  </nav>
);

const LogoCloud = () => (
  <div className="py-12 md:py-16 bg-background">
    <div className="max-w-6xl mx-auto px-4 md:px-0 text-center">
      <h2 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-10">
        TRUSTED BY INNOVATORS BUILDING THE NEXT WAVE OF AI SOLUTIONS
      </h2>
      <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 md:gap-x-16 opacity-70">
        {[ "Alpha AI", "QuantumLeap", "SynthCore", "InnovateAI", "LogicSpark", "InsightSphere" ].map((name) => (
          <div key={name} className="flex justify-center">
            <span className="text-lg font-medium text-muted-foreground filter grayscale hover:grayscale-0 transition-all duration-300">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Home() {
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
  
  if (!mounted || (user && !loading)) return <div className="min-h-screen bg-background flex items-center justify-center"><Zap className="w-8 h-8 text-primary animate-pulse"/></div>;
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <Head>
        <title>Nova AI - Architect the Future of Intelligent Automation</title>
        <meta name="description" content="Empower your organization with Nova, the enterprise-grade platform for building, deploying, and scaling a sophisticated AI workforce. Go beyond automation—redefine what's possible." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <LandingNavBar />

      {/* Hero Section - Reimagined for Maximum Impact */}
      <motion.header
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-4 flex flex-col items-center text-center overflow-hidden"
      >
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background to-foreground/5 dark:to-neutral-900"></div>
        <div
          className="absolute inset-0 -z-10 opacity-20 dark:opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 30%, hsl(var(--nextui-primary-500)/.15), transparent 40%), radial-gradient(circle at 85% 65%, hsl(var(--nextui-secondary-400)/.1), transparent 45%), radial-gradient(circle at 50% 50%, hsl(var(--nextui-default-300)/.05), transparent 30%)',
          }}
        />
        <div className="relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: "circOut" }}
            className="inline-block mb-6 sm:mb-8">
             <Chip as={Link} href="/blog/platform-updates" variant="shadow" color="primary" startContent={<Lightbulb className="w-4 h-4" />}>
                New: Enhanced Reasoning & Multi-Agent Collaboration!
             </Chip>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tighter leading-tight">
            Nova: Architect the Future <br className="hidden sm:inline" /> of <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary py-1">Intelligent Automation.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground dark:text-neutral-400 mb-10 sm:mb-12 max-w-2xl mx-auto">
            Empower your organization with Nova, the enterprise-grade platform for building, deploying, and scaling a sophisticated AI workforce. Go beyond automation—redefine what's possible.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="md" className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105" as={Link} href="/signup" variant="solid" color="primary" endContent={<ArrowRight className="w-5 h-5" />}>
              Start Building the Future
            </Button>
            <Button size="md" className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 transform hover:scale-105" as={Link} href="#solution" variant="bordered" color="default" startContent={<Target className="w-5 h-5" />}>
              Explore Nova's Power
            </Button>
          </motion.div>
          {/* Animated Scroll Down Cue */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: [0, 1, 0], y: [10, 20, 10] }} 
            transition={{ duration: 1.5, repeat: Infinity, delay: 2, ease: "easeInOut" }}
            className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 md:bottom-[-80px] text-muted-foreground"
          >
            <ArrowDown size={24} />
          </motion.div>
        </div>
      </motion.header>

      <LogoCloud />

      {/* Problem / Solution Section (Replaces Features Overview) */}
      <section id="solution" className="py-16 md:py-24 bg-foreground/5 dark:bg-neutral-900/70 border-y border-foreground/5 dark:border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center mb-12 md:mb-16">
            <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">Break Through Complexity. Unleash Intelligent Automation.</motion.h2>
            <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} viewport={{ once: true }}
            className="text-lg text-muted-foreground dark:text-neutral-400 max-w-3xl mx-auto">
                Nova's unified AI agent platform empowers you to transcend operational friction. Automate complex workflows, extract deep insights from disparate data, and free your team for strategic imperatives.
            </motion.p>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            { 
              icon: <Zap size={32} className="text-primary"/>, 
              title: "Autonomous Operations", 
              description: "Deploy agents that execute complex tasks end-to-end, from data synthesis and real-time analysis to proactive decision-making.", 
              points: ["Continuous workflow automation", "Adaptive learning from new data", "Reduced manual intervention"] 
            },
            { 
              icon: <Database size={32} className="text-primary"/>, 
              title: "Universal Data Integration", 
              description: "Seamlessly connect and reason across your entire data ecosystem—databases, documents, APIs, and enterprise applications.", 
              points: ["Centralized knowledge access", "Cross-functional data synthesis", "Actionable intelligence generation"] 
            },
            { 
              icon: <Brain size={32} className="text-primary"/>, 
              title: "Codeless AI Development", 
              description: "Visually design, train, and deploy sophisticated AI agents with custom skills and operational logic, no coding required.", 
              points: ["Intuitive drag-and-drop interface", "Rapid prototyping & iteration", "Democratized AI for all teams"] 
            }
          ].map((item, idx) => (
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 * idx }} viewport={{ once: true }} key={item.title}>
              <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 ease-out bg-background dark:bg-neutral-800/60 text-left p-6 md:p-8 hover:-translate-y-1.5 transform flex flex-col">
                <div className="mb-4 sm:mb-5">{item.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground dark:text-neutral-100">{item.title}</h3>
                <p className="text-muted-foreground dark:text-neutral-400 text-sm sm:text-base leading-relaxed mb-4">{item.description}</p>
                <ul className="space-y-2 text-sm mt-auto">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground dark:text-neutral-400">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase / How It Works Section - Revamped to be Dynamic */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <Chip variant="flat" color="secondary" startContent={<PlayCircle className="w-4 h-4"/>} className="mb-4 sm:mb-5">Rapid AI Deployment Engine</Chip>
          <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5 }} viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">Deploy Advanced AI Agents. Effortlessly.</motion.h2>
          <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} viewport={{ once: true }}
          className="text-lg text-muted-foreground dark:text-neutral-400 max-w-3xl mx-auto mb-12 md:mb-16">
            From concept to fully operational AI agent in record time. Nova's intuitive interface and powerful backend streamline the path to intelligent automation.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            {[
              { icon: <Target size={36} className="text-primary"/>, title: "1. Define Mission", description: "Clearly outline your agent's objectives, tasks, and desired outcomes using our guided setup." },
              { icon: <LinkIcon size={36} className="text-primary"/>, title: "2. Connect Knowledge", description: "Securely link relevant data sources, documents, or apps to provide your agent with the context it needs." },
              { icon: <Zap size={36} className="text-primary"/>, title: "3. Activate & Scale", description: "Launch your agent into your workflow, monitor its performance, and easily scale your AI operations." }
            ].map((step, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.2 * idx, ease: "easeOut" }} 
                viewport={{ once: true, amount: 0.3 }}
                key={step.title}
              >
                <Card className="h-full text-center p-6 md:p-8 bg-background dark:bg-neutral-800/60 shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105">
                  <div className="flex justify-center mb-5 text-primary">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-neutral-100">{step.title}</h3>
                  <p className="text-muted-foreground dark:text-neutral-400 text-sm leading-relaxed">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Social Proof / Testimonials Section - Refined */}
      <section className="py-16 md:py-24 bg-foreground/5 dark:bg-neutral-900/70 border-y border-foreground/5 dark:border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5 }} viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center tracking-tight">Empowering Leaders, Accelerating Industries</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[ // Testimonials updated for a more 'enterprise' feel
              { name: "Dr. Alistair Finch, Chief Innovation Officer, Quantum Dynamics Corp", quote: "Nova's AI agents have revolutionized our research and development cycles. The platform's ability to synthesize vast datasets and automate complex simulations is unparalleled.", avatar: "/placeholder-avatar-1.jpg" },
              { name: "Isabelle Moreau, VP Global Operations, OmniLogistics Solutions", quote: "Implementing Nova for supply chain optimization has yielded significant efficiency gains and cost reductions. The AI agents adapt dynamically to real-world disruptions.", avatar: "/placeholder-avatar-2.jpg" },
              { name: "Rajiv Patel, CEO, Ascend Financial Technologies", quote: "Nova provided the critical AI infrastructure for our next-gen risk assessment models. The speed of deployment and the robustness of the agents exceeded our expectations.", avatar: "/placeholder-avatar-3.jpg" }
            ].map((testimonial, idx) => (
              <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 * idx }} viewport={{ once: true }} key={testimonial.name}>
                <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 bg-background dark:bg-neutral-800/60 p-6 md:p-8 transform hover:-translate-y-1">
                  <p className="text-muted-foreground dark:text-neutral-300 mb-4 italic text-base">"{testimonial.quote}"</p>
                  <h4 className="font-semibold text-foreground dark:text-neutral-100">{testimonial.name}</h4>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us / Differentiators - Added hover effects to cards */}
       <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5 }} viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">The Nova Advantage: Intelligent, Integrated, Indispensable.</motion.h2>
          <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} viewport={{ once: true }}
          className="text-lg text-muted-foreground dark:text-neutral-400 max-w-3xl mx-auto mb-12 md:mb-16">
            Nova isn't just another AI tool. It's a strategic platform architected for transformative results, blending cutting-edge AI with unparalleled ease of use.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-8 gap-y-8 md:gap-y-10">
            {[ 
              { title: "Intuitive Visual Builder", description: "Democratize AI development. Design complex agent behaviors and multi-step workflows with a simple drag-and-drop interface. No coding expertise needed to innovate.", icon: <Palette size={24} className="text-primary"/> },
              { title: "Seamless Ecosystem Integration", description: "Connect Nova to your entire operational fabric—CRMs, ERPs, databases, APIs, and proprietary systems—to give your agents complete contextual awareness.", icon: <Layers size={24} className="text-primary"/> },
              { title: "Advanced Cognitive Engine", description: "Leverage proprietary and leading foundation models for superior reasoning, complex problem-solving, and nuanced understanding by your AI agents.", icon: <Brain size={24} className="text-primary"/> },
              { title: "Scalable Agent Orchestration", description: "Deploy and manage a resilient fleet of specialized AI agents. Enable collaborative task execution and dynamically scale your AI workforce with demand.", icon: <Users size={24} className="text-primary"/> },
              { title: "Actionable Intelligence & Control", description: "Gain deep insights into agent performance, operational impact, and ROI. Continuously refine and optimize your AI workforce with comprehensive analytics and controls.", icon: <CheckCircle size={24} className="text-primary"/> },
              { title: "Enterprise-Grade Security & Governance", description: "Your data integrity and agent operations are paramount. Nova is built on a foundation of robust security protocols, ensuring compliance and complete peace of mind.", icon: <ShieldCheck size={24} className="text-primary"/> }
            ].map((item, idx) => (
               <motion.div 
                initial={{ opacity:0, y:20 }} 
                whileInView={{ opacity:1, y:0 }} 
                transition={{ duration:0.5, delay:0.1 * idx }} 
                viewport={{ once: true }} 
                key={item.title} 
                className="text-left p-6 bg-background dark:bg-neutral-800/60 rounded-xl shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/30 hover:scale-[1.03] transition-all duration-300"
                >
                <div className="flex items-start gap-4 mb-3">
                  {item.icon} 
                  <h4 className="text-lg font-semibold text-foreground dark:text-neutral-100 mt-px">{item.title}</h4>
                </div>
                <p className="text-muted-foreground dark:text-neutral-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner - Overhauled */}
      <section className="py-20 md:py-32 text-center relative overflow-hidden bg-gradient-to-r from-primary to-secondary dark:from-primary/90 dark:to-secondary/90">
         <div
          className="absolute inset-0 -z-10 opacity-15 dark:opacity-10"
          style={{ backgroundImage: 'url("/assets/images/pattern.svg")' }} 
        />
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <motion.h2 
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-white tracking-tight">
            Build the Future, Starting Today.
          </motion.h2>
          <motion.p 
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }} viewport={{ once: true }}
            className="text-lg md:text-xl text-white/90 mb-10 sm:mb-12">
            The next era of business is intelligent and automated. Lead the charge with Nova.
            Begin your transformation now—your first AI agent is just minutes away. <span className="font-semibold">Explore the future, free for 14 days.</span>
          </motion.p>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }} viewport={{ once: true }}>
            <Button size="md" className="px-10 sm:px-12 py-3.5 sm:py-4 text-base sm:text-lg font-semibold shadow-2xl !bg-white !text-primary hover:!bg-white/90 transform hover:scale-105 transition-all duration-300" as={Link} href="/signup" variant="solid">
              Activate Your Nova Platform
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - New */}
      <section id="faq" className="py-16 md:py-24 border-t border-foreground/5 dark:border-neutral-800/60">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.5 }} viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-10 md:mb-12 text-center tracking-tight">Frequently Asked Questions</motion.h2>
          <Accordion selectionMode="multiple" defaultExpandedKeys={["1"]}>
            <AccordionItem key="1" aria-label="What is Nova AI?" title="What exactly can I do with Nova AI agents?" startContent={<HelpCircle className="text-primary"/>}>
              <p className="text-muted-foreground dark:text-neutral-400">Nova empowers you to build and deploy custom AI agents for a wide range of tasks. Think automated customer service, intelligent data analysis from multiple sources, content generation, complex research, process automation (like lead qualification or report summaries), and much more. If a task involves information processing, decision-making based on data, or interaction, an AI agent can likely help.</p>
            </AccordionItem>
            <AccordionItem key="2" aria-label="Is it hard to build an agent?" title="Do I need to be a programmer to build an AI agent?" startContent={<HelpCircle className="text-primary"/>}>
              <p className="text-muted-foreground dark:text-neutral-400">No! Nova is designed with an intuitive, visual interface. While developers can extend its capabilities, business users can easily define agent goals, connect knowledge sources (like documents or websites), and configure agent behaviors without writing any code. We focus on making powerful AI accessible.</p>
            </AccordionItem>
            <AccordionItem key="3" aria-label="How does Nova learn?" title="How does Nova AI connect to my existing data and tools?" startContent={<HelpCircle className="text-primary"/>}>
              <p className="text-muted-foreground dark:text-neutral-400">Nova offers flexible ways to integrate your knowledge. You can upload documents (PDFs, Word, etc.), connect to web pages, or link to popular business applications and databases. Your agents then use this connected information as their knowledge base to provide accurate and context-aware responses and actions.</p>
            </AccordionItem>
             <AccordionItem key="4" aria-label="What about data security?" title="Is my data secure with Nova AI?" startContent={<ShieldCheck className="text-primary"/>}>
              <p className="text-muted-foreground dark:text-neutral-400">Absolutely. Data security is paramount at Nova. We employ enterprise-grade security measures, including data encryption at rest and in transit, role-based access controls, and regular security audits. Your proprietary information remains yours and is protected.</p>
            </AccordionItem>
            <AccordionItem key="5" aria-label="How is Nova different?" title="How is Nova different from other AI tools or chatbots?" startContent={<HelpCircle className="text-primary"/>}>
              <p className="text-muted-foreground dark:text-neutral-400">Nova focuses on creating a deployable AI <span className="font-semibold text-foreground">workforce</span>. Instead of just a chatbot, you build specialized agents that can perform complex tasks, integrate deeply with your workflows, and even collaborate. Our emphasis is on actionable AI that delivers tangible business outcomes, not just conversations.</p>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer - Refined */}
      <footer className="py-12 md:py-16 bg-background text-center border-t border-foreground/5 dark:border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
            <Link href="/" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-6 inline-block">
              Nova
            </Link>
            <div className="flex flex-wrap justify-center gap-x-5 sm:gap-x-6 gap-y-2 mb-8">
                {[ "Platform", "Solution", "Pricing", "Company", "Blog", "Contact" ].map((item) => (
                    <Link key={item} href={`#${item.toLowerCase().replace(' ','-')}`} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                        {item}
                    </Link>
                ))}
            </div>
            <p className="text-muted-foreground/80 dark:text-neutral-500 text-xs mb-3">
                &copy; {new Date().getFullYear()} Nova AI Technologies Inc. Your intelligent future, activated.
            </p>
            <div className="flex justify-center space-x-4 text-xs">
                <Link href="/privacy" className="text-muted-foreground/60 hover:text-primary transition-colors">Privacy Policy</Link>
                <span className="text-muted-foreground/40">|</span>
                <Link href="/terms" className="text-muted-foreground/60 hover:text-primary transition-colors">Terms of Service</Link>
                 <span className="text-muted-foreground/40">|</span>
                <Link href="/status" className="text-muted-foreground/60 hover:text-primary transition-colors">System Status</Link>
            </div>
        </div>
      </footer>

    </div>
  );
} 