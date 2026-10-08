import React from 'react';
import { Compass, Ticket, Shield, BarChart3 } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Compass className="w-6 h-6 text-indigo-400" />,
      title: 'Smart Discovery',
      description: 'Intelligent recommendations, real-time filters, and location detection help you uncover trending local and global events.',
    },
    {
      icon: <Ticket className="w-6 h-6 text-purple-400" />,
      title: 'Instant Ticketing & RSVP',
      description: 'One-click registration with instant QR codes, digital passes, and Apple/Google Wallet integration ready.',
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      title: 'Verified Organizers',
      description: 'Every event organizer undergoes multi-step verification to ensure authentic, secure, and world-class experiences.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
      title: 'Real-time Analytics',
      description: 'Organizers get comprehensive dashboards to track registrations, revenue metrics, attendee check-ins, and feedback.',
    },
  ];

  return (
    <section id="features-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Everything You Need to Experience & Host
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-400">
          Engineered for effortless attendance and seamless event coordination at any scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="font-outfit text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
