'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <motion.div
      className="bg-off-white text-gray-dark min-h-screen font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.section
        className="px-8 py-32 text-center bg-gradient-to-b from-off-white to-[#f1f2f6]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">A Future-Ready Workspace</h2>
        <p className="text-xl max-w-2xl mx-auto text-text-muted mb-10">
          Build, automate, and chat with AI inside one fluid workspace. Beautifully engineered for teams that move fast.
        </p>
        <div className="space-x-4">
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 text-lg rounded-full bg-primary text-white hover:bg-primary-dark shadow-lg transition font-medium"
            >
              Start Free
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 text-lg rounded-full bg-white text-primary border-2 border-primary hover:bg-primary/5 shadow-lg transition font-medium"
            >
              Sign In
            </motion.button>
          </Link>
        </div>
      </motion.section>

      <motion.section
        id="features"
        className="px-8 py-24 bg-white max-w-screen-xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h3 className="text-4xl font-semibold text-center mb-16">What You'll Love</h3>
        <div className="grid md:grid-cols-3 gap-10">
          {["AI Chat", "Automation Builder", "Integrated Docs"].map((title, idx) => (
            <motion.div
              key={title}
              className="p-6 bg-lavender rounded-2xl shadow-soft hover:shadow-md transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xl font-semibold mb-3">{title}</h4>
              <p className="text-sm text-gray-600">
                {title === "AI Chat" &&
                  "Chat with Nova anytime to automate tasks, find documents, or summarize data."}
                {title === "Automation Builder" &&
                  "Use a visual builder to drag and drop workflows that power your business."}
                {title === "Integrated Docs" &&
                  "Organize, tag, and chat with your documents directly in Nova's dashboard."}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="pricing"
        className="px-8 py-24 bg-gradient-to-b from-[#f1f2f6] to-[#e0e2e9]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h3 className="text-4xl font-semibold text-center mb-16">Pricing Plans</h3>
        <div className="grid md:grid-cols-3 gap-10 max-w-screen-xl mx-auto">
          {["Starter", "Pro", "Enterprise"].map((plan, idx) => (
            <motion.div
              key={plan}
              className={`p-8 bg-white rounded-2xl shadow-md text-center transition border ${
                plan === "Pro" ? "border-primary scale-105" : "border-transparent"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h4 className="text-2xl font-semibold mb-2">{plan}</h4>
              <p className="text-sm text-gray-500 mb-6">
                {plan === "Starter" && "For individuals"}
                {plan === "Pro" && "Best for teams"}
                {plan === "Enterprise" && "Custom needs"}
              </p>
              <p className="text-3xl font-bold mb-6">
                {plan === "Starter" && "Free"}
                {plan === "Pro" && "$29/mo"}
                {plan === "Enterprise" && "Contact Us"}
              </p>
              <Link href="/signup">
                <button className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                  Choose Plan
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <footer id="contact" className="px-8 py-12 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Nova. All rights reserved.
      </footer>
    </motion.div>
  );
}
