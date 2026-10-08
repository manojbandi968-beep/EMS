import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import type { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/admin/registrations
 * Admin only: View all registrations across all events and users
 */
export const getAllRegistrations = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { data: registrations, error } = await supabaseAdmin
      .from('registrations')
      .select('*, events(*, categories(*)), profiles(*)')
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
      message: 'Failed to retrieve admin registrations: ' + err.message,
    });
  }
};

/**
 * GET /api/admin/dashboard
 * Admin only: Overview metrics and recent activity
 */
export const getAdminDashboard = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // 1. Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Total events
    const { count: totalEvents } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true });

    // 3. Total registrations (confirmed)
    const { count: confirmedRegistrations } = await supabaseAdmin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    // 4. Total categories
    const { count: totalCategories } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // 5. Recent events (top 5)
    const { data: recentEvents } = await supabaseAdmin
      .from('events')
      .select('*, categories(*)')
      .order('created_at', { ascending: false })
      .limit(5);

    // 6. Recent registrations (top 5)
    const { data: recentRegistrations } = await supabaseAdmin
      .from('registrations')
      .select('*, events(*), profiles(*)')
      .order('registered_at', { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers || 0,
          totalEvents: totalEvents || 0,
          confirmedRegistrations: confirmedRegistrations || 0,
          totalCategories: totalCategories || 0,
        },
        recentEvents: recentEvents || [],
        recentRegistrations: recentRegistrations || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to compile admin dashboard data: ' + err.message,
    });
  }
};
