import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import type { AuthenticatedRequest } from '../middleware/auth';

/**
 * Seed initial sample events if none exist
 */
export const seedEventsIfEmpty = async () => {
  try {
    const { count } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      console.log('🌱 Seeding initial events into Supabase...');

      // Fetch categories to map IDs
      const { data: categories } = await supabaseAdmin.from('categories').select('*');
      if (!categories || categories.length === 0) return;

      const catMap: Record<string, string> = {};
      categories.forEach((c) => {
        catMap[c.slug] = c.id;
      });

      const sampleEvents = [
        {
          title: 'NextGen AI & Cloud Summit 2026',
          description: 'Explore generative AI frontiers, agentic computing, and next-generation cloud architectures with global tech leaders.',
          banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
          category_id: catMap['technology'] || categories[0].id,
          event_date: new Date(Date.now() + 14 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 15 * 86400000).toISOString(),
          venue: 'Metropolitan Convention Hall',
          address: '747 Howard St, San Francisco, CA',
          capacity: 500,
          registered_count: 0,
          status: 'published',
        },
        {
          title: 'Neon Horizon Music Festival',
          description: 'An electrifying multi-stage musical journey featuring international electronic producers, indie acts, and visual arts.',
          banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
          category_id: catMap['music'] || categories[0].id,
          event_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 32 * 86400000).toISOString(),
          venue: 'Waterfront Amphitheater',
          address: '301 Biscayne Blvd, Miami, FL',
          capacity: 2000,
          registered_count: 0,
          status: 'published',
        },
        {
          title: 'Global Founders & VC Pitch Gala',
          description: 'High-impact networking, keynotes from unicorn founders, and curated 1-on-1 pitch sessions with tier-one venture partners.',
          banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
          category_id: catMap['business'] || categories[0].id,
          event_date: new Date(Date.now() + 21 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 21 * 86400000 + 28800000).toISOString(),
          venue: 'Skyline Grand Ballroom',
          address: '233 S Wacker Dr, Chicago, IL',
          capacity: 350,
          registered_count: 0,
          status: 'published',
        },
        {
          title: 'Modern UI/UX & Spatial Design Lab',
          description: 'Hands-on interactive masterclass covering Apple Vision OS design patterns, micro-interactions, and design tokens.',
          banner_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
          category_id: catMap['design-art'] || categories[0].id,
          event_date: new Date(Date.now() + 10 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 10 * 86400000 + 14400000).toISOString(),
          venue: 'Studio Matrix',
          address: 'Online & Seattle Hub, WA',
          capacity: 150,
          registered_count: 0,
          status: 'published',
        },
      ];

      const { error } = await supabaseAdmin.from('events').insert(sampleEvents);
      if (error) console.error('Error seeding events:', error.message);
      else console.log('✅ Initial events seeded successfully');
    }
  } catch (err: any) {
    console.error('Failed to seed events:', err.message);
  }
};

/**
 * GET /api/events
 * Public users can browse published events, search, and filter by category
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, status } = req.query;

    let query = supabaseAdmin
      .from('events')
      .select('*, categories(*)');

    // Filter by status (default: 'published')
    if (status) {
      query = query.eq('status', String(status));
    } else {
      query = query.eq('status', 'published');
    }

    // Filter by category id or slug
    if (category) {
      // Check if it's a UUID or a slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(category));
      if (isUuid) {
        query = query.eq('category_id', String(category));
      }
    }

    // Keyword search on title, description, or venue
    if (search) {
      const s = `%${search}%`;
      query = query.or(`title.ilike.${s},description.ilike.${s},venue.ilike.${s}`);
    }

    // Order by event date ascending
    query = query.order('event_date', { ascending: true });

    const { data: events, error } = await query;

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: events?.length || 0,
      data: events || [],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events: ' + err.message,
    });
  }
};

/**
 * GET /api/events/:id
 * Public endpoint to fetch event details by ID
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*, categories(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Fetch organizer profile info if present
    let organizer = null;
    if (event.organizer_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', event.organizer_id)
        .maybeSingle();
      organizer = profile;
    }

    res.status(200).json({
      success: true,
      data: {
        ...event,
        organizer,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event: ' + err.message,
    });
  }
};

/**
 * POST /api/events
 * Admin only: Create a new event
 */
export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      banner_url,
      category_id,
      event_date,
      end_date,
      venue,
      address,
      capacity,
      status,
    } = req.body;

    // Validation
    if (!title || !category_id || !event_date || !venue || capacity === undefined) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, category_id, event_date, venue, and capacity are mandatory.',
      });
      return;
    }

    const organizer_id = req.user?.id;

    // Verify category exists
    const { data: catCheck } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .maybeSingle();

    if (!catCheck) {
      res.status(400).json({
        success: false,
        message: 'Invalid category_id: category does not exist.',
      });
      return;
    }

    const newEventPayload = {
      title: title.trim(),
      description: description || '',
      banner_url: banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      category_id,
      event_date,
      end_date: end_date || null,
      venue: venue.trim(),
      address: address || '',
      capacity: Number(capacity),
      registered_count: 0,
      status: status || 'published',
      organizer_id,
    };

    const { data: createdEvent, error } = await supabaseAdmin
      .from('events')
      .insert(newEventPayload)
      .select('*, categories(*)')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: createdEvent,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create event: ' + err.message,
    });
  }
};

/**
 * PATCH /api/events/:id
 * Admin only: Update an existing event
 */
export const updateEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Disallow overriding critical computed columns
    delete updates.id;
    delete updates.created_at;
    delete updates.registered_count; // Maintained via registrations

    const { data: updatedEvent, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', id)
      .select('*, categories(*)')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update event: ' + err.message,
    });
  }
};

/**
 * DELETE /api/events/:id
 * Admin only: Delete an event
 */
export const deleteEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Delete associated registrations first to maintain integrity
    await supabaseAdmin
      .from('registrations')
      .delete()
      .eq('event_id', id);

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete event: ' + err.message,
    });
  }
};

/**
 * POST /api/events/upload-banner
 * Admin only: Upload event banner image to Supabase Storage `event-banners` bucket
 * - Permits image files only (PNG, JPG, WEBP, GIF, SVG)
 * - Returns the resulting public URL for saving into events.banner_url
 */
export const uploadEventBanner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.',
      });
      return;
    }

    // Ensure only image files are permitted
    if (!file.mimetype.startsWith('image/')) {
      res.status(400).json({
        success: false,
        message: 'Only image files are permitted (PNG, JPG, JPEG, WEBP, GIF, SVG).',
      });
      return;
    }

    const fileExt = file.originalname.split('.').pop() || 'png';
    const cleanFileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `events/${cleanFileName}`;

    // Upload to Supabase Storage bucket: event-banners
    const { data, error } = await supabaseAdmin.storage
      .from('event-banners')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      res.status(500).json({
        success: false,
        message: 'Supabase Storage upload error: ' + error.message,
      });
      return;
    }

    // Generate public URL from event-banners bucket
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('event-banners')
      .getPublicUrl(data.path);

    res.status(200).json({
      success: true,
      message: 'Event banner uploaded successfully',
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to process banner upload: ' + err.message,
    });
  }
};

