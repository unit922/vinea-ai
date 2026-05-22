
import { getSupabaseClient, supabaseSync } from './supabaseSync';

// Flag to explicitly enable/disable Firebase Auth as a fallback - DEPRECATED: Moving to Supabase alone
// const FIREBASE_ENABLED = false;

export interface Session {
  user: {
    id: string;
    email: string | null;
    email_verified?: boolean;
    isAnonymous?: boolean;
    user_metadata?: {
      role?: string;
      full_name?: string;
      restaurant_id?: string;
      tier?: string;
    }
  }
}

interface LocalUser {
  id: string;
  email: string;
  password?: string;
  metadata: {
    full_name?: string;
    restaurant_id?: string;
    role?: string;
  };
}

export const authService = {
  async signInAnonymously() {
    return {
      session: {
        user: {
          id: 'demo-guest-' + Math.random().toString(36).substr(2, 9),
          email: null,
          isAnonymous: true,
          user_metadata: { role: 'Guest', full_name: 'Demo Guest', restaurant_id: 'demo-id' }
        }
      }
    };
  },

  async verifyEstablishment(name: string) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const trimmedName = name.trim();
        
        // Use ilike for case-insensitive matching to improve UX
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, allow_google_auth')
          .ilike('name', trimmedName)
          .maybeSingle();
          
        if (error) {
          console.error("Intelligence: verifyEstablishment query error:", error);
          throw error;
        }
        
        console.log("Intelligence: verifyEstablishment result:", data);
        if (data) return data;
      } catch (e) {
        console.error("Intelligence: Supabase verifyEstablishment failed", e);
      }
    } else {
      console.warn("Intelligence: verifyEstablishment called but Supabase client is null");
    }

    return null;
  },

  async signUp(email: string, pass: string, fullName: string, restaurantId: string, role: string = 'Server', avatarUrl?: string) {
    const supabase = getSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();

    if (supabase) {
      try {
        // 1. Verify if the user is in the staff roster for this establishment
        let rosterEntry = await supabaseSync.checkRoster(restaurantId, normalizedEmail).catch(() => null);
        
        // Secondary verification: Check if they are the direct owner listed in the restaurant record
        // This is a critical fallback if staff_roster RLS blocks anonymous initialization
        if (!rosterEntry) {
          console.log("Intelligence: Roster lookup failed or empty, checking secondary ownership for:", normalizedEmail);
          const restaurant = await supabaseSync.getRestaurantProfile(restaurantId).catch(() => null);
          if (restaurant && (restaurant as { owner_email?: string }).owner_email === normalizedEmail) {
            console.log("Intelligence: Ownership verified via restaurants.owner_email");
            rosterEntry = { role: 'Owner' };
          }
        }

        // If no authorization found, block registration
        if (!rosterEntry) {
          throw new Error("This email has not been authorized for this establishment. Please contact your administrator.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: pass,
          options: {
            data: {
              full_name: fullName,
              restaurant_id: restaurantId,
              role: rosterEntry.role || role,
              avatar_url: avatarUrl
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered') || error.status === 422) {
            throw new Error("USER_ALREADY_REGISTERED");
          }
          throw error;
        }
        
        if (data.user) {
          // Update roster status to 'Registered'
          await supabaseSync.updateRosterStatus(restaurantId, normalizedEmail, 'Registered');

          // If session is present, it's a direct login (e.g. email confirmation disabled)
          if (data.session) {
            return {
              session: {
                user: {
                  id: data.user.id,
                  email: data.user.email || null,
                  user_metadata: data.user.user_metadata
                }
              }
            };
          }
          
          // Otherwise, it's a pending confirmation
          return { session: null };
        }
        return { session: null };
      } catch (e: unknown) {
        console.error("Intelligence: Supabase SignUp failed", e);
        const error = e as { message?: string };
        const errorMsg = error.message || "";
        if (errorMsg.includes('profiles_full_name_key') || errorMsg.includes('23505')) {
          throw new Error("This Operational ID (Full Name) is already registered. Please use a unique identifier or contact your administrator.");
        }
        if (errorMsg) {
          throw new Error(errorMsg);
        }
        throw e;
      }
    }

    // Local Fallback for Registration
    const localUsersStr = localStorage.getItem('intelligence_local_users') || localStorage.getItem('vinetelligence_local_users');
    const localUsers = JSON.parse(localUsersStr || '[]') as LocalUser[];
      if (localUsers.find(u => u.email === email.toLowerCase().trim())) {
        throw new Error("This email is already registered locally.");
      }

      const newUser = {
        id: 'local-' + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase().trim(),
        password: pass, // In a real app, this would be hashed
        metadata: {
          full_name: fullName,
          restaurant_id: restaurantId,
          role: role
        }
      };

      localUsers.push(newUser);
      localStorage.setItem('intelligence_local_users', JSON.stringify(localUsers));
      localStorage.setItem('intelligence_local_session', JSON.stringify(newUser));

      return {
        session: {
          user: {
            id: newUser.id,
            email: newUser.email,
            user_metadata: newUser.metadata
          }
        }
      };
  },

  async signIn(email: string, pass: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    const supabase = getSupabaseClient();
    console.log("Intelligence: Auth attempt with", supabase ? "Supabase Cloud" : "Local Sandbox");

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: pass });
        if (error) throw error;
        if (data.user) {
          console.log("Intelligence: Supabase SignIn successful", data.user.id);
          return {
            session: {
              user: {
                id: data.user.id,
                email: data.user.email || null,
                user_metadata: data.user.user_metadata
              }
            }
          };
        }
      } catch (e: unknown) {
        console.error("Intelligence: Supabase SignIn failed. Full Error Context:", e);
        
        // Canary test: Is the API reachable at all?
        try {
          const { getSupabaseConfig } = await import('./supabaseSync');
          const currentConfig = getSupabaseConfig();
          const canaryTarget = currentConfig?.url || 'Undefined URL';
          fetch(canaryTarget).then(r => {
            console.log(`Intelligence: Canary Connectivity Ping [${canaryTarget}]:`, r.ok ? "Success" : "Failed", r.status);
          }).catch(fErr => {
            console.error(`Intelligence: Canary Ping [${canaryTarget}] threw immediate fetch error. This is a DNS or Network level failure. Verify URL typos.`, fErr);
          });
        } catch (canaryErr) {
          console.error(`Intelligence: Canary Connectivity Ping logic error`, canaryErr);
        }

        const error = e as { message?: string; name?: string; status?: number; code?: string };
        
        // Log extra details for trigger/RLS investigation
        if (error.status === 500) {
          console.error("Intelligence: Server-side Error (500) detected. This may be caused by a failing database trigger or RLS policy. Check your Supabase project logs.");
        }

        // If it's a specific Supabase error, throw it so the user sees it
        if (error.message) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error("Invalid credentials for this establishment. Please verify your email and password.");
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error("Your email address has not been confirmed. Please check your inbox for a verification link.");
          }
          
          // Better messaging for fetch failures which might be masked 500s
          if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            throw new Error("Connectivity or Protocol Error: The server could not be reached or returned an invalid response. This often happens if a database trigger fails or if there's a CORS issue. Please verify your Supabase Auth/Database logs.");
          }

          throw new Error(`Supabase Auth Error: ${error.message}`);
        }
        throw e;
      }
    }

    const hasSupabase = !!supabase;
    
    // Local Fallback for SignIn
    const localUsersStr = localStorage.getItem('intelligence_local_users') || localStorage.getItem('vinetelligence_local_users');
    const localUsers = JSON.parse(localUsersStr || '[]') as LocalUser[];
    const localUser = localUsers.find(u => u.email === normalizedEmail && u.password === pass);
    
    if (localUser) {
      localStorage.setItem('intelligence_local_session', JSON.stringify(localUser));
      return {
        session: {
          user: {
            id: localUser.id,
            email: localUser.email,
            user_metadata: localUser.metadata
          }
        }
      };
    }

    const msg = hasSupabase 
      ? "Authentication failed. Please check your credentials or contact support."
      : "System initialization required. Please configure your Supabase context in the System Setup menu.";
    throw new Error(msg);
  },

  async signInWithGoogle() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
      } catch (e) {
        console.error("Intelligence: Supabase Google Auth failed", e);
      }
    }

    throw new Error("Google Authentication is not yet activated for this establishment via Supabase.");
  },

  async signOut() {
    try {
      const supabase = getSupabaseClient();
      if (supabase) await supabase.auth.signOut();
      localStorage.removeItem('intelligence_local_session');
    } catch (e) {
      console.error("Intelligence: SignOut failed", e);
      localStorage.removeItem('intelligence_local_session'); // Still clear local session
    }
  },

  async updateUserMetadata(metadata: Record<string, unknown>) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });
    
    if (error) throw error;
    return data;
  },

  async linkToEstablishment(restaurantId: string, email: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    // Verify authorization
    let rosterEntry = await supabaseSync.checkRoster(restaurantId, email).catch(() => null);
    if (!rosterEntry) {
      const restaurant = await supabaseSync.getRestaurantProfile(restaurantId).catch(() => null);
      if (restaurant && (restaurant as { owner_email?: string }).owner_email === email) {
        rosterEntry = { role: 'Owner' };
      }
    }

    if (!rosterEntry) {
      throw new Error("You are not authorized for this establishment. Please request an invitation from the owner.");
    }

    // Update metadata
    await this.updateUserMetadata({
      restaurant_id: restaurantId,
      role: rosterEntry.role || 'Server'
    });

    // Mark as registered in roster
    await supabaseSync.updateRosterStatus(restaurantId, email, 'Registered');

    return true;
  },

  async getSession(): Promise<Session | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase session timeout')), 20000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: { user: { id: string; email?: string; user_metadata: Record<string, unknown>; email_confirmed_at?: string } } | null } };
        
        if (session?.user) {
          return {
            user: {
              id: session.user.id,
              email: session.user.email || null,
              email_verified: !!(session.user as { email_confirmed_at?: string }).email_confirmed_at,
              user_metadata: session.user.user_metadata
            }
          };
        }
      } catch (e) {
        console.error("Intelligence: Supabase getSession timed out or failed", e);
      }
    }

    // Local Session Fallback
    const localSessionStr = localStorage.getItem('intelligence_local_session') || localStorage.getItem('vinetelligence_local_session');
    if (localSessionStr) {
      try {
        const localUser = JSON.parse(localSessionStr) as LocalUser;
        return {
          user: {
            id: localUser.id,
            email: localUser.email,
            user_metadata: localUser.metadata
          }
        };
      } catch {
        localStorage.removeItem('intelligence_local_session');
      }
    }

    return null;
  },

  onAuthChange(callback: (session: Session | null) => void) {
    const supabase = getSupabaseClient();
    let supabaseSub: { unsubscribe: () => void } | null = null;
    let lastSessionId: string | null = 'INITIAL';

    const debouncedCallback = (newSession: Session | null) => {
      const newId = newSession ? `${newSession.user.id}-${newSession.user.email}-${JSON.stringify(newSession.user.user_metadata)}` : null;
      if (newId !== lastSessionId) {
        lastSessionId = newId;
        callback(newSession);
      }
    };

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Intelligence: Supabase Auth Change", event, !!session);
        if (session?.user) {
          debouncedCallback({
            user: {
              id: session.user.id,
              email: session.user.email || null,
              email_verified: !!(session.user as { email_confirmed_at?: string }).email_confirmed_at,
              user_metadata: session.user.user_metadata
            }
          });
        } else {
          // If no Supabase session, check local
          this.getSession()
            .then(s => debouncedCallback(s))
            .catch(e => console.error("Intelligence: getSession failed in onAuthChange", e));
        }
      });
      supabaseSub = subscription;
    }

    return () => {
      if (supabaseSub) supabaseSub.unsubscribe();
    };
  },
};

