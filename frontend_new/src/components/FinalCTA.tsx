import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-border/10 via-border/5 to-transparent"></div>
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]"></div>
      <div className="absolute -z-10 bottom-0 left-0 w-full h-1/2 bg-noise opacity-5"></div>
      
      <div className="container max-w-5xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start automating with AI today.
          </h2>
          <p className="text-xl text-textMuted max-w-3xl mx-auto mb-10">
            Join thousands of teams already using Nova.ai to work faster, smarter, and with fewer resources.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Link 
                href="/dashboard/new-bot" 
                className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-accent/20"
              >
                Create Agent 
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Link 
                href="/chat" 
                className="btn btn-secondary text-lg px-8 py-4"
              >
                Try Chat Interface
                <MessageSquare className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <Link 
                href="/contact" 
                className="btn btn-secondary text-lg px-8 py-4"
              >
                Talk to Sales
                <MessageCircle className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-textMuted"
          >
            <p>No credit card required for free tier</p>
            <div className="flex flex-wrap justify-center gap-8 mt-4">
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 bg-success rounded-full mr-2"></span>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 bg-success rounded-full mr-2"></span>
                <span>14-day trial on all plans</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 bg-success rounded-full mr-2"></span>
                <span>Premium chat experience</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
} 