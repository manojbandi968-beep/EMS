import React from 'react';
import { Layers, Cpu, Music, Briefcase, Palette, HeartPulse, Wine } from 'lucide-react';
import type { EventCategory } from '../../types/event';

interface CategoryFilterProps {
  selectedCategory: EventCategory;
  onSelectCategory: (category: EventCategory) => void;
  categoryCounts: Record<EventCategory, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const categories: { label: EventCategory; icon: React.ReactNode }[] = [
    { label: 'All', icon: <Layers className="w-4 h-4" /> },
    { label: 'Technology', icon: <Cpu className="w-4 h-4" /> },
    { label: 'Music', icon: <Music className="w-4 h-4" /> },
    { label: 'Business', icon: <Briefcase className="w-4 h-4" /> },
    { label: 'Design & Art', icon: <Palette className="w-4 h-4" /> },
    { label: 'Health & Wellness', icon: <HeartPulse className="w-4 h-4" /> },
    { label: 'Food & Wine', icon: <Wine className="w-4 h-4" /> },
  ];

  return (
    <div id="categories-section" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-outfit text-2xl font-bold text-white tracking-tight">
            Explore by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Filter through our curated selection of experiences
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {categories.map(({ label, icon }) => {
          const isSelected = selectedCategory === label;
          const count = categoryCounts[label] ?? 0;

          return (
            <button
              key={label}
              id={`category-btn-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSelectCategory(label)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-indigo-400'}>{icon}</span>
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
