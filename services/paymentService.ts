
import { PlanTier, Invoice, PaymentMethod, BillingCycle } from '../lib/types';

export const PAYMENT_PLANS: PlanTier[] = [
  {
    id: 'operator',
    name: 'The Essential',
    price: 149,
    tokens: 1000000,
    visionAudits: 20,
    users: 5,
    features: ['Basic POS', '30 Inventory Items', 'Standard Dashboard', '5 User Nodes'],
    color: 'emerald'
  },
  {
    id: 'visionary',
    name: 'The Growth',
    price: 499,
    tokens: 10000000,
    visionAudits: 100,
    users: 25,
    features: ['Predictive Analytics', '150 Inventory Items', '25 User Nodes', 'Engagement AI', 'Academy Access'],
    color: 'amber'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 899,
    tokens: 100000000,
    visionAudits: 1000,
    users: 999,
    features: ['Global SaaS Admin', 'Unlimited Inventory', 'Unlimited Staff', 'Investor Portal', 'Custom Training Nodes'],
    color: 'blue'
  }
];

export const paymentService = {
  async initiateGatewayCheckout(planId: string, method: PaymentMethod, cycle: BillingCycle): Promise<{success: boolean, activationCode: string}> {
    console.log(`Vinetelligence Checkout: Initializing ${method} gateway for ${planId} (${cycle})`);
    
    return new Promise((resolve) => {
      // Simulate gateway latency
      const delay = method === 'Bank' || method === 'Cash' ? 3000 : 2000;
      setTimeout(() => {
        const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
        const code = method === 'Cash' ? `ESTB-${planId.slice(0, 3).toUpperCase()}-${randomHex}` : `VNTL-${planId.slice(0, 3).toUpperCase()}-${randomHex}-2026`;
        console.log(`Handshake Successful: Activation node ${code} dispatched via ${method}.`);
        resolve({ success: true, activationCode: code });
      }, delay);
    });
  },

  verifyActivationCode(entered: string, expected: string): boolean {
    return entered.trim().toUpperCase() === expected.toUpperCase();
  },

  async simulateStripeCheckout(planId: string): Promise<boolean> {
    const res = await this.initiateGatewayCheckout(planId, 'Stripe', 'Monthly');
    return res.success;
  },

  async simulatePayPalConnect(): Promise<boolean> {
    console.log("Connecting PayPal business identity...");
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1500);
    });
  },

  async getInvoices(): Promise<Invoice[]> {
    return [
      { id: 'INV-3892', date: '2025-03-01', amount: 499, status: 'Paid', method: 'Stripe' },
      { id: 'INV-3744', date: '2025-02-01', amount: 499, status: 'Paid', method: 'PayPal' },
      { id: 'INV-3690', date: '2025-01-01', amount: 499, status: 'Paid', method: 'Credit & Debit Card' },
      { id: 'INV-3511', date: '2024-12-01', amount: 899, status: 'Paid', method: 'Bank' },
    ];
  },

  getCurrentPlan(edition: string): PlanTier {
    return PAYMENT_PLANS.find(p => p.id === edition) || PAYMENT_PLANS[0];
  },

  calculatePrice(basePrice: number, cycle: BillingCycle): number {
    if (cycle === 'Annual') {
      return Math.floor(basePrice * 12 * 0.8); // 20% Annual Retainer Discount
    }
    return basePrice;
  }
};
