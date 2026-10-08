import React, { useState, useMemo, useEffect } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { CategoryFilter } from '../components/home/CategoryFilter';
import { EventCard } from '../components/home/EventCard';
import { StatsSection } from '../components/home/StatsSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { EventModal } from '../components/home/EventModal';
import { MOCK_EVENTS } from '../data/mockEvents';
import type { EventCategory, EventItem } from '../types/event';
import { Flame, Sparkles, FilterX } from 'lucide-react';
import apiClient from '../api/client';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);

  const fetchLiveEvents = async () => {
    try {
      const res = await apiClient.get('/events');
      if (res.data?.data && res.data.data.length > 0) {
        const mapped: EventItem[] = res.data.data.map((e: any): EventItem => ({
          id: e.id,
          title: e.title,
          description: e.description || '',
          category: (e.categories?.name as EventCategory) || 'Technology',
          date: e.event_date
            ? new Date(e.event_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'TBD',
          time: e.event_date
            ? new Date(e.event_date).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'TBD',
          location: e.venue + (e.address ? `, ${e.address}` : ''),
          isOnline: Boolean(
            e.venue?.toLowerCase().includes('online') ||
            e.address?.toLowerCase().includes('online')
          ),
          price: 'Free',
          imageUrl:
            e.banner_url ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
          organizer: {
            name: e.organizer?.full_name || 'EventSphere Host',
            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          },
          capacity: e.capacity || 200,
          registeredCount: e.registered_count || 0,
          featured: Boolean(e.registered_count > 20 || e.capacity >= 500),
        }));
        setLiveEvents(mapped);
      }
    } catch (err) {
      console.warn('Using mock events fallback:', err);
    }
  };

  useEffect(() => {
    fetchLiveEvents();
  }, []);

  const allEvents = useMemo(() => {
    return liveEvents.length > 0 ? liveEvents : MOCK_EVENTS;
  }, [liveEvents]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = {
      All: allEvents.length,
      Technology: 0,
      Music: 0,
      Business: 0,
      'Design & Art': 0,
      'Health & Wellness': 0,
      'Food & Wine': 0,
    };

    allEvents.forEach((e) => {
      if (counts[e.category] !== undefined) {
        counts[e.category]++;
      }
    });

    return counts;
  }, [allEvents]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const matchesSearch =
        searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || event.category === selectedCategory;

      const matchesLocation =
        selectedLocation === '' ||
        event.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
        (selectedLocation.toLowerCase() === 'online' && event.isOnline);

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [allEvents, searchQuery, selectedCategory, selectedLocation]);

  const featuredEvents = useMemo(() => {
    const featured = allEvents.filter((e) => e.featured);
    return featured.length > 0 ? featured : allEvents.slice(0, 2);
  }, [allEvents]);

  const handleSearchSubmit = () => {
    const element = document.getElementById('events-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('');
  };

  return (
    <div className="relative">
      {/* Hero with Search and Filters */}
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Numerical Stats Banner */}
      <StatsSection />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Pill Filters */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
        />

        {/* Featured Events Section (when no search filter is applied) */}
        {searchQuery === '' && selectedCategory === 'All' && selectedLocation === '' && (
          <section className="mt-8 mb-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-outfit text-2xl font-bold text-white tracking-tight">
                  Featured Highlights
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Top trending gatherings from Supabase PostgreSQL
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredEvents.map((event) => (
                <EventCard
                  key={`featured-${event.id}`}
                  event={event}
                  onSelect={(e) => setActiveModalEvent(e)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All / Filtered Events Section */}
        <section id="events-grid" className="mt-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-outfit text-2xl font-bold text-white tracking-tight">
                  {selectedCategory === 'All' ? 'All Upcoming Events' : `${selectedCategory} Events`}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                  {(searchQuery || selectedLocation) && ' matching your search criteria'}
                </p>
              </div>
            </div>

            {(searchQuery || selectedCategory !== 'All' || selectedLocation) && (
              <button
                onClick={handleClearFilters}
                id="btn-clear-filters"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
              >
                <FilterX className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={(e) => setActiveModalEvent(e)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                <FilterX className="w-8 h-8" />
              </div>
              <h3 className="font-outfit text-xl font-bold text-white mb-2">
                No events found
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                We couldn't find any events matching "{searchQuery || selectedCategory || selectedLocation}". Try clearing your filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                View All Events
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Platform Features Section */}
      <FeaturesSection />

      {/* Detail / RSVP Modal */}
      <EventModal
        event={activeModalEvent}
        onClose={() => setActiveModalEvent(null)}
        onRegisteredSuccess={fetchLiveEvents}
      />
    </div>
  );
};
