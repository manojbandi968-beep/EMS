import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AdminEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSaved: () => void;
  eventToEdit?: any | null;
}

export const AdminEventModal: React.FC<AdminEventModalProps> = ({
  isOpen,
  onClose,
  onEventSaved,
  eventToEdit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number>(200);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  // Banner image states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string>('');

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch categories when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await apiClient.get('/categories');
        if (res.data?.data) {
          setCategories(res.data.data);
          if (!categoryId && res.data.data.length > 0) {
            setCategoryId(res.data.data[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  // Populate fields if editing
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setCategoryId(eventToEdit.category_id || '');
      setVenue(eventToEdit.venue || '');
      setAddress(eventToEdit.address || '');
      setCapacity(eventToEdit.capacity || 200);
      setStatus(eventToEdit.status || 'published');
      setExistingBannerUrl(eventToEdit.banner_url || '');
      setPreviewUrl(eventToEdit.banner_url || null);
      if (eventToEdit.event_date) {
        const d = new Date(eventToEdit.event_date);
        setEventDate(d.toISOString().slice(0, 16));
      }
      if (eventToEdit.end_date) {
        const d = new Date(eventToEdit.end_date);
        setEndDate(d.toISOString().slice(0, 16));
      }
    } else {
      // Defaults
      setTitle('');
      setDescription('');
      setVenue('');
      setAddress('');
      setCapacity(200);
      setStatus('published');
      setSelectedFile(null);
      setPreviewUrl(null);
      setExistingBannerUrl('');
      const defaultDate = new Date(Date.now() + 7 * 86400000);
      setEventDate(defaultDate.toISOString().slice(0, 16));
      const defaultEndDate = new Date(Date.now() + 7 * 86400000 + 14400000);
      setEndDate(defaultEndDate.toISOString().slice(0, 16));
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle Banner File Selection with strict image-only validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];

    if (!file) return;

    // Strict validation: permit image files only
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Invalid file type: Only image files (PNG, JPG, WEBP, GIF, SVG) are permitted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Maximum size is 10 MB.');
      return;
    }

    setSelectedFile(file);

    // Create immediate local object URL for preview before saving
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearBanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingBannerUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !categoryId || !eventDate || !venue.trim() || !capacity) {
      setErrorMessage('Please fill out all mandatory fields (Title, Category, Date, Venue, Capacity).');
      return;
    }

    setSubmitting(true);
    let finalBannerUrl = existingBannerUrl;

    try {
      // 1. If a new banner was chosen, upload to Supabase Storage `event-banners` bucket
      if (selectedFile) {
        setUploadStatus('Uploading banner to Supabase Storage (event-banners)...');

        const formData = new FormData();
        formData.append('banner', selectedFile);

        const uploadRes = await apiClient.post('/events/upload-banner', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadRes.data?.data?.publicUrl) {
          finalBannerUrl = uploadRes.data.data.publicUrl;
        } else {
          throw new Error('Banner upload did not return a valid public URL');
        }
      }

      setUploadStatus('Saving event metadata...');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        banner_url: finalBannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        category_id: categoryId,
        event_date: new Date(eventDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        venue: venue.trim(),
        address: address.trim(),
        capacity: Number(capacity),
        status,
      };

      if (eventToEdit) {
        await apiClient.patch(`/events/${eventToEdit.id}`, payload);
      } else {
        await apiClient.post('/events', payload);
      }

      onEventSaved();
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save event. Please try again.'
      );
    } finally {
      setSubmitting(false);
      setUploadStatus(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-outfit text-xl font-bold text-white">
                {eventToEdit ? 'Edit Event' : 'Create New Event'}
              </h2>
              <p className="text-xs text-slate-400">
                Admin console • Supabase Storage Banner Upload
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Banner Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Event Banner (Supabase Storage: event-banners bucket)</span>
              </label>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleClearBanner}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Remove banner
                </button>
              )}
            </div>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview & Upload Dropzone */}
            {previewUrl ? (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-700 aspect-video bg-slate-950">
                <img
                  src={previewUrl}
                  alt="Event Banner Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                  <p className="text-xs text-white font-medium">Selected Banner Preview</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg transition-all"
                  >
                    Change Image
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-[11px] text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Preview Ready • Will save to events.banner_url</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-750 hover:border-purple-500/60 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Click to upload event banner
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Permitted image formats: PNG, JPG, JPEG, WEBP, GIF, SVG (up to 10 MB)
                </p>
                <p className="text-[11px] text-purple-400/80 mt-2 font-mono">
                  Stored directly in Supabase Storage `event-banners` bucket
                </p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Agents & NextGen Cloud Summit 2026"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {loadingCategories && <option value="">Loading categories...</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Publication Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="published">Published (Visible to public)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the agenda, speakers, keynote highlights, or experiences..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Date, Time & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Start Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>End Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Venue Name *</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Metropolitan Convention Center"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Physical Address / Online Link
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="747 Howard St, San Francisco, CA"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Capacity (Maximum Attendees) *</span>
              </label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {uploadStatus && (
                <span className="inline-flex items-center gap-1.5 text-purple-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{uploadStatus}</span>
                </span>
              )}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Event...</span>
                  </>
                ) : (
                  <span>{eventToEdit ? 'Save Changes' : 'Create Event'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
