import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, MapPin, Users, CheckCircle, Ticket, Share2, Loader2, AlertCircle, LogIn } from 'lucide-react';
import type { EventItem } from '../../types/event';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

interface EventModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRegisteredSuccess?: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onRegisteredSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [registeredTicket, setRegisteredTicket] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event) return null;

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post(`/events/${event.id}/register`);
      if (res.data?.success) {
        setRegisteredTicket(res.data.data?.ticket_code || 'CONFIRMED');
        if (onRegisteredSuccess) onRegisteredSuccess();
      } else {
        setErrorMessage(res.data?.message || 'Failed to complete registration');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            id="btn-close-modal"
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-md">
              {event.category}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-white bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800">
              {typeof event.price === 'number' ? `$${event.price}` : event.price}
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-white">
              {event.title}
            </h2>
            <div className="mt-4 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              About the Event
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Organizer details */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <img
                src={event.organizer.avatar}
                alt={event.organizer.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
              <div>
                <div className="text-xs text-slate-400">Organized by</div>
                <div className="text-sm font-semibold text-white">{event.organizer.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{event.registeredCount} / {event.capacity} attending</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            {registeredTicket ? (
              <div className="w-full p-4 rounded-xl bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Registration Confirmed!</span>
                </div>
                <p>
                  Your Ticket Code: <strong className="font-mono text-white bg-slate-950 px-2 py-0.5 rounded">{registeredTicket}</strong>
                </p>
              </div>
            ) : user ? (
              <button
                onClick={handleRegister}
                disabled={loading || event.registeredCount >= event.capacity}
                id="btn-register-confirm"
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Registration...</span>
                  </>
                ) : event.registeredCount >= event.capacity ? (
                  <span>Sold Out / Capacity Full</span>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Register for Event</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Register</span>
              </button>
            )}

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Event link copied to clipboard!');
              }}
              id="btn-share-event"
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Share event link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
