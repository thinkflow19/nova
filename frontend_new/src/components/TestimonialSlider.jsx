import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function TestimonialSlider() {
  const testimonials = [
    {
      name: 'Alex Morgan',
      role: 'CTO at TechFlow',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      quote: "Nova.ai has completely transformed how our engineering team handles routine tasks. We've automated code reviews, documentation, and deployment processes, saving us 15+ hours per week.",
      stars: 5,
    },
    {
      name: 'Sarah Chen',
      role: 'Lead Developer at StackInnovate',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      quote: "The ability to upload our codebase and have the AI understand our architecture is mind-blowing. It spots patterns and suggests improvements I wouldn't have thought of.",
      stars: 5,
    },
    {
      name: 'Michael Torres',
      role: 'Freelance Developer',
      image: 'https://randomuser.me/api/portraits/men/67.jpg',
      quote: "As a solo developer, Nova.ai is like having a senior engineer looking over my shoulder. It helps me maintain high standards and catches issues before they become problems.",
      stars: 4,
    },
  ];

  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay, testimonials.length]);

  const next = () => {
    setAutoplay(false);
    setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prev = () => {
    setAutoplay(false);
    setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  return (
    <section id="testimonials" className="py-24 bg-border/5">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">What Our Users Say</h2>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our customers have to say about Nova.ai.
          </p>
        </motion.div>
        
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="card p-8 md:p-12 relative"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="shrink-0">
                  <img 
                    src={testimonials[current].image} 
                    alt={testimonials[current].name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-accent/20"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < testimonials[current].stars ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`} 
                      />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg md:text-xl italic mb-6">
                    "{testimonials[current].quote}"
                  </blockquote>
                  
                  <div>
                    <div className="font-bold">{testimonials[current].name}</div>
                    <div className="text-sm text-textMuted">{testimonials[current].role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation buttons */}
          <button
            onClick={prev}
            className="absolute top-1/2 -left-4 md:-left-6 -translate-y-1/2 p-2 rounded-full bg-border/20 text-textMain hover:bg-border/30 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={next}
            className="absolute top-1/2 -right-4 md:-right-6 -translate-y-1/2 p-2 rounded-full bg-border/20 text-textMain hover:bg-border/30 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Dots indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setAutoplay(false);
                setCurrent(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === current ? 'bg-accent w-6' : 'bg-border/40'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 