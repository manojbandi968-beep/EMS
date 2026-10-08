import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  CheckCircle2,
  Ticket,
  MapPin,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

export const ProfilePage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMyRegistrations = async () => {
    setLoadingRegistrations(true);
    setActionMessage(null);
    try {
      const res = await apiClient.get('/registrations/me');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRegistrations(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch user registrations:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to load your event registrations.',
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  const handleCancelRegistration = async (id: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) {
      return;
    }

    setCancellingId(id);
    setActionMessage(null);

    try {
      const res = await apiClient.patch(`/registrations/${id}/cancel`);
      if (res.data?.success) {
        setActionMessage({
          type: 'success',
          text: `Registration for "${eventTitle}" cancelled. Available seats updated.`,
        });
        await fetchMyRegistrations();
      } else {
        setActionMessage({
          type: 'error',
          text: res.data?.message || 'Failed to cancel registration.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to cancel registration.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Account Profile Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-bold text-white">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-white">
                  {profile?.full_name || 'Event Enthusiast'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  profile?.role === 'admin' 
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                }`}>
                  {profile?.role || 'user'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            id="btn-profile-logout"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-800/60 transition-colors text-xs font-semibold self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
              <User className="w-4 h-4" />
              <span>Full Name</span>
            </div>
            <p className="text-sm font-medium text-white">{profile?.full_name || 'N/A'}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-2">
              <Shield className="w-4 h-4" />
              <span>Role in Profiles Table</span>
            </div>
            <p className="text-sm font-medium text-white capitalize">{profile?.role || 'user'}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
              <Calendar className="w-4 h-4" />
              <span>Account ID</span>
            </div>
            <p className="text-xs font-mono text-slate-300 truncate" title={user?.id}>{user?.id}</p>
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-8 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Authenticated via Supabase Auth with an active, persistent session.</span>
        </div>
      </div>

      {/* My Registrations Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Ticket className="w-4 h-4" />
              </div>
              <h2 className="font-outfit text-xl sm:text-2xl font-bold text-white">
                My Registrations
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Confirmed tickets, event passes, and booking status
            </p>
          </div>

          <button
            onClick={fetchMyRegistrations}
            disabled={loadingRegistrations}
            id="btn-refresh-registrations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRegistrations ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Action feedback toast / alert */}
        {actionMessage && (
          <div
            className={`mt-6 p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Content State */}
        <div className="mt-6">
          {loadingRegistrations ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Loading your registrations...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 px-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-base font-bold text-white mb-1">
                No active event registrations
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                You haven't registered for any events yet. Browse our live catalog to discover exciting conferences and meetups!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const event = reg.events;
                const isConfirmed = reg.status === 'confirmed';
                const isCancelling = cancellingId === reg.id;

                return (
                  <div
                    key={reg.id}
                    id={`reg-card-${reg.id}`}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    {/* Left: Thumbnail & Event Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      {event?.banner_url ? (
                        <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center text-indigo-400 shrink-0">
                          <Ticket className="w-6 h-6" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isConfirmed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {reg.status}
                          </span>
                          {event?.categories?.name && (
                            <span className="text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded-md bg-purple-950/30 border border-purple-800/30">
                              {event.categories.name}
                            </span>
                          )}
                        </div>

                        <h3 className="font-outfit text-base sm:text-lg font-bold text-white leading-snug">
                          {event?.title || 'Unknown Event'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                          {event?.event_date && (
                            <div className="flex items-center gap-1 text-indigo-300">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(event.event_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {event?.venue && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[150px] sm:max-w-[220px]">{event.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Ticket code and Action */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Ticket Pass Code
                        </div>
                        <div className="font-mono text-sm sm:text-base font-extrabold text-indigo-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 inline-block mt-0.5">
                          {reg.ticket_code}
                        </div>
                      </div>

                      {isConfirmed && (
                        <button
                          onClick={() => handleCancelRegistration(reg.id, event?.title || 'Event')}
                          disabled={isCancelling}
                          id={`btn-cancel-reg-${reg.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-rose-800/40 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Registration</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
