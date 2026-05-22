
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GuestJourney, GuestProfile, RetailTransaction, FacilityAsset, StaffAssignment, ServiceOrder, Table, RestaurantProfile } from '../lib/types';
import { ensureISOString } from '../utils';

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: { url: string, anonKey: string } | null = null;

export const isLocalEnvironment = () => {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const getSupabaseConfig = () => {
  // 1. Check Local Storage (Manual user config / Overrides) - HIGHEST PRIORITY
  if (typeof window !== 'undefined') {
    const profileKey = 'intelligence_profile';
    const stored = localStorage.getItem(profileKey);
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.supabaseUrl && p.supabaseAnonKey) {
          const cleanUrl = p.supabaseUrl.trim().replace(/\/$/, "");
          const cleanKey = p.supabaseAnonKey.trim();
          return { url: cleanUrl, anonKey: cleanKey, isEnvManaged: false, source: 'storage' };
        }
      } catch (e) {
        console.error("Intelligence: Failed to parse stored profile for Supabase config", e);
      }
    }
  }

  // 2. Check Vite environment variables (Managed Cloud Defaults)
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  const viteUrl = import.meta.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  
  if (viteUrl && viteKey) {
    const config = { url: viteUrl, anonKey: viteKey, isEnvManaged: true, source: 'env' };
    console.log(`Intelligence: Initializing with Env Config: ${config.url} (Type: ${config.source})`);
    return config;
  }

  // 3. Check process.env (Node/SSR/Legacy Fallbacks)
  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (envUrl && envKey) {
      return { url: envUrl, anonKey: envKey, isEnvManaged: true, source: 'env' };
    }
  }

  return null;
};

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const config = getSupabaseConfig();

  if (!config) {
    console.warn("Oenovía: No Supabase configuration found");
    return null;
  }

  try {
    const cleanUrl = config.url.trim().replace(/\/$/, "");
    const cleanKey = config.anonKey.trim();
    
    // SSL Enforcement: Mixed Content Guard
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && cleanUrl.startsWith('http:')) {
      console.warn("Intelligence: SSL Mismatch detected. Enforcing HTTPS for Cloud Silo connection.");
      const secureUrl = cleanUrl.replace('http:', 'https:');
      currentConfig = { url: secureUrl, anonKey: cleanKey };
    } else {
      currentConfig = { url: cleanUrl, anonKey: cleanKey };
    }

    supabaseInstance = createClient(currentConfig.url, currentConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'intelligence_auth_session'
      }
    });
    return supabaseInstance;
  } catch (e) {
    console.error("Oenovía: Failed to initialize Supabase client", e);
    return null;
  }
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const isValidUUID = (id: string) => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const VALID_INVENTORY_CATEGORIES = ['Wine', 'Spirit', 'Mixer', 'Beer', 'Garnish', 'Snack', 'Lunch', 'Dinner', 'Cocktail'];

function sanitizeCategory(category: unknown): string {
  if (typeof category !== 'string') return 'Wine';
  if (VALID_INVENTORY_CATEGORIES.includes(category)) return category;
  // Try to match case-insensitively
  const matched = VALID_INVENTORY_CATEGORIES.find(c => c.toLowerCase() === category.toLowerCase());
  return matched || 'Wine';
}

export const supabaseSync = {
  saveSupabaseConfig(url: string, anonKey: string) {
    const profileKey = 'intelligence_profile';
    const profile = localStorage.getItem(profileKey);
    const p = profile ? JSON.parse(profile) : {};
    p.supabaseUrl = url;
    p.supabaseAnonKey = anonKey;
    localStorage.setItem('intelligence_profile', JSON.stringify(p));
    
    // Reset instance to force re-initialization only if config actually changed
    if (currentConfig?.url !== url || currentConfig?.anonKey !== anonKey || !supabaseInstance) {
      currentConfig = { url, anonKey };
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'intelligence_auth_session'
        }
      });
    }
  },

  async getSession() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async runDiagnostics() {
    console.log("Intelligence: Starting Supabase diagnostics...");
    const supabase = getSupabaseClient();
    const config = getSupabaseConfig();
    
    if (!supabase || !config) {
      return { 
        success: false, 
        step: 'Client Initialization', 
        message: 'Supabase client or configuration is missing.' 
      };
    }

    try {
      // 1. Check Schema Existence
      console.log("Intelligence: Diagnostics - Checking schema...");
      const schema = await this.verifySchema();
      if (!schema.success) {
        return { 
          success: false, 
          step: 'Schema Verification', 
          message: schema.message 
        };
      }

      // 2. Check Public Read Access (Restaurants)
      console.log("Intelligence: Diagnostics - Checking public read access...");
      const { error: readError } = await supabase.from('restaurants').select('id').limit(1);
      if (readError) {
        let msg = `Could not read from 'restaurants' table: ${readError.message}`;
        if (readError && (readError as { status?: number }).status === 500) {
          msg = `Server-side Error (500) while reading 'restaurants'. This indicates a failing Database Trigger or RLS policy. Check Supabase logs.`;
        }
        return { 
          success: false, 
          step: 'Public Read Access', 
          message: msg
        };
      }

      // 3. Check Write Access (Staff Roster - requires RLS to allow anon insert for registration)
      // We'll try to insert a dummy record with a non-existent restaurant_id and then delete it
      // Note: This might fail if RLS is strict, which is good to know.
      console.log("Intelligence: Diagnostics - Checking write access (anon)...");
      const dummyId = '00000000-0000-0000-0000-000000000000';
      const { error: writeError } = await supabase
        .from('staff_roster')
        .insert([{ 
          restaurant_id: dummyId, 
          email: 'diagnostics@intelligence.test', 
          role: 'Diagnostic' 
        }])
        .select();
      
      // If we get a 23503 (foreign key violation), it actually means we HAVE write permission 
      // but the restaurant doesn't exist, which is a positive sign for the policy itself.
      // If we get a 42501 (permission denied), then RLS is blocking us.
      if (writeError && writeError.code !== '23503') {
        return { 
          success: false, 
          step: 'Write Access (Anon)', 
          message: `Write access check failed: ${writeError.message} (Code: ${writeError.code})` 
        };
      }

      return { 
        success: true, 
        message: 'All Supabase connectivity and permission checks passed successfully.' 
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown diagnostic error';
      return { success: false, step: 'Exception', message };
    }
  },

  async verifySchema() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Intelligence: verifySchema failed - Supabase client not initialized");
      return { success: false, message: 'Supabase configuration is missing or invalid.' };
    }
    
    try {
      console.log("Intelligence: Verifying Cloud Silo schema...");
      const requiredTables = ['restaurants', 'profiles', 'staff_roster', 'inventory', 'orders', 'order_items', 'guest_journeys'];
      
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise((_, reject) => 
        timeoutId = setTimeout(() => reject(new Error('Schema verification timeout')), 90000)
      );

      const verifyPromise = (async () => {
        try {
          // Verify all tables in parallel for maximum efficiency
          const checks = requiredTables.map(async (table) => {
            console.log(`Intelligence: Checking table '${table}'...`);
            try {
              const { error } = await supabase.from(table).select('id').limit(1);
              
              if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found", which is fine
                // Check if this is a fetch failure wrapped in a Supabase error result
                const isFetchError = error.message?.includes('Failed to fetch') || 
                                    error.message?.includes('TypeError') || 
                                    error.message?.includes('ERR_') ||
                                    !error.code; // Network errors often lack a PG code
                
                if (isFetchError) {
                   // If it's a fetch error but the status is 500, it's a server-side crash
                   if ((error as { status?: number }).status === 500) {
                     throw new Error(`Cloud Silo protocol error (500). This is likely caused by a failing Database Trigger or RLS policy. Please check your Supabase project logs.`);
                   }
                   throw new Error(`Connectivity Error: Unable to reach Cloud Silo at ${currentConfig?.url}. Please verify your network and project URL.`);
                }

                console.error(`Intelligence: Schema verification failed for table ${table}`, error);
                throw new Error(`Table '${table}' is missing or inaccessible. (${error.message})`);
              }
            } catch (innerError: unknown) {
              const err = innerError as { message?: string; name?: string };
              // Catch both direct fetch exceptions and our re-thrown Connectivity Errors
              if (err?.message?.includes('Failed to fetch') || 
                  err?.name === 'TypeError' || 
                  err?.message?.includes('Connectivity Error') ||
                  err?.message?.includes('ERR_')) {
                throw new Error(`Connectivity Error: Unable to reach Cloud Silo at ${currentConfig?.url}. Please verify your network and project URL.`);
              }
              throw innerError;
            }
            console.log(`Intelligence: Table '${table}' verified.`);
          });
          
          await Promise.all(checks);
          return true;
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      })();

      await Promise.race([verifyPromise, timeoutPromise]);
      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown schema verification error';
      if (!message.includes('Connectivity Error')) {
        console.error("Intelligence: Schema verification exception", e);
      } else {
        console.warn("Intelligence: Silo connectivity offline during schema verification.");
      }
      return { success: false, message };
    }
  },

  async checkEstablishmentExists(name: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const trimmedName = name.trim();
    console.log("Intelligence: Checking if establishment exists:", trimmedName);
    
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, tagline, description, type, owner_email, edition, created_at, status, tier, focus, billing_status, mrr')
      .ilike('name', trimmedName)
      .maybeSingle();
      
    if (error) {
      console.error("Intelligence: checkEstablishmentExists error:", error);
      throw error;
    }
    console.log("Intelligence: checkEstablishmentExists result:", data);
    return data;
  },

  async registerEstablishment(profile: { name: string; tagline?: string; description?: string; type: string; ownerEmail?: string; edition?: string; allowGoogleAuth?: boolean }) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not initialized");
    
    const trimmedName = profile.name.trim();
    const slug = generateSlug(trimmedName);
    
    console.log("Intelligence: Registering new establishment:", { 
      name: trimmedName, 
      slug: slug,
      email: profile.ownerEmail,
      edition: profile.edition,
      allowGoogleAuth: profile.allowGoogleAuth
    });
    
    const { data, error } = await supabase
      .from('restaurants')
      .insert([{
        name: trimmedName,
        slug: slug,
        tagline: profile.tagline,
        description: profile.description,
        type: profile.type,
        owner_email: profile.ownerEmail,
        edition: profile.edition || 'standard',
        allow_google_auth: profile.allowGoogleAuth ?? false
      }])
      .select()
      .single();
      
    if (error) {
      console.error("Oenovía: registerEstablishment error:", error);
      if (error.code === '42501') {
        throw new Error("Cloud Silo Permission Denied (RLS). Anonymous establishment registration is restricted. Please ensure the latest SUPABASE_SETUP.sql policies have been applied to your project.");
      }
      throw error;
    }
    console.log("Oenovía: registerEstablishment success:", data);
    return data;
  },

  async addToStaffRoster(restaurantId: string, email: string, role: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not initialized");
    
    // Use upsert to handle cases where the user is already in the roster
    const { data, error } = await supabase
      .from('staff_roster')
      .upsert({
        restaurant_id: restaurantId,
        email: email.toLowerCase().trim(),
        role: role,
        // We don't want to revert status if they are already registered
      }, { 
        onConflict: 'restaurant_id,email',
        ignoreDuplicates: false // We might want to update the role
      })
      .select()
      .single();
      
    if (error) {
      console.error("Intelligence: addToStaffRoster error:", error);
      throw error;
    }
    return data;
  },

  async addToRoster(restaurantId: string, email: string, role: string) {
    return this.addToStaffRoster(restaurantId, email, role);
  },

  async checkRoster(restaurantId: string, email: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('staff_roster')
      .select('id, restaurant_id, email, role, status, created_at')
      .eq('restaurant_id', restaurantId)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async ping() {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('restaurants').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  async findRosterEntry(email: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('staff_roster')
      .select('*, restaurants(id, name)')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error) {
      console.error("Intelligence: findRosterEntry error:", error);
      return null;
    }
    return data;
  },

  async updateRosterStatus(restaurantId: string, email: string, status: 'Pending' | 'Registered') {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from('staff_roster')
      .update({ status })
      .eq('restaurant_id', restaurantId)
      .eq('email', email.toLowerCase().trim());
  },

  async sendInviteEmail(email: string, restaurantName: string, role: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log(`Intelligence: [SIMULATED EMAIL] To: ${email}, Subject: Invitation to join ${restaurantName} as ${role}`);
      return { success: true, message: "Email simulation successful (Local Sandbox)" };
    }

    try {
      // Using OTP as a functional "Invite" mechanism in this environment
      // This triggers a real Supabase Auth email if configured
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            invitation_type: 'staff_join',
            restaurant_name: restaurantName,
            role: role
          }
        }
      });

      if (error) throw error;
      return { success: true, message: "Invitation relay dispatched via Supabase Auth." };
    } catch (e) {
      console.error("Intelligence: Failed to dispatch invite email", e);
      return { success: false, message: "Email relay failed. Ensure Supabase Auth is configured." };
    }
  },

  async sendInvestorNotification(email: string, restaurantName: string, key: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log(`Intelligence: [SIMULATED EMAIL] To: ${email}, Subject: Investor Access for ${restaurantName}. Key: ${key}`);
      return { success: true, message: "Investor notification simulation successful." };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}?view=investor&key=${key}`,
          data: {
            invitation_type: 'investor_access',
            restaurant_name: restaurantName,
            investor_key: key
          }
        }
      });

      if (error) throw error;
      return { success: true, message: "Investor access relay dispatched." };
    } catch (e) {
      console.error("Intelligence: Failed to dispatch investor notification", e);
      return { success: false, message: "Investor relay failed." };
    }
  },

  async getRestaurantProfile(id: string) {
    if (!id) return null;
    
    // Handle special demo IDs
    if (id === 'demo' || id === 'demo-id') {
      return {
        id: 'demo-id',
        name: 'Intelligence Explorer (Demo)',
        type: 'Restaurant',
        focus: 'General',
        description: 'Demo environment',
        edition: 'demo',
        aiPersona: 'technical',
        status: 'Active'
      };
    }

    // Validate UUID format to prevent 400 errors from Supabase
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn(`Intelligence: Invalid UUID format for restaurant profile fetch: ${id}`);
      return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        console.log(`Intelligence: getRestaurantProfile - fetching for rid: ${id} (attempt ${attempt + 1})...`);
        const startTime = Date.now();
        
        const timeoutPromise = new Promise((_, reject) => 
          timeoutId = setTimeout(() => reject(new Error('Profile fetch timeout')), 45000)
        );

        const fetchPromise = (async () => {
          try {
            const result = await supabase
              .from('restaurants')
              .select('id, name, slug, tagline, description, type, owner_email, edition, created_at, status, tier, focus, billing_status, mrr')
              .eq('id', id)
              .maybeSingle();
            return result;
          } catch (e) {
            console.error("Intelligence: fetchPromise background error in getRestaurantProfile", e);
            return { data: null, error: e };
          }
        })();

        const response = await Promise.race([fetchPromise, timeoutPromise]) as { data: Record<string, unknown> | null, error: Error | null };
        if (timeoutId) clearTimeout(timeoutId);

        const { data, error } = response;
        const duration = Date.now() - startTime;

        if (error) {
          console.error(`Intelligence: getRestaurantProfile error (attempt ${attempt + 1}, ${duration}ms):`, error);
          lastError = error;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw error;
        }
        
        console.log(`Intelligence: getRestaurantProfile success (attempt ${attempt + 1}, ${duration}ms):`, data ? (data as Record<string, unknown>).name : 'Not found');
        return data;
      } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error(`Intelligence: getRestaurantProfile exception (attempt ${attempt + 1}):`, e);
        lastError = e;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw e;
      }
    }
    
    console.error("Intelligence: getRestaurantProfile failed after all retries", lastError);
    return null;
  },

  async getRestaurantBySlug(slug: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    console.log("Intelligence: getRestaurantBySlug - fetching for slug:", slug);
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, tagline, description, type, owner_email, edition, created_at, status, tier, focus, billing_status, mrr')
      .eq('slug', slug)
      .maybeSingle();
      
    if (error) {
      console.error("Intelligence: getRestaurantBySlug error:", error);
      throw error;
    }
    return data;
  },

  async getStaffRoster(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    const { data, error } = await supabase
      .from('staff_roster')
      .select('id, restaurant_id, email, role, status, created_at')
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
    return data || [];
  },


  async removeFromStaffRoster(rosterId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('staff_roster')
      .delete()
      .eq('id', rosterId);
    if (error) throw error;
  },

  async getStaffProfiles(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, restaurant_id, full_name, role, avatar_url, performance_score, availability_status, burnout_index, updated_at')
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
    return data || [];
  },

  async updateStaffProfile(profileId: string, updates: Record<string, unknown>) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    if (error) throw error;
  },

  async removeStaffFromEstablishment(profileId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        restaurant_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    if (error) throw error;
  },

  async removeStaffProfile(profileId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);
    if (error) throw error;
  },

  async pushAssignments(restaurantId: string, assignments: StaffAssignment[]) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    // First clear old assignments for this restaurant
    await supabase.from('staff_assignments').delete().eq('restaurant_id', restaurantId);
    
    if (assignments.length === 0) return;

    const mapped = assignments.map(a => ({
      restaurant_id: restaurantId,
      staff_id: a.staffId,
      zone_id: a.zoneId,
      priority: a.priority,
      timestamp: a.timestamp,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('staff_assignments').insert(mapped);
    if (error) throw error;
  },

  async pullAssignments(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    const { data, error } = await supabase
      .from('staff_assignments')
      .select('id, restaurant_id, staff_id, zone_id, priority, timestamp')
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
    
    return (data || []).map(d => ({
      staffId: d.staff_id,
      zoneId: d.zone_id,
      priority: d.priority,
      timestamp: d.timestamp
    }));
  },

  subscribeToAssignments(restaurantId: string, callback: (data: StaffAssignment[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};

    const channel = supabase
      .channel(`staff_assignments:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'staff_assignments',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.pullAssignments(restaurantId);
          callback(data);
        } catch (e) {
          console.error("Oenovía: Error in assignments subscription update", e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async pullInventory(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    if (!isValidUUID(restaurantId)) {
      console.warn("Oenovía: pullInventory - invalid restaurantId", restaurantId);
      return null;
    }
    const { data, error } = await supabase
      .from('inventory')
      .select('id, restaurant_id, name, category, stock, unit, min_stock, price, original_price, description, volume_per_unit, sustainability_score, predicted_demand, consumed, updated_at')
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
    
    // Map snake_case from DB to camelCase for the app
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      stock: Number(item.stock) || 0,
      unit: item.unit,
      minStock: Number(item.min_stock) || 0,
      price: Number(item.price) || 0,
      originalPrice: Number(item.original_price) || 0,
      description: item.description,
      volumePerUnit: Number(item.volume_per_unit) || 750,
      sustainabilityScore: Number(item.sustainability_score) || 0,
      predictedDemand: Number(item.predicted_demand) || 0,
      consumed: Number(item.consumed) || 0
    }));
  },

  async updateInventoryItem(restaurantId: string, item: Record<string, unknown>) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    // Map camelCase to snake_case for the DB
    const mappedItem = {
      id: item.id,
      name: item.name,
      category: sanitizeCategory(item.category),
      stock: item.stock,
      unit: item.unit,
      min_stock: item.minStock,
      price: item.price,
      original_price: item.originalPrice,
      description: item.description,
      volume_per_unit: item.volumePerUnit,
      sustainability_score: item.sustainabilityScore,
      predicted_demand: item.predictedDemand,
      consumed: item.consumed,
      restaurant_id: restaurantId,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('inventory')
      .upsert(mappedItem);
    if (error) throw error;
  },

  async deleteInventoryItem(restaurantId: string, itemId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase
      .from('inventory')
      .delete()
      .match({ id: itemId, restaurant_id: restaurantId });
    
    if (error) throw error;
  },

  async bulkUpdateInventory(restaurantId: string, items: Record<string, unknown>[]) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const mappedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: sanitizeCategory(item.category),
      stock: item.stock,
      unit: item.unit,
      min_stock: item.minStock,
      price: item.price,
      original_price: item.originalPrice,
      description: item.description,
      volume_per_unit: item.volumePerUnit,
      sustainability_score: item.sustainabilityScore,
      predicted_demand: item.predictedDemand,
      consumed: item.consumed,
      restaurant_id: restaurantId,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('inventory')
      .upsert(mappedItems);
    
    if (error) throw error;
  },

  async pullRegistry() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn("Intelligence: pullRegistry - no supabase client");
      return [];
    }

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intelligence: pullRegistry - starting (attempt ${attempt + 1})...`);
        const startTime = Date.now();
        
        // Add a longer safety timeout for the registry fetch
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registry fetch timeout')), 30000)
        );

        // Make the fetch explicit
        const fetchPromise = (async () => {
          console.log("Intelligence: pullRegistry - fetching from 'restaurants' table...");
          const result = await supabase.from('restaurants').select('id, name, slug, tagline, description, type, owner_email, edition, created_at, status, tier, focus, billing_status, mrr');
          return result;
        })().catch(e => {
          console.error("Intelligence: fetchPromise background error in pullRegistry", e);
          return { data: null, error: e };
        });
        
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as { data: Record<string, unknown>[] | null, error: Error | null };

        const duration = Date.now() - startTime;
        if (error) {
          console.error(`Intelligence: pullRegistry - error (attempt ${attempt + 1}, ${duration}ms):`, error);
          lastError = error;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw error;
        }
        
        console.log(`Intelligence: pullRegistry - success (attempt ${attempt + 1}, ${duration}ms), data count:`, data?.length || 0);
        return (data || []).map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          tier: r.edition || 'standard',
          userLimit: r.user_limit || 10,
          status: r.status || 'Active',
          lastPulse: r.last_pulse || 'N/A',
          usageMetric: r.usage_metric || 0,
          billingStatus: r.billing_status || 'Current',
          mrr: r.mrr || 0,
          ownerEmail: r.owner_email
        }));
      } catch (e) {
        console.error(`Intelligence: pullRegistry - exception (attempt ${attempt + 1}):`, e);
        lastError = e;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw e;
      }
    }
    
    console.error("Intelligence: pullRegistry failed after all retries", lastError);
    return [];
  },

  subscribeToRegistry(callback: (data: Record<string, unknown>[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};
    
    const channel = supabase
      .channel('public:restaurants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, async () => {
        try {
          const data = await this.pullRegistry();
          callback(data);
        } catch (e) {
          console.error("Intelligence: Error in registry subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToOrders(restaurantId: string, callback: (data: ServiceOrder[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};
    
    const channel = supabase
      .channel(`public:orders:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.pullOrders(restaurantId);
          callback(data);
        } catch (e) {
          console.error("Intelligence: Error in orders subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  async pullOrders(restaurantId: string): Promise<ServiceOrder[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Intelligence: pullOrders error:", error);
      throw error;
    }

    return (data || []).map(row => this.mapOrderFromDb(row));
  },

  mapOrderFromDb(row: Record<string, unknown>): ServiceOrder {
    return {
      id: String(row.id || ''),
      tableNumber: String(row.table_number || ''),
      serverName: String(row.server_name || ''),
      status: (row.status as ServiceOrder['status']) || 'Pending',
      priority: (row.priority as ServiceOrder['priority']) || 'Normal',
      timestamp: String(row.timestamp || ''),
      total: Number(row.total || 0),
      items: (row.order_items as Record<string, unknown>[] || []).map((item) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        quantity: Number(item.quantity || 0),
        priceAtOrder: Number(item.price_at_order || 0),
        status: (item.status as OrderItem['status']) || 'Pending',
        notes: item.notes ? String(item.notes) : undefined,
        prepType: (item.prep_type as OrderItem['prepType']) || 'Pour',
        style: item.style ? String(item.style) : undefined,
        modifier: item.modifier ? String(item.modifier) : undefined,
        seat: item.seat ? Number(item.seat) : undefined
      }))
    };
  },

  async saveOrder(restaurantId: string, order: ServiceOrder) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    // 1. Save the main order
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: order.id,
        restaurant_id: restaurantId,
        timestamp: ensureISOString(order.timestamp),
        table_number: order.tableNumber,
        server_name: order.serverName,
        status: order.status,
        priority: order.priority,
        total: order.total || 0,
        updated_at: new Date().toISOString()
      });
    
    if (orderError) throw orderError;

    // 2. Save order items if present
    if (order.items && Array.isArray(order.items)) {
      const mappedItems = order.items.map(item => ({
        id: item.id || generateUUID(),
        order_id: order.id,
        name: item.name,
        quantity: item.quantity,
        price_at_order: item.priceAtOrder,
        status: item.status || 'Pending',
        notes: item.notes,
        prep_type: item.prepType,
        style: item.style,
        modifier: item.modifier,
        seat: item.seat
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .upsert(mappedItems, { onConflict: 'id' });

      if (itemsError) {
        console.warn("Intelligence: Failed to sync order items, but main order was saved", itemsError);
      }
    }
  },

  async deleteOrder(restaurantId: string, orderId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    await supabase.from('orders').delete().eq('id', orderId).eq('restaurant_id', restaurantId);
  },

  async pullJourneys(restaurantId: string): Promise<GuestJourney[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    
    const { data, error } = await supabase
      .from('guest_journeys')
      .select('id, restaurant_id, arrival_time, guest_name, guest_email, location, preferences, dietary_restrictions, past_orders, pairing_style, special_occasion, status, table_number, party_size, pacing_mode, facial_id, created_at, updated_at')
      .eq('restaurant_id', restaurantId);
      
    if (error) {
      console.error("Intelligence: pullJourneys error:", error);
      throw error;
    }
    
    return (data || []).map(row => this.mapJourneyFromDb(row));
  },

  mapJourneyFromDb(row: Record<string, unknown>): GuestJourney {
    return {
      id: String(row.id || ''),
      arrivalTime: String(row.arrival_time || ''),
      status: (row.status as GuestJourney['status']) || 'Confirmed',
      tableNumber: String(row.table_number || '??'),
      partySize: Number(row.party_size || 2),
      specialOccasion: row.special_occasion ? String(row.special_occasion) : undefined,
      pacingMode: (row.pacing_mode as GuestJourney['pacingMode']) || 'Standard',
      facialId: row.facial_id ? String(row.facial_id) : undefined,
      profile: {
        name: String(row.guest_name || 'Unknown Guest'),
        email: String(row.guest_email || ''),
        location: String(row.location || 'Unknown'),
        favoriteBeverages: String(row.preferences || ''),
        dietaryRestrictions: String(row.dietary_restrictions || 'None'),
        pairingStyle: (row.pairing_style as GuestProfile['pairingStyle']) || 'Classic',
        pastOrders: String(row.past_orders || 'New Guest')
      }
    };
  },

  subscribeToJourneys(restaurantId: string, callback: (data: GuestJourney[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};
    
    const channel = supabase
      .channel(`public:guest_journeys:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'guest_journeys',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.pullJourneys(restaurantId);
          callback(data);
        } catch (e) {
          console.error("Intelligence: Error in journey subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  async pushJourney(restaurantId: string, journey: GuestJourney) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    try {
      // Map the nested GuestJourney object to the flat Supabase schema
      const mappedData = {
        id: journey.id,
        restaurant_id: restaurantId,
        arrival_time: ensureISOString(journey.arrivalTime),
        guest_name: journey.profile?.name,
        guest_email: journey.profile?.email,
        location: journey.profile?.location,
        preferences: journey.profile?.favoriteBeverages,
        dietary_restrictions: journey.profile?.dietaryRestrictions,
        past_orders: journey.profile?.pastOrders,
        pairing_style: journey.profile?.pairingStyle,
        special_occasion: journey.specialOccasion,
        status: journey.status,
        table_number: journey.tableNumber,
        party_size: journey.partySize || 2,
        pacing_mode: journey.pacingMode,
        facial_id: journey.facialId
      };

      const { error } = await supabase
        .from('guest_journeys')
        .upsert(mappedData);
        
      if (error) {
        console.error("Intelligence: Supabase pushJourney error:", error);
        throw error;
      }
    } catch (e) {
      console.error("Intelligence: pushJourney exception", e);
      throw e;
    }
  },

  async updateGuestJourneyStatus(journeyId: string, status: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !journeyId) return;
    
    try {
      await supabase
        .from('guest_journeys')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', journeyId);
    } catch (e) {
      console.error("Intelligence: Failed to update guest journey status", e);
    }
  },

  async pushPulse(restaurantId: string, usage: number = 0) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          last_pulse: new Date().toISOString(),
          usage_metric: usage
        })
        .eq('id', restaurantId);
      
      if (error) {
        console.error("Intelligence: Pulse update error:", error);
      }
    } catch (e) {
      console.error("Intelligence: Pulse failed", e);
    }
  },

  async saveTransaction(restaurantId: string, tx: RetailTransaction) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    const { error } = await supabase
      .from('transactions')
      .upsert({
        id: tx.id,
        restaurant_id: restaurantId,
        timestamp: ensureISOString(tx.timestamp),
        table_number: tx.tableNumber,
        guest_name: tx.guestName,
        items: tx.items,
        subtotal: tx.subtotal,
        tax: tx.tax,
        gratuity: tx.gratuity,
        total: tx.total,
        payment_method: tx.paymentMethod
      });
    if (error) throw error;
  },

  async deleteTransaction(restaurantId: string, txId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    await supabase.from('transactions').delete().eq('id', txId).eq('restaurant_id', restaurantId);
  },

  async decrementInventoryStock(itemId: string, quantity: number) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    try {
      const { error } = await supabase.rpc('decrement_inventory_stock', {
        item_id: itemId,
        quantity: quantity
      });
      
      if (error) {
        // If the function doesn't exist (PGRST202) or is ambiguous (PGRST203), fall back to manual update
        if (error.code === 'PGRST202' || error.code === 'PGRST203') {
          console.warn(`Intelligence: 'decrement_inventory_stock' RPC ${error.code === 'PGRST202' ? 'not found' : 'ambiguous'}. Falling back to manual update.`);
          
          // Fetch current stock and consumed
          const { data: item, error: fetchError } = await supabase
            .from('inventory')
            .select('stock, consumed')
            .eq('id', itemId)
            .single();
            
          if (fetchError) throw fetchError;
          if (!item) throw new Error("Item not found");
          
          // Update with new stock and consumed
          const newStock = Math.max(0, (item.stock || 0) - quantity);
          const newConsumed = (item.consumed || 0) + quantity;
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ 
               stock: newStock,
               consumed: newConsumed
            })
            .eq('id', itemId);
            
          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }
    } catch (e) {
      console.error("Intelligence: Error in decrementInventoryStock", e);
      throw e;
    }
  },

  async cleanDemoData(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return { success: true };
    
    try {
      console.log(`Intelligence: Initializing deep purge for restaurant: ${restaurantId}`);
      
      // 1. Clean orders (cascades to order_items)
      await supabase.from('orders').delete().eq('restaurant_id', restaurantId);
      
      // 2. Clean guest journeys
      await supabase.from('guest_journeys').delete().eq('restaurant_id', restaurantId);
      
      // 4. Clean tables
      await supabase.from('tables').delete().eq('restaurant_id', restaurantId);
      
      // 5. Clean staff assignments
      await supabase.from('staff_assignments').delete().eq('restaurant_id', restaurantId);
      
      // 6. Clean inventory
      await supabase.from('inventory').delete().eq('restaurant_id', restaurantId);
      
      // 7. Clean transactions
      await supabase.from('transactions').delete().eq('restaurant_id', restaurantId);
      
      // 8. Clean equipment
      await supabase.from('equipment').delete().eq('restaurant_id', restaurantId);
      
      // 9. Clean staff roster (EXCEPT for Owner/Manager/Admin to preserve access)
      // We only delete staff who are NOT owners, managers, or admins
      await supabase.from('staff_roster')
        .delete()
        .eq('restaurant_id', restaurantId)
        .not('role', 'in', '("Owner","Manager","Admin")');

      // 10. Clean profiles (EXCEPT for Owner/Manager/Admin)
      await supabase.from('profiles')
        .delete()
        .eq('restaurant_id', restaurantId)
        .not('role', 'in', '("Owner","Manager","Admin")');

      console.log(`Intelligence: Deep purge completed for restaurant: ${restaurantId}`);
      return { success: true, message: 'Cloud Silo deep purge successful. Operational data removed.' };
    } catch (e) {
      console.error("Intelligence: Deep purge failed", e);
      return { success: false, message: 'Purge failed. Some cloud data may persist.' };
    }
  },

  async deleteRestaurant(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Cloud connection unavailable for termination.' };
    }
    
    if (!isValidUUID(restaurantId)) {
      console.warn(`Intelligence: Termination aborted. ID ${restaurantId} is not a valid cloud UUID.`);
      return { success: false, message: 'Invalid architecture node ID.' };
    }

    if (restaurantId.startsWith('est-')) {
      console.log(`Intelligence: Termination skipped for static/demo node: ${restaurantId}`);
      return { success: true, message: 'Static architecture node preserved.' };
    }
    
    try {
      // 1. Clean all data first (to be safe if cascade is not set)
      const tablesToPurge = [
        'orders', 'guest_journeys', 'tables', 'staff_assignments', 
        'inventory', 'transactions', 'equipment', 'staff_roster', 'saas_ledger', 'profiles'
      ];
      
      for (const table of tablesToPurge) {
        console.log(`Intelligence: Purging table ${table} for restaurant ${restaurantId}`);
        // Note: some tables might not have restaurant_id directly but we try anyway.
        // PostgREST will simply return an error if the column doesn't exist, which we catch.
        const { error: purgeError } = await supabase.from(table).delete().eq('restaurant_id', restaurantId);
        if (purgeError && purgeError.code !== 'PGRST104' && purgeError.code !== '42703') { 
          console.warn(`Intelligence: Purge warning in ${table}: ${purgeError.message} (${purgeError.code})`);
        }
      }
      
      // 2. Delete the restaurant record
      console.log(`Intelligence: Terminating restaurant architecture: ${restaurantId}`);
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);
      
      if (error) {
        console.error("Intelligence: Termination failure:", error.message, error.code, error.details, error.hint);
        return { success: false, message: `Termination failed: ${error.message} (${error.code}). Check RLS for zombie columns like 'user_id'.` };
      }

      return { success: true, message: 'Establishment architecture terminated and purged from cloud.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown Error';
      console.error("Intelligence: Critical failure during termination", err);
      return { success: false, message: `System failure: ${message}` };
    }
  },

  async purgeTestRestaurants() {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, message: 'Supabase not initialized' };
    
    try {
      console.log("Intelligence: Starting global test data purge...");
      const registry = await this.pullRegistry();
      const testRestaurants = registry.filter((r: Record<string, unknown>) => {
        const name = String(r.name || '').toLowerCase();
        return name.includes('test') || 
               name.includes('demo') ||
               name.includes('placeholder');
      });
      
      console.log(`Intelligence: Found ${testRestaurants.length} test restaurants to purge.`);
      
      for (const r of testRestaurants) {
        await this.deleteRestaurant(r.id);
      }
      
      return { success: true, message: `Purged ${testRestaurants.length} test restaurants.` };
    } catch (e) {
      console.error("Intelligence: Global test purge failed", e);
      return { success: false, message: 'Global purge failed.' };
    }
  },

  async getOwnedRestaurantCount(email: string): Promise<number> {
    const supabase = getSupabaseClient();
    if (!supabase || !email) return 0;
    
    try {
      const { count, error } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('owner_email', email);
      
      if (error) throw error;
      return count || 0;
    } catch (e) {
      console.error("Intelligence: Failed to get owned restaurant count", e);
      return 0;
    }
  },

  async purgeOrphanedAuthUsers(secret: string) {
    try {
      console.log("Intelligence: Initiating Orphan Purge Protocol...");
      const response = await fetch('/api/ops/auth-purge-orphans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
        return data;
      } else {
        const text = await response.text();
        console.error("Intelligence: Non-JSON response from purge endpoint:", text.substring(0, 200));
        throw new Error(`Cloud Protocol Error: (Status: ${response.status}). The requested operational endpoint was denied or blocked by the server architecture.`);
      }
    } catch (e) {
      console.error("Intelligence: purgeOrphanedAuthUsers failed", e);
      throw e;
    }
  },

  async purgeAllTestNodes(secret: string) {
    try {
      console.log("Intelligence: Initiating Global Test Node Purge...");
      const response = await fetch('/api/ops/global-test-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);
        return data;
      } else {
        const text = await response.text();
        console.error("Intelligence: Non-JSON response from global purge endpoint:", text.substring(0, 200));
        throw new Error(`Cloud Protocol Error: Server returned non-JSON response.`);
      }
    } catch (e) {
      console.error("Intelligence: purgeAllTestNodes failed", e);
      throw e;
    }
  },

  async updateRestaurantStatus(restaurantId: string, status: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId) || restaurantId.startsWith('est-')) {
      return { success: true };
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/restaurants/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ restaurantId, status })
        });
        
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            return { success: true };
          }
        } else {
          try {
            const errData = await response.json();
            if (errData.error) {
              return { success: false, message: errData.error };
            }
          } catch (parseErr) {
            console.debug("Intelligence: Failed to parse error response JSON", parseErr);
          }
        }
      }
    } catch (e) {
      console.warn("Intelligence: Secure server status update failed, trying client-side fallback...", e);
    }
    
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({ status })
        .eq('id', restaurantId)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { success: false, message: 'Update failed. You may not have permission to modify this node.' };
      }
      
      return { success: true };
    } catch (e) {
      console.error("Intelligence: Update restaurant status failed", e);
      return { success: false, message: 'Update failed.' };
    }
  },

  async getEquipment(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    const { data, error } = await supabase
      .from('equipment')
      .select('id, restaurant_id, name, type, health_score, status, last_service, telemetry, updated_at, created_at')
      .eq('restaurant_id', restaurantId)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async addEquipment(asset: Partial<FacilityAsset>) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('equipment')
      .insert([asset])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateEquipment(id: string, updates: Partial<FacilityAsset>) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEquipment(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not initialized");
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async pullTables(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    
    const { data, error } = await supabase
      .from('tables')
      .select('id, number, capacity, status, occupant_name, zone_id, x, y')
      .eq('restaurant_id', restaurantId)
      .order('number');
      
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      number: row.number,
      capacity: row.capacity,
      status: row.status,
      occupantName: row.occupant_name,
      occupantCount: 0, // Default to 0 since we're not using the column
      zoneId: row.zone_id,
      x: row.x,
      y: row.y
    }));
  },

  async saveTable(restaurantId: string, table: Table) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    const { error } = await supabase
      .from('tables')
      .upsert({
        id: table.id,
        restaurant_id: restaurantId,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        occupant_name: table.occupantName,
        zone_id: table.zoneId,
        x: table.x,
        y: table.y,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
  },

  async pushTables(restaurantId: string, tables: Table[]) {
    return this.bulkUpdateTables(restaurantId, tables);
  },

  async bulkUpdateTables(restaurantId: string, tables: Table[]) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    // 1. Get existing tables to see what to delete
    const { data: existing } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId);
      
    const existingIds = (existing || []).map(t => t.id);
    const newIds = tables.map(t => t.id).filter(id => isValidUUID(id));
    
    const idsToDelete = existingIds.filter(id => !newIds.includes(id));
    
    // 2. Delete removed tables
    if (idsToDelete.length > 0) {
      await supabase
        .from('tables')
        .delete()
        .in('id', idsToDelete);
    }
    
    // 3. Upsert current tables
    const rows = tables.map(t => ({
      id: isValidUUID(t.id) ? t.id : undefined, // Let Supabase generate if not valid UUID
      restaurant_id: restaurantId,
      number: t.number,
      capacity: t.capacity,
      status: t.status,
      occupant_name: t.occupantName,
      zone_id: t.zoneId,
      x: t.x,
      y: t.y,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('tables')
      .upsert(rows);
      
    if (error) throw error;
  },

  subscribeToTables(restaurantId: string, callback: (data: Table[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};
    
    const channel = supabase
      .channel(`public:tables:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tables',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.pullTables(restaurantId);
          callback(data);
        } catch (e) {
          console.error("Intelligence: Error in tables subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  subscribeToRoster(restaurantId: string, callback: (data: StaffRosterItem[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};
    
    const channel = supabase
      .channel(`public:staff_roster:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'staff_roster',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.getStaffRoster(restaurantId);
          callback(data as StaffRosterItem[]);
        } catch (e) {
          console.error("Intelligence: Error in roster subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    };
  },

  subscribeToStaffProfiles(restaurantId: string, callback: (data: StaffProfile[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};
    
    const channel = supabase
      .channel(`public:profiles:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.getStaffProfiles(restaurantId);
          callback(data as StaffProfile[]);
        } catch (e) {
          console.error("Intelligence: Error in profiles subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToInventory(restaurantId: string, callback: (data: InventoryItem[]) => void) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return () => {};
    
    const channel = supabase
      .channel(`public:inventory:${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'inventory',
        filter: `restaurant_id=eq.${restaurantId}`
      }, async () => {
        try {
          const data = await this.pullInventory(restaurantId);
          callback(data);
        } catch (e) {
          console.error("Intelligence: Error in inventory subscription update", e);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  },

  async saveRestaurantProfile(profile: RestaurantProfile) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(profile.id)) return;
    
    const { error } = await supabase
      .from('restaurants')
      .update({
        name: profile.name,
        tagline: profile.tagline,
        description: profile.description,
        type: profile.type,
        focus: profile.focus,
        ai_persona: profile.aiPersona,
        edition: profile.edition,
        status: profile.status,
        allow_google_auth: profile.allowGoogleAuth,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);
      
    if (error) throw error;
  },

  async pullSaaSInvoices(): Promise<Invoice[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('saas_ledger')
      .select(`
        *,
        restaurants (name)
      `)
      .order('billing_date', { ascending: false });
      
    if (error) {
      console.error("Intelligence: Failed to pull SaaS invoices", error);
      return [];
    }
    
    return (data || []).map(row => ({
      id: row.id,
      date: row.billing_date,
      amount: Number(row.amount),
      status: row.status as Invoice['status'],
      method: row.method as Invoice['method'],
      restaurantName: row.restaurants && typeof row.restaurants === 'object' && 'name' in row.restaurants 
        ? String((row.restaurants as { name: string }).name) 
        : 'Unknown'
    }));
  },

  async pullRestaurantInvoices(restaurantId: string): Promise<Invoice[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return [];
    
    const { data, error } = await supabase
      .from('saas_ledger')
      .select('id, restaurant_id, amount, status, method, description, billing_date, created_at')
      .eq('restaurant_id', restaurantId)
      .order('billing_date', { ascending: false });
      
    if (error) {
      console.error("Intelligence: Failed to pull restaurant invoices", error);
      return [];
    }
    
    return (data || []).map(row => ({
      id: row.id,
      date: row.billing_date,
      amount: Number(row.amount),
      status: row.status as Invoice['status'],
      method: row.method as Invoice['method']
    }));
  },

  async pullRestInvoicesCursor(
    restaurantId: string, 
    limitVal = 5, 
    lastBillingDate?: string, 
    lastId?: string
  ): Promise<{ invoices: Invoice[]; hasMore: boolean; lastBillingDate?: string; lastId?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) {
      return { invoices: [], hasMore: false };
    }
    
    let query = supabase
      .from('saas_ledger')
      .select('id, restaurant_id, amount, status, method, description, billing_date, created_at')
      .eq('restaurant_id', restaurantId);

    if (lastBillingDate && lastId) {
      query = query.or(`billing_date.lt.${lastBillingDate},and(billing_date.eq.${lastBillingDate},id.lt.${lastId})`);
    }

    const { data, error } = await query
      .order('billing_date', { ascending: false })
      .order('id', { ascending: false })
      .limit(limitVal + 1);
      
    if (error) {
      console.error("Intelligence: Failed to pull cursor paginated invoices", error);
      return { invoices: [], hasMore: false };
    }

    const hasMore = (data || []).length > limitVal;
    const items = (data || []).slice(0, limitVal);

    const invoices = items.map(row => ({
      id: row.id,
      date: row.billing_date,
      amount: Number(row.amount),
      status: row.status as Invoice['status'],
      method: row.method as Invoice['method']
    }));

    let nextBillingDate: string | undefined;
    let nextId: string | undefined;

    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      nextBillingDate = lastItem.billing_date;
      nextId = lastItem.id;
    }

    return {
      invoices,
      hasMore,
      lastBillingDate: nextBillingDate,
      lastId: nextId
    };
  },

  async recordSaaSPayment(payment: { restaurant_id: string, amount: number, method: string, description?: string }) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    const { error } = await supabase
      .from('saas_ledger')
      .insert([payment]);
      
    if (error) throw error;
  },

  async seedTrialData(restaurantId: string) {
    console.log(`Intelligence: Initializing Deep Seed Protocol for Silo [${restaurantId}]`);
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) throw new Error("Supabase context unavailable or invalid ID");

    try {
      // 1. Seed Inventory
      console.log("Intelligence: Seeding Inventory...");
      const { INITIAL_INVENTORY } = await import('../constants');
      const inventoryRows = INITIAL_INVENTORY.map(item => ({
        id: item.id,
        restaurant_id: restaurantId,
        name: item.name,
        category: item.category,
        stock: item.stock,
        unit: item.unit,
        min_stock: item.minStock,
        price: item.price,
        original_price: item.originalPrice,
        description: item.description || `Premium ${item.category} selection for Intelligence facility.`,
        volume_per_unit: item.volumePerUnit || 750,
        sustainability_score: Math.floor(Math.random() * 40) + 60, // High quality seed
        predicted_demand: Math.floor(Math.random() * 50) + 10,
        updated_at: new Date().toISOString()
      }));

      await supabase.from('inventory').upsert(inventoryRows, { onConflict: 'id' });

      // 2. Seed Staff Roster (Simulated)
      console.log("Intelligence: Seeding Staff Roster...");
      const { INITIAL_SHIFTS } = await import('../constants');
      const rosterRows = INITIAL_SHIFTS.map(s => ({
        restaurant_id: restaurantId,
        email: `${s.name.toLowerCase().replace(/\s/g, '.')}@intelligence.test`,
        role: s.role,
        status: 'Registered'
      }));

      await supabase.from('staff_roster').upsert(rosterRows, { onConflict: 'restaurant_id,email' });

      // 3. Seed Tables
      console.log("Intelligence: Seeding Tables...");
      const { INITIAL_TABLES } = await import('../constants');
      const tableRows = INITIAL_TABLES.map(t => ({
        id: t.id,
        restaurant_id: restaurantId,
        number: t.number,
        capacity: t.capacity,
        status: t.status,
        x: t.x,
        y: t.y,
        zone_id: t.zoneId
      }));

      await supabase.from('tables').upsert(tableRows, { onConflict: 'id' });

      // 4. Seed Guest Journeys
      console.log("Intelligence: Seeding Guest Journeys...");
      const { MOCK_JOURNEYS } = await import('../constants');
      const journeyRows = MOCK_JOURNEYS.map(j => ({
        restaurant_id: restaurantId,
        arrival_time: j.arrivalTime,
        status: j.status,
        party_size: j.partySize || 2,
        table_number: j.tableNumber === '??' ? '4' : j.tableNumber,
        guest_name: j.profile.name,
        guest_email: j.profile.email || `${j.profile.name.toLowerCase().replace(/\s/g, '.')}@guest.com`,
        preferences: typeof j.profile.favoriteBeverages === 'string' ? j.profile.favoriteBeverages : (Array.isArray(j.profile.favoriteBeverages) ? j.profile.favoriteBeverages.join(', ') : ''),
        dietary_restrictions: typeof j.profile.dietaryRestrictions === 'string' ? j.profile.dietaryRestrictions : (Array.isArray(j.profile.dietaryRestrictions) ? j.profile.dietaryRestrictions.join(', ') : ''),
        pairing_style: j.profile.pairingStyle,
        special_occasion: j.specialOccasion,
        pacing_mode: j.pacingMode,
        updated_at: new Date().toISOString()
      }));

      await supabase.from('guest_journeys').upsert(journeyRows, { onConflict: 'restaurant_id,guest_name' });

      return { success: true, message: "Silo successfully seeded with Intelligence trial data packets. Inventory, Roster, Tables, and Journeys are now online."};
    } catch (err) {
      console.error("Intelligence: Seeding Protocol Failure", err);
      throw err;
    }
  },

  async purgeOperationalData(restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !isValidUUID(restaurantId)) return;
    
    // Clear operational data for this restaurant
    const operationalTables = ['orders', 'guest_journeys', 'transactions', 'staff_assignments'];
    
    for (const table of operationalTables) {
      try {
        await supabase.from(table).delete().eq('restaurant_id', restaurantId);
      } catch (e) {
        console.error(`Intelligence: Failed to purge table ${table}`, e);
      }
    }
  },

  async purgeSaaSLedger() {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, message: 'Supabase context unavailable' };
    
    try {
      const { error } = await supabase.from('saas_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return { success: true, message: 'Global Network Ledger purged successfully.' };
    } catch (e) {
      console.error("Intelligence: Global Ledger Purge failed", e);
      return { success: false, message: 'Global Ledger Purge failed.' };
    }
  },

  // LEADS
  async pushLead(lead: { name: string; email: string; establishment?: string; message?: string; type?: string }) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    const { error } = await supabase
      .from('leads')
      .insert([{
        ...lead,
        timestamp: new Date().toISOString()
      }]);
      
    if (error) throw error;
    return true;
  },

  async fetchLeads() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, company, message, timestamp')
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  // ANALYTICS
  async pushAnalyticsPulse(restaurantId: string, type: string, value: number, metadata: Record<string, unknown> = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    const { error } = await supabase
      .from('analytics_pulses')
      .insert([{
        restaurant_id: isValidUUID(restaurantId) ? restaurantId : null,
        type,
        value,
        metadata,
        timestamp: new Date().toISOString()
      }]);
      
    if (error) {
      console.error("Intelligence: Failed to push analytics pulse", error);
    }
  }
};
