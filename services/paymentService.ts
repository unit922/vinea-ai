
import { PlanTier, Invoice, PaymentMethod, BillingCycle } from '../types';

export const PAYMENT_PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'The Operator',
    price: 0,
    tokens: 1000,
    visionAudits: 5,
    users: 5,
    features: ['Cloud Profiles', 'Basic Inventory AI', 'Standard Coach'],
    color: 'emerald'
  },
  {
    id: 'paid',
    name: 'The Visionary',
    price: 199,
    tokens: 10000,
    visionAudits: 50,
    users: 10,
    features: ['Predictive Analytics', 'Signature Lab', 'Guest Journey AI', 'Multimodal Vision'],
    color: 'amber'
  },
  {
    id: 'enterprise',
    name: 'The Architect',
    price: 899,
    tokens: 100000,
    visionAudits: 500,
    users: 999,
    features: ['Private Silos', 'Global Roster Sync', 'Custom Model Tuning', 'White-label Portal'],
    color: 'blue'
  }
];

export const paymentService = {
  async initiateGatewayCheckout(planId: string, method: PaymentMethod, cycle: BillingCycle): Promise<boolean> {
    console.log(`Initializing ${method} checkout for ${planId} (${cycle})`);
    
    // Simulate API handshakes with specific providers
    return new Promise((resolve) => {
      const delay = method === 'Bank' ? 3000 : 2000;
      setTimeout(() => {
        // Log "successful" simulation
        console.log(`${method} handshake completed for ${cycle} billing.`);
        resolve(true);
      }, delay);
    });
  },

  async simulateStripeCheckout(planId: string): Promise<boolean> {
    return this.initiateGatewayCheckout(planId, 'Stripe', 'Monthly');
  },

  async simulatePayPalConnect(): Promise<boolean> {
    console.log("Connecting PayPal business account...");
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1500);
    });
  },

  async simulatePaddleCheckout(planId: string, cycle: BillingCycle): Promise<boolean> {
    return this.initiateGatewayCheckout(planId, 'Paddle', cycle);
  },

  async getInvoices(): Promise<Invoice[]> {
    return [
      { id: 'INV-3892', date: '2025-03-01', amount: 199, status: 'Paid', method: 'Stripe' },
      { id: 'INV-3744', date: '2025-02-01', amount: 199, status: 'Paid', method: 'PayPal' },
      { id: 'INV-3690', date: '2025-01-01', amount: 199, status: 'Paid', method: 'Debit Card' },
      { id: 'INV-3511', date: '2024-12-01', amount: 899, status: 'Paid', method: 'Bank' },
    ];
  },

  getCurrentPlan(edition: string): PlanTier {
    return PAYMENT_PLANS.find(p => p.id === edition) || PAYMENT_PLANS[0];
  },

  calculatePrice(basePrice: number, cycle: BillingCycle): number {
    if (cycle === 'Annual') {
      // 20% discount for annual
      return Math.floor(basePrice * 12 * 0.8);
    }
    return basePrice;
  }
};
