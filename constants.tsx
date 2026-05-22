
import { InventoryItem, StaffShift, TrainingSession, RetailTransaction, Table, FloorZone, EquipmentStatus, GuestJourney } from './lib/types';

export const APP_VERSION = '3.2.0';
export const CURRENT_YEAR = 2026;
export const INTELLIGENCE_URL_PLACEHOLDER = 'https://intelligence.live';

export const TRIAL_LIMITS = {
  MAX_STAFF: 5,
  MAX_INVENTORY_ITEMS: 30,
  TRIAL_DURATION_DAYS: 14,
};

export const COLORS = {
  primary: '#312e81', // Indigo-900 (Instead of Deep Wine)
  secondary: '#1e1b4b', // Indigo-950
  accent: '#6366f1', // Indigo-500
  bg: '#f8fafc',
  text: '#1e293b'
};

/** 
 * FISCAL COMMAND ENGINE - CONFIGURATION
 * Modify these constants to calibrate the global financial intelligence.
 */
export const FISCAL_ENGINE_CONFIG = {
  TAX_RATE: 0.09,           // 9% Sales Tax
  LABOR_BURN_RATE: 0.22,    // 22% Estimated Labor Cost against Revenue
  OVERHEAD_BURN_RATE: 0.12, // 12% Utilities/Rent/Fixed Costs
  CURRENCY_SYMBOL: '$',
  LOCALE: 'en-US',
  DEFAULT_COGS_FALLBACK: 0.30 // 30% default COGS if inventory data is missing
};

/**
 * FISCAL COMMAND ENGINE - LOGIC
 * Developers can modify these formulas here. 
 * These are used by FinancialHub and Executive Dashboards.
 */
export const FISCAL_ENGINE_LOGIC = {
  calculateTax: (revenue: number) => revenue * FISCAL_ENGINE_CONFIG.TAX_RATE,
  calculateLabor: (revenue: number) => revenue * FISCAL_ENGINE_CONFIG.LABOR_BURN_RATE,
  calculateOverhead: (revenue: number) => revenue * FISCAL_ENGINE_CONFIG.OVERHEAD_BURN_RATE,
  
  // Net Alpha = Revenue - (COGS + Labor + Overhead)
  calculateNetAlpha: (revenue: number, cogs: number) => {
    const expenses = cogs + 
                     FISCAL_ENGINE_LOGIC.calculateLabor(revenue) + 
                     FISCAL_ENGINE_LOGIC.calculateOverhead(revenue);
    return revenue - expenses;
  },

  calculateMargin: (revenue: number, cost: number) => {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  }
};

export const MOCK_JOURNEYS: GuestJourney[] = [
  {
    id: 'j-1',
    arrivalTime: new Date().toISOString(),
    status: 'Confirmed',
    tableNumber: '??',
    profile: {
      name: 'Alexander Mercer',
      location: 'New York, US',
      favoriteBeverages: 'Peated Scotch, Old World Reds',
      dietaryRestrictions: 'None',
      pastOrders: 'Laphroaig 10, Barolo 2016',
      pairingStyle: 'Classic'
    },
    specialOccasion: 'Business Dinner',
    pacingMode: 'Standard'
  },
  {
    id: 'j-2',
    arrivalTime: new Date().toISOString(),
    status: 'Arrived',
    tableNumber: '??',
    profile: {
      name: 'Elena Rossi',
      location: 'Milan, IT',
      favoriteBeverages: 'Negroni, Franciacorta',
      dietaryRestrictions: 'Gluten-Free',
      pastOrders: 'Negroni Sbagliato, Risotto (GF)',
      pairingStyle: 'Adventurous'
    },
    specialOccasion: 'Birthday',
    pacingMode: 'Leisurely'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Cabernet Sauvignon 2018', category: 'Wine', stock: 12, unit: 'Bottles', volumePerUnit: 750, minStock: 24, price: 85, originalPrice: 32, consumed: 0 },
  { id: '2', name: 'Chardonnay Reserve', category: 'Wine', stock: 45, unit: 'Glass', volumePerUnit: 150, minStock: 20, price: 15, originalPrice: 4, consumed: 0 },
  { id: '3', name: 'Premium Gin', category: 'Spirit', stock: 8, unit: 'Liters', volumePerUnit: 1000, minStock: 10, price: 45, originalPrice: 18, consumed: 0 },
  { id: '4', name: 'House Bourbon', category: 'Spirit', stock: 24, unit: 'On the Rocks', volumePerUnit: 60, minStock: 10, price: 18, originalPrice: 5, consumed: 0 },
  { id: '5', name: 'Negroni Pre-mix', category: 'Mixer', stock: 40, unit: 'Mix', volumePerUnit: 45, minStock: 20, price: 12, originalPrice: 3, consumed: 0 },
  { id: '6', name: 'Craft IPA', category: 'Beer', stock: 120, unit: 'Cans', volumePerUnit: 355, minStock: 100, price: 8, originalPrice: 2.5, consumed: 0 },
  { id: '7', name: 'Truffle Popcorn', category: 'Snack', stock: 50, unit: 'Servings', volumePerUnit: 0, minStock: 10, price: 12, originalPrice: 3, consumed: 0 },
  { id: '8', name: 'Charcuterie Board', category: 'Snack', stock: 15, unit: 'Platters', volumePerUnit: 0, minStock: 3, price: 32, originalPrice: 11, consumed: 0 },
  { id: '9', name: 'Wagyu Beef Burger', category: 'Lunch', stock: 20, unit: 'Portions', volumePerUnit: 0, minStock: 5, price: 28, originalPrice: 9, consumed: 0 },
  { id: '10', name: 'Lobster Roll', category: 'Lunch', stock: 15, unit: 'Portions', volumePerUnit: 0, minStock: 3, price: 34, originalPrice: 14, consumed: 0 },
  { id: '11', name: 'Pan-Seared Sea Bass', category: 'Dinner', stock: 12, unit: 'Portions', volumePerUnit: 0, minStock: 4, price: 42, originalPrice: 16, consumed: 0 },
  { id: '12', name: 'Dry-Aged Ribeye', category: 'Dinner', stock: 10, unit: 'Portions', volumePerUnit: 0, minStock: 2, price: 58, originalPrice: 22, consumed: 0 },
  { id: '13', name: 'Signature Negroni', category: 'Cocktail', stock: 25, unit: 'Glass', volumePerUnit: 150, minStock: 10, price: 18, originalPrice: 4.5, consumed: 0 }
];

export const INITIAL_TRANSACTIONS: RetailTransaction[] = [
  {
    id: 'TX-9901',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    tableNumber: '4',
    items: [
      { id: 'it-1', name: 'Cabernet Sauvignon 2018', quantity: 1, priceAtOrder: 85, status: 'Served', prepType: 'Pour', style: 'Wine' },
      { id: 'it-2', name: 'Charcuterie Board', quantity: 1, priceAtOrder: 32, status: 'Served', prepType: 'Complex', style: 'Snack' }
    ],
    subtotal: 117,
    tax: 10.53,
    gratuity: 23.40,
    total: 150.93,
    paymentMethod: 'Stripe',
    guestName: 'Alexander Mercer'
  },
  {
    id: 'TX-9902',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    tableNumber: '2',
    items: [
      { id: 'it-3', name: 'Premium Gin', quantity: 2, priceAtOrder: 45, status: 'Served', prepType: 'Mix', style: 'Spirit' },
      { id: 'it-4', name: 'Artisan Olives', quantity: 1, priceAtOrder: 9, status: 'Served', prepType: 'Pour', style: 'Snack' }
    ],
    subtotal: 99,
    tax: 8.91,
    gratuity: 19.80,
    total: 127.71,
    paymentMethod: 'PayPal',
    guestName: 'Elena Rossi'
  },
  {
    id: 'TX-9903',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    tableNumber: 'V1',
    items: [
      { id: 'it-5', name: 'Chardonnay Reserve', quantity: 2, priceAtOrder: 65, status: 'Served', prepType: 'Pour', style: 'Wine' },
      { id: 'it-6', name: 'Truffle Popcorn', quantity: 2, priceAtOrder: 12, status: 'Served', prepType: 'Pour', style: 'Snack' }
    ],
    subtotal: 154,
    tax: 13.86,
    gratuity: 30.80,
    total: 198.66,
    paymentMethod: 'Stripe',
    guestName: 'Julianne Moore'
  },
  {
    id: 'TX-9904',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    tableNumber: 'Bar',
    items: [
      { id: 'it-7', name: 'Craft IPA', quantity: 4, priceAtOrder: 8, status: 'Served', prepType: 'Pour', style: 'Beer' }
    ],
    subtotal: 32,
    tax: 2.88,
    gratuity: 6.40,
    total: 41.28,
    paymentMethod: 'Cash'
  }
];

export const INITIAL_SHIFTS: StaffShift[] = [
  { id: '1', name: 'Jean-Luc S.', role: 'Sommelier', startTime: '17:00', endTime: '23:00', performanceScore: 94, accessStatus: 'Active', availabilityStatus: 'Available', assignedModules: [{ moduleId: '1', completed: true }, { moduleId: '9', completed: true }, { moduleId: '14', completed: false }, { moduleId: '18', completed: false }, { moduleId: '6', completed: false }, { moduleId: '21', completed: false }, { moduleId: '26', completed: false }, { moduleId: '29', completed: false }, { moduleId: '31', completed: false }, { moduleId: '34', completed: false }] },
  { id: '2', name: 'Maria G.', role: 'Mixologist', startTime: '18:00', endTime: '01:00', performanceScore: 88, accessStatus: 'Active', availabilityStatus: 'Busy', assignedModules: [{ moduleId: '2', completed: true }, { moduleId: '8', completed: false }, { moduleId: '10', completed: false }, { moduleId: '16', completed: false }, { moduleId: '6', completed: false }, { moduleId: '22', completed: false }, { moduleId: '27', completed: false }, { moduleId: '30', completed: false }, { moduleId: '32', completed: false }] },
  { id: '3', name: 'Robert D.', role: 'Server', startTime: '17:30', endTime: '22:30', performanceScore: 82, accessStatus: 'Active', availabilityStatus: 'On Break', assignedModules: [{ moduleId: '3', completed: true }, { moduleId: '4', completed: false }, { moduleId: '17', completed: false }, { moduleId: '19', completed: false }, { moduleId: '11', completed: false }, { moduleId: '23', completed: false }, { moduleId: '28', completed: false }, { moduleId: '33', completed: false }] },
  { id: '4', name: 'Elena V.', role: 'Manager', startTime: '16:00', endTime: '00:00', performanceScore: 96, accessStatus: 'Active', availabilityStatus: 'Available', assignedModules: [{ moduleId: '5', completed: true }, { moduleId: '7', completed: true }, { moduleId: '12', completed: false }, { moduleId: '15', completed: false }, { moduleId: '20', completed: false }, { moduleId: '11', completed: false }, { moduleId: '24', completed: false }, { moduleId: '25', completed: false }, { moduleId: '35', completed: false }] },
  { id: '5', name: 'Marcus A.', role: 'Owner', startTime: '09:00', endTime: '18:00', performanceScore: 100, accessStatus: 'Active', availabilityStatus: 'Available', assignedModules: [{ moduleId: '13', completed: true }] },
  { id: '6', name: 'Sarah L.', role: 'Admin', startTime: '09:00', endTime: '17:00', performanceScore: 92, accessStatus: 'Active', availabilityStatus: 'Available', assignedModules: [{ moduleId: '13', completed: true }] }
];

export const TRAINING_MODULES: TrainingSession[] = [
  { id: '1', topic: 'Old World vs New World Wines', difficulty: 'Intermediate', duration: '20m', completed: true, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '2', topic: 'Advanced Mixology: Clarification', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '3', topic: 'The Art of Guest Interaction', difficulty: 'Beginner', duration: '15m', completed: false, category: 'Service', videoId: 'p_V-Mh7S_vI' },
  { id: '4', topic: 'Luxury Service Etiquette', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '5', topic: 'Inventory Management 101', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '6', topic: 'Spirit Production & Terroir', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Cocktails', videoId: 'M7lc1UVf-VE' },
  { id: '7', topic: 'Intelligence Platform: Operational Command', difficulty: 'Advanced', duration: '35m', completed: false, category: 'Management', videoId: 'jNQXAC9IVRw' },
  { id: '8', topic: 'Sustainable Sourcing & Zero-Waste Bar', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '9', topic: 'Vintage Port & Fortified Wine Mastery', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '10', topic: 'Molecular Gastronomy in Beverage Design', difficulty: 'Advanced', duration: '50m', completed: false, category: 'Cocktails', videoId: 'M7lc1UVf-VE' },
  { id: '11', topic: 'Crisis Management & High-Pressure Service', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '12', topic: 'Digital Inventory & Fiscal Sync', difficulty: 'Beginner', duration: '20m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '13', topic: 'Brand Standards & Global Identity', difficulty: 'Beginner', duration: '15m', completed: true, category: 'Management', videoId: 'jNQXAC9IVRw' },
  { id: '14', topic: 'The Sommelier\'s Digital Ledger', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '15', topic: 'Intelligence: Predictive Analytics', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Management', videoId: 'M7lc1UVf-VE' },
  { id: '16', topic: 'Global Mixology: Cultural Synthesis', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '17', topic: 'Zero-Proof Excellence: The New Standard', difficulty: 'Beginner', duration: '20m', completed: false, category: 'Service', videoId: 'p_V-Mh7S_vI' },
  { id: '18', topic: 'Guest Psychology & Palate Mapping', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '19', topic: 'Facility Health & Asset Longevity', difficulty: 'Beginner', duration: '15m', completed: false, category: 'Service', videoId: 'p_V-Mh7S_vI' },
  { id: '20', topic: 'Retention Intelligence: Data-Driven Hospitality', difficulty: 'Advanced', duration: '50m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '21', topic: 'The Art of Sabrage & Ceremonial Service', difficulty: 'Advanced', duration: '30m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '22', topic: 'Bitters, Tinctures & The Alchemist\'s Toolkit', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '23', topic: 'VIP Protocol: Discretion & High-Net-Worth Excellence', difficulty: 'Advanced', duration: '25m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '24', topic: 'Labor Optimization & Fiscal Burn Rate Control', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '25', topic: 'Platform: AI Ethics & Governance', difficulty: 'Beginner', duration: '20m', completed: false, category: 'Management', videoId: 'jNQXAC9IVRw' },
  { id: '26', topic: 'Advanced Sensory Analysis: The Master\'s Palate', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '27', topic: 'The Chemistry of Carbonation & Effervescence', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '28', topic: 'Crisis Communication: Managing the High-Net-Worth Experience', difficulty: 'Advanced', duration: '35m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '29', topic: 'The Art of Decanting: Ritual & Science', difficulty: 'Intermediate', duration: '20m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '30', topic: 'Ice Sculpting & Crystal Clear Clarity', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '31', topic: 'Cognac & Armagnac: The Spirit of France', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '32', topic: 'The Japanese Highball: Precision & Perfection', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '33', topic: 'Table-Side Preparation: The Flambé Technique', difficulty: 'Advanced', duration: '30m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '34', topic: 'Digital Sommelier: AI-Driven Wine Pairing', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '35', topic: 'Sustainability in Luxury: The Zero-Waste Cellar', difficulty: 'Intermediate', duration: '35m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' }
];

export const INITIAL_TABLES: Table[] = [
  { id: 't0', number: 'Bar', capacity: 1, status: 'Available', x: 0, y: 0, zoneId: 'z1' },
  { id: 't1', number: '1', capacity: 2, status: 'Available', x: 1, y: 1, zoneId: 'z2' },
  { id: 't2', number: '2', capacity: 2, status: 'Available', x: 2, y: 1, zoneId: 'z2' },
  { id: 't3', number: '3', capacity: 4, status: 'Available', x: 1, y: 2, zoneId: 'z2' },
  { id: 't4', number: '4', capacity: 4, status: 'Available', x: 2, y: 2, zoneId: 'z2' },
  { id: 't5', number: '5', capacity: 6, status: 'Available', x: 3, y: 1, zoneId: 'z3' },
  { id: 't6', number: '6', capacity: 2, status: 'Available', x: 3, y: 2, zoneId: 'z3' },
  { id: 't7', number: 'V1', capacity: 4, status: 'Available', x: 1, y: 3, zoneId: 'z4' },
  { id: 't8', number: 'V2', capacity: 4, status: 'Available', x: 2, y: 3, zoneId: 'z4' },
];

export const INITIAL_ZONES: FloorZone[] = [
  { id: 'z1', name: 'Bar Station', tables: ['Bar'], color: 'bg-indigo-500' },
  { id: 'z2', name: 'Main Floor A', tables: ['1', '2', '3', '4'], color: 'bg-emerald-500' },
  { id: 'z3', name: 'Main Floor B', tables: ['5', '6'], color: 'bg-blue-500' },
  { id: 'z4', name: 'Vault VIP', tables: ['V1', 'V2'], color: 'bg-indigo-600' },
  { id: 'z_concierge', name: 'Concierge Station', tables: [], color: 'bg-stone-900 border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' },
];

export const MOCK_EQUIPMENT: EquipmentStatus[] = [
  { id: 'hvac-01', name: 'Main HVAC Unit', type: 'HVAC', healthScore: 92, status: 'Optimal', lastService: '2024-11-15', telemetry: { load: 45 } },
  { id: 'ref-01', name: 'Wine Cellar Cooler', type: 'Refrigeration', healthScore: 78, status: 'Warning', lastService: '2024-08-10', telemetry: { temp: 14.2, vibration: 'High' } },
  { id: 'bar-01', name: 'Draft System Node', type: 'Bar', healthScore: 98, status: 'Optimal', lastService: '2025-01-05', telemetry: { load: 12 } },
  { id: 'ref-02', name: 'Bar Back Chiller', type: 'Refrigeration', healthScore: 64, status: 'Critical', lastService: '2024-05-20', telemetry: { temp: 6.8, vibration: 'Normal' } },
];
