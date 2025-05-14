import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Define Task in Natural Language',
      description: 'Simply describe what you want your agent to do in plain English. No need for complex programming or technical specs.',
    },
    {
      number: '02',
      title: 'Agent Executes It',
      description: 'Your AI agent breaks down the task, creates a plan, and executes it, handling all the complex technical details.',
    },
    {
      number: '03',
      title: 'You Review + Deploy',
      description: 'Review the results, make any adjustments, and deploy your agent to run the task whenever needed.',
    },
  ];
  
  return (
    <section id="how-it-works" className="py-24 bg-border/5">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">How It Works</h2>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Getting started with Nova.ai is straightforward. Follow these simple steps to automate your workflows.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col md:items-center md:text-center">
                <div className="text-5xl font-bold text-accent/20 mb-4">{step.number}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-textMuted">{step.description}</p>
              </div>
              
              {/* Connector line between steps (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-border/20 -z-10" style={{ width: 'calc(100% - 20px)', transform: 'translateX(10px)' }}></div>
              )}
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <a href="#demo-video" className="btn btn-primary">
            See it in action
          </a>
        </motion.div>
      </div>
    </section>
  );
} 