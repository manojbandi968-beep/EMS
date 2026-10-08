import React from 'react';
import { Search, MapPin, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import type { EventCategory } from '../../types/event';
import { CATEGORIES_LIST } from '../../data/mockEvents';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: EventCategory;
  setSelectedCategory: (cat: EventCategory) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  onSearchSubmit: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  onSearchSubmit,
}) => {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 blur-[100px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/10 blur-[100px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium mb-6 shadow-inner">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>The Next Generation Event Experience</span>
        </div>

        {/* Heading */}
        <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Curate, Discover & Experience{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Unforgettable Gatherings
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          From cutting-edge tech conferences to pulse-pounding music festivals, find events that fuel your passions or host your own with effortless ease.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Keyword Search */}
              <div className="sm:col-span-5 relative flex items-center">
                <Search className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  id="hero-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, keywords..."
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Category Filter */}
              <div className="sm:col-span-3 relative flex items-center">
                <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  id="hero-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as EventCategory)}
                  aria-label="Filter events by category"
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-10 pr-8 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none cursor-pointer"
                >
                  {CATEGORIES_LIST.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-slate-500 text-xs">▼</div>
              </div>

              {/* Location Input */}
              <div className="sm:col-span-2 relative flex items-center">
                <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  id="hero-location-input"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="City / Online"
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Action Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  id="hero-search-submit"
                  onClick={onSearchSubmit}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick popular tags */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Trending searches:</span>
          {['AI Summit', 'Music Festivals', 'Virtual Workshops', 'Founders Meetup'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
