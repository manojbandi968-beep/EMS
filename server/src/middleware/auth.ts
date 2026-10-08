import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at?: string;
}

export interface AuthenticatedUser extends User {
  role?: string;
  profile?: UserProfile | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware: Verify Supabase Bearer token and attach user to req.user
 */
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token required (Bearer token missing)',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
      });
      return;
    }

    // Verify token using Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({
        success: false,
        message: authError?.message || 'Invalid or expired session token',
      });
      return;
    }

    // Query user profile from profiles table to get up-to-date role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || (user.user_metadata?.role as string) || 'user';

    // Attach to request
    req.user = {
      ...user,
      role,
      profile: profile as UserProfile | null,
    };

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication error: ' + (err.message || 'Server error'),
    });
  }
};

/**
 * Middleware: Enforce administrator role by checking the profiles table
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before checking admin privileges',
      });
      return;
    }

    // Direct database validation from profiles table
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !profile || profile.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Administrator privileges required',
      });
      return;
    }

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed: ' + (err.message || 'Server error'),
    });
  }
};
