import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import apiClient from '../api/client';
import {
  Users,
  Calendar,
  Layers,
  RefreshCw,
  PlusCircle,
  Ticket,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import type { UserProfile } from '../types/auth';
import { AdminEventModal } from '../components/admin/AdminEventModal';

export const AdminPage: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'registrations'>('events');

  // Success notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);

  // Data states
  const [profilesList, setProfilesList] = useState<UserProfile[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [registrationsList, setRegistrationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    confirmedRegistrations: 0,
    totalCategories: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch dashboard metrics
      const dashRes = await apiClient.get('/admin/dashboard').catch(() => null);
      if (dashRes?.data?.data?.stats) {
        setStats(dashRes.data.data.stats);
      }

      // 2. Fetch events (all statuses)
      const eventsRes = await apiClient.get('/events?status=all').catch(() => null);
      if (eventsRes?.data?.data) {
        setEventsList(eventsRes.data.data);
      }

      // 3. Fetch user profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profData) {
        setProfilesList(profData as UserProfile[]);
      }

      // 4. Fetch admin registrations
      const regRes = await apiClient.get('/admin/registrations').catch(() => null);
      if (regRes?.data?.data) {
        setRegistrationsList(regRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for ?create=true query or location state to open create modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if ((location.state as any)?.openCreateModal || params.get('create') === 'true') {
      setActiveTab('events');
      handleOpenCreateModal();
    }
  }, [location.search, location.state]);

  const handleEventSaved = (msg?: string) => {
    fetchData();
    setSuccessMessage(msg || (eventToEdit ? 'Event updated successfully!' : 'Event created successfully!'));
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) return;

    try {
      await apiClient.delete(`/events/${id}`);
      fetchData();
      setSuccessMessage(`Event "${title}" was deleted.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleOpenCreateModal = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              Admin Console
            </span>
            <span className="text-xs text-slate-400">Supabase Storage Integrated</span>
          </div>
          <h1 className="font-outfit text-3xl font-extrabold text-white mt-2">
            Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as administrator: <strong className="text-white">{profile?.full_name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            id="btn-admin-create-event"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          id="admin-success-banner"
          className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-emerald-950/40 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Total Events</span>
          </div>
          <div className="font-outfit text-2xl sm:text-3xl font-bold text-white">
            {stats.totalEvents || eventsList.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Registered Users</span>
          </div>
          <div className="font-outfit text-2xl sm:text-3xl font-bold text-white">
            {stats.totalUsers || profilesList.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Ticket className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Active Registrations</span>
          </div>
          <div className="font-outfit text-2xl sm:text-3xl font-bold text-white">
            {stats.confirmedRegistrations || registrationsList.filter(r => r.status === 'confirmed').length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Categories</span>
          </div>
          <div className="font-outfit text-2xl sm:text-3xl font-bold text-white">
            {stats.totalCategories || 6}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'events'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Events ({eventsList.length})
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'registrations'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Registrations ({registrationsList.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Users ({profilesList.length})
        </button>
      </div>

      {/* Tab 1: Events Management */}
      {activeTab === 'events' && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-outfit text-lg font-bold text-white">Manage Events</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Banners stored in Supabase Storage (`event-banners` bucket)
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>

          {eventsList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No events found. Click "Create Event" above to create your first event with a custom banner!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Banner</th>
                    <th className="px-6 py-3 font-semibold">Title & Category</th>
                    <th className="px-6 py-3 font-semibold">Venue & Date</th>
                    <th className="px-6 py-3 font-semibold">Capacity</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {eventsList.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-850/40">
                      {/* Banner thumbnail */}
                      <td className="px-6 py-4">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 relative group shrink-0">
                          {e.banner_url ? (
                            <img
                              src={e.banner_url}
                              alt={e.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          {e.banner_url && (
                            <a
                              href={e.banner_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open original banner in new tab"
                              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <ExternalLink className="w-3 h-3 text-white" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{e.title}</div>
                        <span className="text-[10px] text-purple-400 font-medium">
                          {e.categories?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Venue & Date */}
                      <td className="px-6 py-4">
                        <div className="text-slate-300">{e.venue}</div>
                        <div className="text-[11px] text-slate-500">
                          {e.event_date ? new Date(e.event_date).toLocaleDateString() : 'TBD'}
                        </div>
                      </td>

                      {/* Capacity & Registered */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{e.registered_count || 0}</span>
                        <span className="text-slate-500"> / {e.capacity}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            e.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Event & Banner"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(e.id, e.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Registrations */}
      {activeTab === 'registrations' && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-outfit text-lg font-bold text-white">All Event Registrations</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live attendee check-ins and ticket codes</p>
          </div>

          {registrationsList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No attendee registrations recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Ticket Code</th>
                    <th className="px-6 py-3 font-semibold">Attendee Name</th>
                    <th className="px-6 py-3 font-semibold">Event</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {registrationsList.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/40">
                      <td className="px-6 py-4 font-mono font-bold text-purple-300">
                        {r.ticket_code}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {r.profiles?.full_name || 'Anonymous User'}
                      </td>
                      <td className="px-6 py-4">{r.events?.title || 'Unknown Event'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            r.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {r.registered_at ? new Date(r.registered_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-outfit text-lg font-bold text-white">Users in `profiles` Table</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rows synchronized upon Supabase Auth registration</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">User ID</th>
                  <th className="px-6 py-3 font-semibold">Full Name</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {profilesList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/40">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{p.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{p.full_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          p.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Event Modal with Supabase Storage Banner Upload */}
      <AdminEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventSaved={handleEventSaved}
        eventToEdit={eventToEdit}
      />
    </div>
  );
};
