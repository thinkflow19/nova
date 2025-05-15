import { motion } from 'framer-motion';
import { Bot, Upload, MessageSquare } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      title: 'Create Agents Visually',
      description: 'Build powerful AI agents with our intuitive visual interface. No coding required to create sophisticated task automation.',
      icon: <Bot className="w-10 h-10 text-accent" />,
    },
    {
      title: 'Upload Docs for Context',
      description: 'Give your agents the knowledge they need by uploading documents, code, or data. They learn and adapt to your specific workflows.',
      icon: <Upload className="w-10 h-10 text-accent" />,
    },
    {
      title: 'Chat With Your Agents',
      description: 'Communicate with your agents in natural language. Ask questions, give instructions, and receive intelligent responses.',
      icon: <MessageSquare className="w-10 h-10 text-accent" />,
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">Key Features</h2>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Our platform provides everything you need to create, deploy, and manage AI agents that streamline your workflow.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="card flex flex-col items-center text-center h-full"
            >
              <div className="rounded-full bg-accent/10 p-4 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-textMuted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute -z-10 top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px]"></div>
        <div className="absolute -z-10 bottom-0 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[100px]"></div>
      </div>
    </section>
  );
} 