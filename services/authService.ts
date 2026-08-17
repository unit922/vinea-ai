
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getSupabaseClient, supabaseSync } from './supabaseSync';

// Flag to explicitly enable/disable Firebase Auth as a fallback
const FIREBASE_ENABLED = isFirebaseConfigured;

export interface VinetelligenceSession {
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
    if (!FIREBASE_ENABLED) {
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
    }

    try {
      // For now, keep Firebase Anonymous Auth for easy demo access
      if (!auth) throw new Error("Firebase Auth not initialized");
      const result = await signInAnonymously(auth);
      return {
        session: {
          user: {
            id: result.user.uid,
            email: null,
            isAnonymous: true,
            user_metadata: { role: 'Guest', full_name: 'Anonymous Guest', restaurant_id: 'demo-id' }
          }
        }
      };
    } catch (error) {
      console.warn("Vinetelligence: Anonymous Auth is restricted on Firebase. Falling back to Local Guest Session instead.", error);
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
    }
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
          console.error("Vinetelligence: verifyEstablishment query error:", error);
          throw error;
        }
        
        console.log("Vinetelligence: verifyEstablishment result:", data);
        if (data) return data;
      } catch (e) {
        console.error("Vinetelligence: Supabase verifyEstablishment failed", e);
      }
    } else {
      console.warn("Vinetelligence: verifyEstablishment called but Supabase client is null");
    }

    if (FIREBASE_ENABLED && db) {
      try {
        // This is a bit complex in Firebase without a global registry, 
        // but let's assume we have a 'restaurants' collection
        const docSnap = await getDoc(doc(db, 'restaurants', name)); // Assuming name is ID or we query
        if (docSnap.exists()) return { id: docSnap.id, name: docSnap.data().name };
      } catch (e) {
        console.error("Vinetelligence: Firebase verifyEstablishment failed", e);
      }
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
          console.log("Vinetelligence: Roster lookup failed or empty, checking secondary ownership for:", normalizedEmail);
          const restaurant = await supabaseSync.getRestaurantProfile(restaurantId).catch(() => null);
          if (restaurant && (restaurant as { owner_email?: string }).owner_email?.toLowerCase().trim() === normalizedEmail) {
            console.log("Vinetelligence: Ownership verified via restaurants.owner_email");
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

          // CRITICAL DUAL REGISTRATION SYNC:
          // If Firebase is initialized, also register the user in Firebase Auth and set their user doc.
          if (auth && db) {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
              const user = userCredential.user;
              await setDoc(doc(db, 'users', user.uid), {
                full_name: fullName,
                restaurant_id: restaurantId,
                role: rosterEntry.role || role,
                email: normalizedEmail
              });
              console.log("Vinetelligence: Synchronized Firebase Auth registration with Supabase registration.");
            } catch (fbErr) {
              console.warn("Vinetelligence: Firebase Auth registration synchronization skipped or failed during Supabase registration.", fbErr);
            }
          }

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
        console.error("Vinetelligence: Supabase SignUp failed", e);
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

    if (!FIREBASE_ENABLED) {
      // Local Fallback for Registration
      const localUsersStr = localStorage.getItem('vinetelligence_local_users') || localStorage.getItem('vinea_local_users');
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
      localStorage.setItem('vinetelligence_local_users', JSON.stringify(localUsers));
      localStorage.setItem('vinea_local_users', JSON.stringify(localUsers));
      localStorage.setItem('vinetelligence_local_session', JSON.stringify(newUser));
      localStorage.setItem('vinea_local_session', JSON.stringify(newUser));

      return {
        session: {
          user: {
            id: newUser.id,
            email: newUser.email,
            user_metadata: newUser.metadata
          }
        }
      };
    }

    try {
      if (!auth || !db) throw new Error("Firebase services not initialized");
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        full_name: fullName,
        restaurant_id: restaurantId,
        role: role,
        email: email
      });

      return {
        session: {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: { full_name: fullName, restaurant_id: restaurantId, role: role }
          }
        }
      };
    } catch (error) {
      console.error("Vinetelligence: Firebase SignUp Error", error);
      throw error;
    }
  },

  async signIn(email: string, pass: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    const supabase = getSupabaseClient();
    console.log("Vinetelligence: Auth attempt with", supabase ? "Supabase Cloud" : "Local Sandbox");

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: pass });
        if (error) throw error;
        if (data.user) {
          console.log("Vinetelligence: Supabase SignIn successful", data.user.id);
          
          // CRITICAL DUAL AUTHENTICATION SYNC: 
          // If Firebase is initialized, also authenticate the user in Firebase Auth using the same credentials.
          // This ensures Firestore security rules (e.g., checking request.auth) work perfectly.
          if (auth) {
            try {
              await signInWithEmailAndPassword(auth, normalizedEmail, pass);
              console.log("Vinetelligence: Synchronized Firebase Auth login with Supabase login.");
            } catch (fbErr) {
              // If user does not exist in Firebase Auth but has logged in successfully in Supabase,
              // we can automatically register them on-the-fly in Firebase Auth to ensure full synchronization.
              const errorObj = fbErr as { code?: string };
              const isUserNotFound = errorObj?.code === 'auth/user-not-found' || 
                                     errorObj?.code === 'auth/invalid-credential' || 
                                     String(fbErr).includes('user-not-found') ||
                                     String(fbErr).includes('invalid-credential');
              
              if (isUserNotFound) {
                console.log("Vinetelligence: Syncing missing Firebase Auth node. Attempting on-the-fly registration...");
                try {
                  const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
                  const user = userCredential.user;
                  if (db) {
                    await setDoc(doc(db, 'users', user.uid), {
                      full_name: data.user.user_metadata?.full_name || "Vinetelligence Node Operator",
                      restaurant_id: data.user.user_metadata?.restaurant_id || "demo-id",
                      role: data.user.user_metadata?.role || "Owner",
                      email: normalizedEmail
                    });
                  }
                  console.log("Vinetelligence: On-the-fly Firebase user registration synchronized successfully.");
                } catch (createErr) {
                  console.error("Vinetelligence: On-the-fly Firebase Auth registration failed.", createErr);
                }
              } else {
                console.warn("Vinetelligence: Firebase Auth synchronization skipped or failed during Supabase login.", fbErr);
              }
            }
          }

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
        console.error("Vinetelligence: Supabase SignIn failed. Full Error Context:", e);
        
        // Canary test: Is the API reachable at all?
        try {
          const canaryTarget = currentConfig?.url || 'Undefined URL';
          fetch(canaryTarget).then(r => {
            console.log(`Vinetelligence: Canary Connectivity Ping [${canaryTarget}]:`, r.ok ? "Success" : "Failed", r.status);
          }).catch(fErr => {
            console.error(`Vinetelligence: Canary Ping [${canaryTarget}] threw immediate fetch error. This is a DNS or Network level failure. Verify URL typos.`, fErr);
          });
        } catch (canaryErr) {
          console.error(`Vinetelligence: Canary Connectivity Ping logic error`, canaryErr);
        }

        const error = e as { message?: string; name?: string; status?: number; code?: string };
        
        // Log extra details for trigger/RLS investigation
        if (error.status === 500) {
          console.error("Vinetelligence: Server-side Error (500) detected. This may be caused by a failing database trigger or RLS policy. Check your Supabase project logs.");
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

    if (!FIREBASE_ENABLED) {
      const hasSupabase = !!supabase;
      
      // Local Fallback for SignIn
      const localUsersStr = localStorage.getItem('vinetelligence_local_users') || localStorage.getItem('vinea_local_users');
      const localUsers = JSON.parse(localUsersStr || '[]') as LocalUser[];
      const localUser = localUsers.find(u => u.email === normalizedEmail && u.password === pass);
      
      if (localUser) {
        localStorage.setItem('vinetelligence_local_session', JSON.stringify(localUser));
        localStorage.setItem('vinea_local_session', JSON.stringify(localUser));
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
        : "System initialization required. If you are on Vercel, ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your project environment variables. Otherwise, configure them in the System Setup menu.";
      throw new Error(msg);
    }

    try {
      if (!auth || !db) throw new Error("Firebase services not initialized");
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const metadata = userDoc.exists() ? userDoc.data() : {};

      return {
        session: {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: metadata
          }
        }
      };
    } catch (error) {
      console.error("Vinetelligence: Firebase SignIn Error", error);
      throw error;
    }
  },

  async signInWithGoogle() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
        // Note: Supabase OAuth usually redirects. For this environment, we might need a popup flow.
        // But let's assume redirect works or we handle it.
      } catch (e) {
        console.error("Vinetelligence: Supabase Google Auth failed", e);
      }
    }

    if (!FIREBASE_ENABLED) {
      throw new Error("Google Authentication is not yet activated for this establishment.");
    }

    const provider = new GoogleAuthProvider();
    try {
      if (!auth || !db) throw new Error("Firebase services not initialized");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          full_name: user.displayName,
          email: user.email,
          role: 'Server',
          restaurant_id: 'demo-id'
        });
      }

      const metadata = (await getDoc(doc(db, 'users', user.uid))).data();

      return {
        user: {
          id: user.uid,
          email: user.email,
          user_metadata: metadata
        }
      };
    } catch (error) {
      console.error("Vinetelligence: Google Auth Error", error);
      throw error;
    }
  },

  async signOut() {
    try {
      const supabase = getSupabaseClient();
      if (supabase) await supabase.auth.signOut();
      if (auth) await firebaseSignOut(auth);
      localStorage.removeItem('vinetelligence_local_session');
      localStorage.removeItem('vinea_local_session');
    } catch (e) {
      console.error("Vinetelligence: SignOut failed", e);
      localStorage.removeItem('vinetelligence_local_session');
      localStorage.removeItem('vinea_local_session'); // Still clear local session
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

  async signInWithOtp(email: string) {
    const supabase = getSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return { success: true };
    }
    throw new Error("One-time login is only available in cloud database mode.");
  },

  async resetPassword(email: string) {
    const supabase = getSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return { success: true };
    }
    throw new Error("Password reset is only available in cloud database mode.");
  },

  async getSession(): Promise<VinetelligenceSession | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase session timeout')), 4000)
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
        console.error("Vinetelligence: Supabase getSession timed out or failed", e);
      }
    }

    // Local Session Fallback
    const localSessionStr = localStorage.getItem('vinetelligence_local_session') || localStorage.getItem('vinea_local_session');
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
        localStorage.removeItem('vinetelligence_local_session');
        localStorage.removeItem('vinea_local_session');
      }
    }

    if (!FIREBASE_ENABLED || !auth || !db) return null;

    const user = auth.currentUser;
    if (!user) return null;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const metadata = userDoc.exists() ? userDoc.data() : {};

    return {
      user: {
        id: user.uid,
        email: user.email,
        user_metadata: metadata
      }
    };
  },

  onAuthChange(callback: (session: VinetelligenceSession | null) => void) {
    const supabase = getSupabaseClient();
    let supabaseSub: { unsubscribe: () => void } | null = null;
    let lastSessionId: string | null = 'INITIAL';

    const debouncedCallback = (newSession: VinetelligenceSession | null) => {
      const newId = newSession ? `${newSession.user.id}-${newSession.user.email}-${JSON.stringify(newSession.user.user_metadata)}` : null;
      if (newId !== lastSessionId) {
        lastSessionId = newId;
        callback(newSession);
      }
    };

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Vinetelligence: Supabase Auth Change", event, !!session);
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
          // If no Supabase session, check Firebase
          this.getSession()
            .then(s => debouncedCallback(s))
            .catch(e => console.error("Vinetelligence: getSession failed in onAuthChange", e));
        }
      });
      supabaseSub = subscription;
    }

    let firebaseUnsub = () => {};
    if (FIREBASE_ENABLED && auth && db) {
      firebaseUnsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const metadata = userDoc.exists() ? userDoc.data() : {};
          debouncedCallback({
            user: {
              id: user.uid,
              email: user.email,
              user_metadata: metadata
            }
          });
        } else {
          // If no Firebase user, check if we have a Supabase session
          const s = await this.getSession();
          if (!s) debouncedCallback(null);
        }
      });
    }

    return () => {
      if (supabaseSub) supabaseSub.unsubscribe();
      firebaseUnsub();
    };
  },
};

