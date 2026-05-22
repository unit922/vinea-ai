/**
 * Vinetelligence Mews Integration Service
 * 
 * Provides a neural handshake between Vinetelligence nodes and the Mews PMS.
 */

export interface MewsCustomer {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  // Add other relevant fields based on Mews API response
}

export interface MewsReservation {
  Id: string;
  CustomerId: string;
  StartUtc: string;
  EndUtc: string;
  Status: 'Confirmed' | 'Canceled' | 'CheckedIn' | 'CheckedOut';
}

class MewsService {
  private baseUrl = '/api/mews';

  /**
   * Check if the neural link to Mews is configured
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      return await response.json();
    } catch (error) {
      console.error('Mews Neural Link Status Error:', error);
      return { configured: false, status: 'Offline' };
    }
  }

  /**
   * Fetch guest profiles from Mews
   * Useful for palate DNA mapping
   */
  async getCustomers(filter: { Emails?: string[]; CustomerIds?: string[] }) {
    try {
      const response = await fetch(`${this.baseUrl}/customers/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mews Customer Sync Failure');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Mews Customer Sync Error:', error);
      throw error;
    }
  }

  /**
   * Fetch reservations
   * Used to predict service demand and prepare personalized staff briefing
   */
  async getReservations(filter: { StartUtc?: string; EndUtc?: string; States?: string[] }) {
    try {
      const response = await fetch(`${this.baseUrl}/reservations/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mews Reservation Sync Failure');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Mews Reservation Sync Error:', error);
      throw error;
    }
  }

  /**
   * Post a charge (Order) to a guest folio
   * Directly bridges the Bar Station to the Mews Billing engine
   */
  async addOrder(orderData: { 
    CustomerId: string; 
    ServiceId: string; 
    BillId?: string;
    Items: Array<{ ServiceItemId: string; Count: number; Amount?: { Value: number; Currency: string } }>
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/orders/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mews Billing Handshake Failure');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Mews Billing Handshake Error:', error);
      throw error;
    }
  }
}

export const mewsService = new MewsService();
