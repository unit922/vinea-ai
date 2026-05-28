
/**
 * Vinetelligence Auth Utilities
 * Centralized logic for administrative and executive access levels.
 */

export const ADMIN_EMAILS = [
  'foritglo@gmail.com',
  'vinetelligence@gmail.com'
];

export const ADMIN_DOMAINS = [
  'vinetelligence.live',
  'vinea.live'
];

/**
 * Checks if an email address belongs to a Vinetelligence Executive/Admin.
 * Must match the RLS policies defined in Supabase.
 */
export function isVinetelligenceAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check exact email matches
  if (ADMIN_EMAILS.includes(normalizedEmail)) return true;
  
  // Check domain matches
  return ADMIN_DOMAINS.some(domain => normalizedEmail.endsWith(`@${domain}`));
}

export const isSystemAdmin = isVinetelligenceAdmin;

