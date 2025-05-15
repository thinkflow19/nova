import Link from 'next/link';
import { Twitter, Github, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API', href: '/api' },
    ],
    Company: [
      { name: 'About', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press', href: '/press' },
    ],
    Legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Security', href: '/security' },
    ],
    Support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Status', href: '/status' },
      { name: 'Contact', href: '/contact' },
      { name: 'Community', href: '/community' },
    ],
  };

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, href: 'https://twitter.com/novaai', label: 'Twitter' },
    { icon: <Github className="w-5 h-5" />, href: 'https://github.com/novaai', label: 'GitHub' },
    { icon: <Linkedin className="w-5 h-5" />, href: 'https://linkedin.com/company/novaai', label: 'LinkedIn' },
    { icon: <Youtube className="w-5 h-5" />, href: 'https://youtube.com/c/novaai', label: 'YouTube' },
  ];

  return (
    <footer className="bg-primary border-t border-border/10 pt-16 pb-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Brand and tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <div className="text-2xl font-heading font-bold flex items-center mb-4">
                <span className="text-accent">Nova</span>
                <span>.ai</span>
              </div>
            </Link>
            <p className="text-textMuted mb-6 pr-4">
              The enterprise-grade platform for building and deploying AI agents.
            </p>
            
            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textMuted hover:text-textMain transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-medium text-lg mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-textMuted hover:text-textMain transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-textMuted text-sm mb-4 md:mb-0">
            &copy; {currentYear} Nova AI, Inc. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/terms" className="text-textMuted hover:text-textMain transition-colors text-sm">
              Terms
            </Link>
            <Link href="/privacy" className="text-textMuted hover:text-textMain transition-colors text-sm">
              Privacy
            </Link>
            <Link href="/cookies" className="text-textMuted hover:text-textMain transition-colors text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 