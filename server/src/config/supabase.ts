import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://qpalwnbnmxotdyrxixmz.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceRoleKey) {
  console.warn('⚠️ [Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not defined in server/.env');
}

// Server-side Supabase client with admin service role permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin.from('categories').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    console.log('✅ Connected to Supabase PostgreSQL database successfully');
    return true;
  } catch (err: any) {
    console.error('❌ Supabase connection failure:', err.message);
    return false;
  }
};

export const ensureEventBannersBucket = async (): Promise<void> => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === 'event-banners');

    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket('event-banners', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/gif',
          'image/svg+xml',
        ],
      });
      if (error) {
        console.error('Failed to create event-banners bucket:', error.message);
      } else {
        console.log('✅ Created event-banners public storage bucket');
      }
    } else {
      console.log('✅ Supabase Storage bucket `event-banners` is ready');
    }
  } catch (err: any) {
    console.warn('Storage bucket check warning:', err.message);
  }
};

