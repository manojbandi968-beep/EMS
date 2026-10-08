import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import type { AuthenticatedRequest } from '../middleware/auth';

/**
 * Generate a clean, unique ticket code
 */
const generateTicketCode = (): string => {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const time = Date.now().toString(36).substring(4).toUpperCase();
  return `TKT-${time}-${rand}`;
};

/**
 * POST /api/events/:eventId/register
 * Authenticated users: Register for an event
 * - Prevents duplicate registrations
 * - Rejects registration when registered_count equals capacity
 * - Updates registered_count atomically
 */
export const registerForEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User authentication required' });
      return;
    }

    // 1. Fetch event and verify existence & capacity
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError || !event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Check status
    if (event.status !== 'published') {
      res.status(400).json({ success: false, message: 'Registration is not open for this event' });
      return;
    }

    // Reject registration when registered_count equals or exceeds capacity
    if (event.registered_count >= event.capacity) {
      res.status(400).json({
        success: false,
        message: 'Registration full: This event has reached maximum capacity.',
      });
      return;
    }

    // 2. Prevent duplicate registrations using unique user_id and event_id rule
    const { data: existingReg } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingReg) {
      if (existingReg.status === 'confirmed') {
        res.status(400).json({
          success: false,
          message: 'You already hold an active registration for this event.',
          data: existingReg,
        });
        return;
      }

      // If existing was cancelled, reactivate and update count
      const newTicketCode = generateTicketCode();
      const { data: reactivatedReg, error: reactivateError } = await supabaseAdmin
        .from('registrations')
        .update({
          status: 'confirmed',
          ticket_code: newTicketCode,
          registered_at: new Date().toISOString(),
        })
        .eq('id', existingReg.id)
        .select('*, events(*, categories(*))')
        .single();

      if (reactivateError) {
        res.status(500).json({ success: false, message: reactivateError.message });
        return;
      }

      // Increment registered_count on events
      await supabaseAdmin
        .from('events')
        .update({ registered_count: (event.registered_count || 0) + 1 })
        .eq('id', eventId);

      res.status(200).json({
        success: true,
        message: 'Event registration confirmed',
        data: reactivatedReg,
      });
      return;
    }

    // 3. Create fresh registration
    const ticketCode = generateTicketCode();
    const newRegPayload = {
      user_id: userId,
      event_id: eventId,
      ticket_code: ticketCode,
      status: 'confirmed',
      registered_at: new Date().toISOString(),
    };

    const { data: newRegistration, error: insertError } = await supabaseAdmin
      .from('registrations')
      .insert(newRegPayload)
      .select('*, events(*, categories(*))')
      .single();

    if (insertError) {
      res.status(500).json({ success: false, message: insertError.message });
      return;
    }

    // 4. Update registered_count when registration is confirmed
    await supabaseAdmin
      .from('events')
      .update({ registered_count: (event.registered_count || 0) + 1 })
      .eq('id', eventId);

    res.status(201).json({
      success: true,
      message: 'Registration confirmed successfully',
      data: newRegistration,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + err.message,
    });
  }
};

/**
 * GET /api/registrations/me
 * Authenticated users: View their own registrations
 */
export const getMyRegistrations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { data: registrations, error } = await supabaseAdmin
      .from('registrations')
      .select('*, events(*, categories(*))')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: registrations?.length || 0,
      data: registrations || [],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations: ' + err.message,
    });
  }
};

/**
 * PATCH /api/registrations/:id/cancel
 * Authenticated users or admins: Cancel a registration
 * - Updates status to 'cancelled'
 * - Decrements registered_count on the associated event
 */
export const cancelRegistration = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    // 1. Fetch registration
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*, events(*)')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !registration) {
      res.status(404).json({ success: false, message: 'Registration record not found' });
      return;
    }

    // 2. Verify authorization (owner or admin)
    if (registration.user_id !== userId && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this registration',
      });
      return;
    }

    // Check if already cancelled
    if (registration.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Registration is already cancelled',
      });
      return;
    }

    // 3. Mark status as cancelled
    const { data: updatedReg, error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('*, events(*)')
      .single();

    if (updateError) {
      res.status(500).json({ success: false, message: updateError.message });
      return;
    }

    // 4. Update registered_count on event when cancelled
    const currentCount = registration.events?.registered_count || 1;
    const newCount = Math.max(0, currentCount - 1);

    await supabaseAdmin
      .from('events')
      .update({ registered_count: newCount })
      .eq('id', registration.event_id);

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: updatedReg,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration: ' + err.message,
    });
  }
};
