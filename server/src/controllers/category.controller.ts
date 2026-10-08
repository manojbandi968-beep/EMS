import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const DEFAULT_CATEGORIES = [
  { name: 'Technology', slug: 'technology', description: 'Tech conferences, AI summits, hackathons and developer meetups' },
  { name: 'Music', slug: 'music', description: 'Concerts, music festivals, live DJ sets and acoustic performances' },
  { name: 'Business', slug: 'business', description: 'Networking galas, startup pitches, investor conferences and leadership' },
  { name: 'Design & Art', slug: 'design-art', description: 'UI/UX workshops, spatial computing, art exhibitions and galleries' },
  { name: 'Health & Wellness', slug: 'health-wellness', description: 'Yoga retreats, mindfulness retreats, fitness bootcamps and longevity' },
  { name: 'Food & Wine', slug: 'food-wine', description: 'Culinary expos, wine tastings, chef masterclasses and tastings' },
];

/**
 * Seed initial categories if none exist
 */
export const seedCategoriesIfEmpty = async () => {
  try {
    const { count } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      console.log('🌱 Seeding initial event categories into Supabase...');
      const { error } = await supabaseAdmin.from('categories').insert(DEFAULT_CATEGORIES);
      if (error) console.error('Error seeding categories:', error.message);
      else console.log('✅ Categories seeded successfully');
    }
  } catch (err: any) {
    console.error('Failed to seed categories:', err.message);
  }
};

/**
 * GET /api/categories
 * Public endpoint to list all available event categories
 */
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: categories?.length || 0,
      data: categories || [],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories: ' + err.message,
    });
  }
};
