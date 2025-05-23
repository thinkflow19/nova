import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Code, Zap, History } from 'lucide-react';

export default function WhyChooseUs() {
  const advantages = [
    {
      title: 'Enterprise-grade Security',
      description: 'Your data stays private with end-to-end encryption and enterprise-level security compliance.',
      icon: <Shield className="w-6 h-6 text-accent" />,
    },
    {
      title: 'No-code Workflow Builder',
      description: 'Create complex automation workflows with our visual editor without writing a single line of code.',
      icon: <Code className="w-6 h-6 text-accent" />,
    },
    {
      title: 'Live Testing Mode',
      description: 'Test your agents in real-time with a sandboxed environment before deploying to production.',
      icon: <Zap className="w-6 h-6 text-accent" />,
    },
    {
      title: 'Version Control + Rollback',
      description: 'Track changes, compare versions, and roll back to previous configurations at any time.',
      icon: <History className="w-6 h-6 text-accent" />,
    },
  ];

  return (
    <section id="why-us" className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">Why Choose Nova.ai</h2>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Our platform offers unique advantages that make us the preferred choice for businesses and developers.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((advantage, index) => (
            <motion.div
              key={advantage.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card flex flex-col h-full"
            >
              <div className="rounded-full bg-border/20 p-3 w-fit mb-5">
                {advantage.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{advantage.title}</h3>
              <p className="text-sm text-textMuted">{advantage.description}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute -z-10 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px]"></div>
      </div>
    </section>
  );
} 