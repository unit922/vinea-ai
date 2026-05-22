/**
 * Utility functions for Vinetelligence AI and Vinea AI
 */

/**
 * Formats a date string or ISO string into a user-friendly time (e.g., 6:00 PM)
 */
export function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '---';
  try {
    // Check if it's already a simple time string like "18:00"
    if (/^\d{2}:\d{2}$/.test(dateStr)) {
      const [hours, minutes] = dateStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        // Try to handle "YYYY-MM-DDTHH:MM:SS" without Z
        const fallbackDate = new Date(dateStr + 'Z');
        if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
        return dateStr;
    }
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date string or ISO string into a user-friendly date and time
 */
export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        const fallbackDate = new Date(dateStr + 'Z');
        if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate.toLocaleString([], { 
                month: 'short', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit' 
            });
        }
        return dateStr;
    }
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates a simple UUID-like string
 */
export function generateUUID(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Ensures a string is in ISO 8601 format for database compatibility.
 * If the string is invalid, it returns the current time in ISO format as a fallback.
 */
export function ensureISOString(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    // Try to handle "YYYY-MM-DDTHH:MM:SS" without Z
    const fallbackDate = new Date(dateStr + 'Z');
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.toISOString();
    }
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
