/**
 * Vinetelligence QuickBooks Integration Service
 * 
 * Synchronizes beverage intelligence revenue and inventory data with the QuickBooks Online GL.
 */

export interface QuickBooksStatus {
  connected: boolean;
  realmId: string | null;
  lastSync: string | null;
}

export interface ChartOfAccount {
  Id: string;
  Name: string;
  AccountType: string;
}

class QuickBooksService {
  private baseUrl = '/api/quickbooks';

  /**
   * Get the current status of the QuickBooks connection
   */
  async getStatus(): Promise<QuickBooksStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      return await response.json();
    } catch (error) {
      console.error('QuickBooks Status Error:', error);
      return { connected: false, realmId: null, lastSync: null };
    }
  }

  /**
   * Begin the OAuth2 handshake process
   */
  async connect() {
    window.location.href = `${this.baseUrl}/auth`;
  }

  /**
   * Push a sales summary journal entry for a given date range
   */
  async pushSalesSummary(data: { startDate: string; endDate: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/sync/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Sales Sync Failure');
      }
      
      return await response.json();
    } catch (error) {
      console.error('QuickBooks Sales Sync Error:', error);
      throw error;
    }
  }

  /**
   * Fetch relevant Chart of Accounts from QBO for mapping
   */
  async getAccounts(): Promise<ChartOfAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return await response.json();
    } catch (error) {
      console.error('QuickBooks Accounts Fetch Error:', error);
      return [];
    }
  }
}

export const quickbooksService = new QuickBooksService();
