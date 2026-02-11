
import { getSupabaseClient } from './supabaseClient';

export const authService = {
  async verifyEstablishment(name: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Cloud Silo configuration missing.");

    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (error) throw error;
    return data; // Returns { id: string } or null
  },

  async signUp(email: string, pass: string, fullName: string, restaurantId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Cloud Silo configuration missing.");

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { 
          full_name: fullName,
          restaurant_id: restaurantId
        }
      }
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, pass: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Cloud Silo configuration missing.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  async getSession() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthChange(callback: (session: any) => void) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => subscription.unsubscribe();
  }
};
