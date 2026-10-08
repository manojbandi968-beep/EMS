import React, { useState } from 'react';
import { Calendar, MapPin, Bookmark, Users, ArrowUpRight, Check } from 'lucide-react';
import type { EventItem } from '../../types/event';

interface EventCardProps {
  event: EventItem;
  onSelect?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const [isSaved, setIsSaved] = useState(false);

  const fillPercentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <div 
      className="group bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col overflow-hidden transform hover:-translate-y-1.5"
      id={`event-card-${event.id}`}
    >
      {/* Image and Badges */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-900/80 backdrop-blur-md text-white border border-slate-700/60">
            {event.category}
          </span>
          {event.badge && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600/90 text-white shadow-sm">
              {event.badge}
            </span>
          )}
        </div>

        {/* Save/Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          id={`btn-bookmark-${event.id}`}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors ${
            isSaved
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
          title={isSaved ? 'Saved to favorites' : 'Save event'}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>

        {/* Price tag pill */}
        <div className="absolute bottom-3 right-3">
          <div className="px-3 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white text-xs font-bold">
            {typeof event.price === 'number' ? `$${event.price}` : event.price}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{event.date} • {event.time}</span>
          </div>

          {/* Title */}
          <h3 className="font-outfit text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {event.title}
          </h3>

          {/* Description */}
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Metadata & Footer */}
        <div className="space-y-3.5 pt-3 border-t border-slate-800/80 text-xs">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Organizer & Capacity progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <img
                  src={event.organizer.avatar}
                  alt={event.organizer.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-slate-300 font-medium">{event.organizer.name}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Users className="w-3 h-3" />
                <span>{event.registeredCount}/{event.capacity}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fillPercentage > 85 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => onSelect && onSelect(event)}
            id={`btn-view-${event.id}`}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600/90 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all group-hover:bg-indigo-600 group-hover:text-white"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
