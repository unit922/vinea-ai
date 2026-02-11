
import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'profile';
}

/**
 * Detects if the application is running in a local development environment.
 */
export const isLocalEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // Prioritize Environment Variables (typically from .env.local or Vercel Build Settings)
  if (envUrl && envKey && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  // Fallback to User Profile stored in LocalStorage
  const profile = localStorage.getItem('vinea_profile');
  if (profile) {
    try {
      const p = JSON.parse(profile);
      if (p.edition === 'demo' && !envUrl) return null;
      if (p.supabaseUrl && p.supabaseAnonKey) {
        return { url: p.supabaseUrl, anonKey: p.supabaseAnonKey, source: 'profile' };
      }
    } catch (e) {
      console.error("Vinea: Profile parse failed", e);
    }
  }
  return null;
};

export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;
  try {
    return createClient(config.url, config.anonKey);
  } catch (e) {
    console.error("Vinea: Supabase Client initialization failed", e);
    return null;
  }
};

export const supabaseSync = {
  async verifySchema() {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, message: 'Supabase configuration is missing or invalid.' };
    try {
      const { error: pingError } = await supabase.from('restaurants').select('id').limit(1);
      if (pingError) {
        if (pingError.code === '42P01') return { success: false, message: 'Connection established, but "restaurants" table is missing.' };
        throw pingError;
      }
      return { success: true, message: 'Cloud Silo verified. Vinea Node active.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Unable to connect to Supabase.' };
    }
  },

  async checkEstablishmentExists(name: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('restaurants').select('id, name').eq('name', name).maybeSingle();
    if (error) throw error;
    return data;
  },

  async registerEstablishment(profile: any) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('restaurants').insert({
      name: profile.name,
      type: profile.type,
      description: profile.description || ''
    }).select().single();
    if (error) throw error;
    return data;
  },

  async pushJourney(journey: any) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    
    // Find restaurant ID by name if not in journey
    let rid = journey.restaurant_id;
    if (!rid) {
      const profileStr = localStorage.getItem('vinea_profile');
      if (profileStr) rid = JSON.parse(profileStr).id;
    }

    const { error } = await supabase.from('guest_journeys').insert({
      restaurant_id: rid,
      arrival_time: journey.arrivalTime,
      guest_name: journey.profile.name,
      guest_email: journey.profile.email,
      preferences: journey.profile.favoriteBeverages,
      dietary_restrictions: journey.profile.dietaryRestrictions,
      pairing_style: journey.profile.pairingStyle,
      special_occasion: journey.specialOccasion,
      status: 'Confirmed'
    });

    if (error) {
      console.error("Vinea: Push Journey failed", error);
      return false;
    }
    return true;
  },

  async pullData(table: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Vinea: Pull data from ${table} failed`, error);
      return null;
    }
    return data;
  },

  async pullJourneys() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('guest_journeys').select('*').order('created_at', { ascending: false });
    if (error) return null;
    
    // Map back to internal GuestJourney type
    return data.map(d => ({
      id: d.id,
      arrivalTime: d.arrival_time,
      status: d.status,
      tableNumber: d.table_number || '??',
      specialOccasion: d.special_occasion,
      profile: {
        name: d.guest_name,
        email: d.guest_email,
        favoriteBeverages: d.preferences,
        dietary_restrictions: d.dietary_restrictions,
        pairing_style: d.pairing_style
      }
    }));
  }
};
