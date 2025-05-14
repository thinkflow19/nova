import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQAccordion() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: 'What types of tasks can Nova.ai agents automate?',
      answer: 'Nova.ai agents can automate a wide range of tasks including code generation, debugging, refactoring, documentation creation, data processing, text analysis, report generation, and various workflow automations. They excel at repetitive tasks that follow patterns and can be trained on your specific business processes.',
    },
    {
      question: 'How secure is the platform for handling sensitive code?',
      answer: 'We employ enterprise-grade security measures including end-to-end encryption, strict access controls, and regular security audits. Your data never leaves our secure infrastructure, and we offer private deployments for organizations with heightened security requirements. We are SOC 2 Type II and GDPR compliant.',
    },
    {
      question: 'Do I need coding experience to use Nova.ai?',
      answer: 'No coding experience is required to use our platform. The visual workflow builder allows non-technical users to create sophisticated automations. However, developers can extend functionality using our APIs and SDK if needed. We offer solutions for both no-code users and technical teams.',
    },
    {
      question: 'Can I integrate Nova.ai with my existing tools?',
      answer: 'Yes, Nova.ai offers numerous integrations with popular development and business tools including GitHub, GitLab, Jira, Slack, VS Code, Microsoft Teams, and more. We also provide a robust API for custom integrations with your internal systems and workflows.',
    },
    {
      question: 'What is your pricing model?',
      answer: 'We offer tiered subscription plans starting with a free tier for individuals and scaling up to enterprise plans for large organizations. Pricing is based on the number of agents, usage volume, and advanced features needed. Custom enterprise pricing is available for organizations with specific requirements.',
    },
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Have questions about Nova.ai? Find answers to the most common questions below.
          </p>
        </motion.div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="flex items-center justify-between w-full text-left p-6 focus:outline-none"
                aria-expanded={activeIndex === index}
                aria-controls={`faq-content-${index}`}
              >
                <h3 className="text-lg font-medium">{faq.question}</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    activeIndex === index ? 'transform rotate-180' : ''
                  }`} 
                />
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    id={`faq-content-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 border-t border-border/10">
                      <p className="text-textMuted">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 