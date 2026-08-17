
import { InventoryItem, StaffShift, TrainingSession, RetailTransaction, Table, FloorZone, EquipmentStatus, GuestJourney } from './lib/types';

export const APP_VERSION = '3.1.0';
export const CURRENT_YEAR = 2026;
export const VINETELLIGENCE_PROMO_URL_PLACEHOLDER = 'https://vinetelligence.live';

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
  { id: '7', topic: 'Vinetelligence Platform: Operational Intelligence', difficulty: 'Advanced', duration: '35m', completed: false, category: 'Management', videoId: 'jNQXAC9IVRw' },
  { id: '8', topic: 'Sustainable Sourcing & Zero-Waste Bar', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '9', topic: 'Vintage Port & Fortified Wine Mastery', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '10', topic: 'Molecular Gastronomy in Beverage Design', difficulty: 'Advanced', duration: '50m', completed: false, category: 'Cocktails', videoId: 'M7lc1UVf-VE' },
  { id: '11', topic: 'Crisis Management & High-Pressure Service', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '12', topic: 'Digital Inventory & Fiscal Sync', difficulty: 'Beginner', duration: '20m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '13', topic: 'Vinetelligence Brand Standards & Global Identity', difficulty: 'Beginner', duration: '15m', completed: true, category: 'Management', videoId: 'jNQXAC9IVRw' },
  { id: '14', topic: 'The Sommelier\'s Digital Ledger', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '15', topic: 'Vinetelligence Intelligence: Predictive Analytics', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Management', videoId: 'M7lc1UVf-VE' },
  { id: '16', topic: 'Global Mixology: Cultural Synthesis', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '17', topic: 'Zero-Proof Excellence: The New Standard', difficulty: 'Beginner', duration: '20m', completed: false, category: 'Service', videoId: 'p_V-Mh7S_vI' },
  { id: '18', topic: 'Guest Psychology & Palate Mapping', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '19', topic: 'Facility Health & Asset Longevity', difficulty: 'Beginner', duration: '15m', completed: false, category: 'Service', videoId: 'p_V-Mh7S_vI' },
  { id: '20', topic: 'Retention Intelligence: Data-Driven Hospitality', difficulty: 'Advanced', duration: '50m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '21', topic: 'The Art of Sabrage & Ceremonial Service', difficulty: 'Advanced', duration: '30m', completed: false, category: 'Wine', videoId: 'fD_6V_e1-yY' },
  { id: '22', topic: 'Bitters, Tinctures & The Alchemist\'s Toolkit', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Cocktails', videoId: 'XmX46Ym_X9g' },
  { id: '23', topic: 'VIP Protocol: Discretion & High-Net-Worth Excellence', difficulty: 'Advanced', duration: '25m', completed: false, category: 'Service', videoId: '6_fNf0N_o8A' },
  { id: '24', topic: 'Labor Optimization & Fiscal Burn Rate Control', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Management', videoId: 'EngW7tLk6R8' },
  { id: '25', topic: 'Vinetelligence Platform: AI Ethics & Governance', difficulty: 'Beginner', duration: '20m', completed: false, category: 'Management', videoId: 'jNQXAC9IVRw' },
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

export const RUTH_CHRIS_INVENTORY: InventoryItem[] = [
  { id: 'rc-1', name: 'Prime Filet Mignon', category: 'Dinner', stock: 45, unit: 'Portions', volumePerUnit: 0, minStock: 10, price: 64, originalPrice: 19.84, consumed: 0, description: "Elegant 11-ounce cut of tender, USDA Prime beef, broiled in our custom 1800°F infrared oven and served on a sizzling 500°F plate with butter." },
  { id: 'rc-2', name: 'Prime Ribeye', category: 'Dinner', stock: 35, unit: 'Portions', volumePerUnit: 0, minStock: 10, price: 72, originalPrice: 22.32, consumed: 0, description: "An outstanding 16-ounce USDA Prime cut, heavily marbled for rich marbling, juicy flavor, and incredible tenderness, served sizzling hot." },
  { id: 'rc-3', name: 'Prime New York Strip', category: 'Dinner', stock: 40, unit: 'Portions', volumePerUnit: 0, minStock: 10, price: 68, originalPrice: 21.08, consumed: 0, description: "Highly flavorful 16-ounce USDA Prime cut, boasting a firm texture and rich, full beef flavor, finished on a sizzling plate with melted butter." },
  { id: 'rc-4', name: 'Cold Water Lobster Tail', category: 'Dinner', stock: 20, unit: 'Portions', volumePerUnit: 0, minStock: 5, price: 58, originalPrice: 17.98, consumed: 0, description: "Succulent cold water lobster tail, seasoned with savory spices, lightly broiled and served sizzling alongside hand-drawn butter." },
  { id: 'rc-5', name: 'Chilean Sea Bass', category: 'Dinner', stock: 25, unit: 'Portions', volumePerUnit: 0, minStock: 5, price: 48, originalPrice: 14.88, consumed: 0, description: "Wild-caught pan-roasted Sea Bass, served over a rich citrus-infused butter sauce and garnished with fresh baby field greens and aromatics." },
  { id: 'rc-6', name: 'Garlic Mashed Potatoes', category: 'Snack', stock: 60, unit: 'Servings', volumePerUnit: 0, minStock: 15, price: 14, originalPrice: 4.34, consumed: 0, description: "Creamy Idaho potatoes whipped smooth with roasted garlic cloves and sweet Wisconsin cream butter, served sizzling hot." },
  { id: 'rc-7', name: 'Creamed Spinach', category: 'Snack', stock: 55, unit: 'Servings', volumePerUnit: 0, minStock: 15, price: 14, originalPrice: 4.34, consumed: 0, description: "A legendary New Orleans recipe, chopped baby spinach cooked slow in a velvety cream sauce with fresh nutmeg accents." },
  { id: 'rc-13', name: 'Sweet Potato Casserole', category: 'Snack', stock: 50, unit: 'Servings', volumePerUnit: 0, minStock: 12, price: 15, originalPrice: 4.65, consumed: 0, description: "Our most famous steakhouse side: creamy whipped sweet potatoes with brown sugar and spices, baked under a crunchy toasted pecan-brown sugar crust." },
  { id: 'rc-14', name: 'Sizzling Blue Crab Cakes', category: 'Dinner', stock: 30, unit: 'Portions', volumePerUnit: 0, minStock: 8, price: 28, originalPrice: 8.68, consumed: 0, description: "Two jumbo lump Maryland-style crab cakes, spiced lightly and baked, served sizzling in a pool of hot lemon butter." },
  { id: 'rc-8', name: 'Caymus Cab glass', category: 'Wine', stock: 12, unit: 'Glass', volumePerUnit: 150, minStock: 6, price: 48, originalPrice: 10.08, consumed: 0, description: "Napa Valley Cabernet Sauvignon boasting deep core fruit flavors, chocolate aromatics, and velvety-textured tannins. Ideal with Prime Ribeye." },
  { id: 'rc-9', name: 'Silver Oak Cab Bottle', category: 'Wine', stock: 40, unit: 'Bottles', volumePerUnit: 750, minStock: 12, price: 160, originalPrice: 33.60, consumed: 0, description: "Prestigious Oakville Cabernet Sauvignon, aged in American oak. Presents aromatics of fresh red plum, sage, vanilla, and roasted coffee." },
  { id: 'rc-10', name: 'Veuve Clicquot Champagne glass', category: 'Wine', stock: 18, unit: 'Glass', volumePerUnit: 150, minStock: 6, price: 26, originalPrice: 5.46, consumed: 0, description: "Yellow Label Brut Champagne, showing excellent structure, freshness, and bright persistent bubbles with stone-fruit and brioche notes." },
  { id: 'rc-11', name: 'Premium Gin Martini', category: 'Cocktail', stock: 50, unit: 'Glass', volumePerUnit: 120, minStock: 10, price: 22, originalPrice: 4.62, consumed: 0, description: "Hendrick's dry gin, cold vermouth mist, stirred over double-filtered ice, strained, and garnished with premium blue cheese-stuffed olives." },
  { id: 'rc-12', name: 'Old Fashioned Cocktail', category: 'Cocktail', stock: 45, unit: 'Glass', volumePerUnit: 125, minStock: 10, price: 24, originalPrice: 5.04, consumed: 0, description: "Small-batch Woodford Reserve Bourbon, Angostura bitters, demerara sugar syrup, finished with a fresh orange peel twist and premium cherry." }
];

export const RUTH_CHRIS_TRANSACTIONS: RetailTransaction[] = [
  {
    id: 'TX-RC001',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    tableNumber: '1',
    items: [
      { id: 'it-rc1', name: 'Prime Filet Mignon', quantity: 2, priceAtOrder: 64, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-rc2', name: 'Garlic Mashed Potatoes', quantity: 1, priceAtOrder: 14, status: 'Served', prepType: 'Complex', style: 'Snack' },
      { id: 'it-rc3', name: 'Silver Oak Cab Bottle', quantity: 1, priceAtOrder: 160, status: 'Served', prepType: 'Pour', style: 'Wine' }
    ],
    subtotal: 302,
    tax: 27.18,
    gratuity: 60.40,
    total: 389.58,
    paymentMethod: 'Credit & Debit Card',
    guestName: 'Richard Henderson'
  },
  {
    id: 'TX-RC002',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    tableNumber: '4',
    items: [
      { id: 'it-rc4', name: 'Prime Ribeye', quantity: 1, priceAtOrder: 72, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-rc5', name: 'Cold Water Lobster Tail', quantity: 1, priceAtOrder: 58, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-rc6', name: 'Caymus Cab glass', quantity: 2, priceAtOrder: 48, status: 'Served', prepType: 'Pour', style: 'Wine' },
      { id: 'it-rc7', name: 'Creamed Spinach', quantity: 1, priceAtOrder: 14, status: 'Served', prepType: 'Complex', style: 'Snack' }
    ],
    subtotal: 240,
    tax: 21.60,
    gratuity: 48.00,
    total: 309.60,
    paymentMethod: 'Stripe',
    guestName: 'Sarah Jenkins'
  },
  {
    id: 'TX-RC003',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    tableNumber: 'V1',
    items: [
      { id: 'it-rc8', name: 'Prime New York Strip', quantity: 3, priceAtOrder: 68, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-rc9', name: 'Garlic Mashed Potatoes', quantity: 2, priceAtOrder: 14, status: 'Served', prepType: 'Complex', style: 'Snack' },
      { id: 'it-rc10', name: 'Creamed Spinach', quantity: 1, priceAtOrder: 14, status: 'Served', prepType: 'Complex', style: 'Snack' },
      { id: 'it-rc11', name: 'Veuve Clicquot Champagne glass', quantity: 4, priceAtOrder: 26, status: 'Served', prepType: 'Pour', style: 'Wine' },
      { id: 'it-rc12', name: 'Old Fashioned Cocktail', quantity: 2, priceAtOrder: 24, status: 'Served', prepType: 'Pour', style: 'Cocktail' }
    ],
    subtotal: 398,
    tax: 35.82,
    gratuity: 79.60,
    total: 513.42,
    paymentMethod: 'Credit & Debit Card',
    guestName: 'Marshall Carter'
  },
  {
    id: 'TX-RC004',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    tableNumber: 'Bar',
    items: [
      { id: 'it-rc13', name: 'Premium Gin Martini', quantity: 3, priceAtOrder: 22, status: 'Served', prepType: 'Mix', style: 'Cocktail' },
      { id: 'it-rc14', name: 'Cold Water Lobster Tail', quantity: 1, priceAtOrder: 58, status: 'Served', prepType: 'Complex', style: 'Dinner' }
    ],
    subtotal: 124,
    tax: 11.16,
    gratuity: 24.80,
    total: 159.96,
    paymentMethod: 'Apple Pay'
  }
];

export const CANLIS_INVENTORY: InventoryItem[] = [
  { id: 'canlis-1', name: 'Canlis Salad', category: 'Snack', stock: 50, unit: 'Servings', volumePerUnit: 0, minStock: 15, price: 26, originalPrice: 6.50, consumed: 0, description: "Classic Romain, bacon, Romano, mint, oregano, and a fresh dressing. The legendary recipe served since 1950." },
  { id: 'canlis-2', name: 'Twice-Baked Potato', category: 'Snack', stock: 45, unit: 'Servings', volumePerUnit: 0, minStock: 12, price: 18, originalPrice: 4.00, consumed: 0, description: "Whipped smooth potato with melted cheese, chives, sour cream, and bacon, finished tableside." },
  { id: 'canlis-3', name: 'Dry-Aged Duck', category: 'Dinner', stock: 30, unit: 'Portions', volumePerUnit: 0, minStock: 8, price: 72, originalPrice: 22.00, consumed: 0, description: "Dry-aged for 14 days, lavender-honey glazed, roasted crisp, served with huckleberry jus." },
  { id: 'canlis-4', name: 'Wagyu Beef Filet', category: 'Dinner', stock: 25, unit: 'Portions', volumePerUnit: 0, minStock: 8, price: 95, originalPrice: 28.50, consumed: 0, description: "Snake River Farms American Wagyu, char-broiled, with wild chanterelles and bone marrow reduction." },
  { id: 'canlis-5', name: 'Dungeness Crab', category: 'Dinner', stock: 20, unit: 'Portions', volumePerUnit: 0, minStock: 5, price: 52, originalPrice: 16.00, consumed: 0, description: "Fresh Washington Dungeness crab, warm yuzu-brown butter, and local sea beans." },
  { id: 'canlis-6', name: 'Canlis Soufflé', category: 'Snack', stock: 40, unit: 'Servings', volumePerUnit: 0, minStock: 10, price: 24, originalPrice: 6.00, consumed: 0, description: "Grand Marnier soufflé baked to order, served with warm vanilla crème anglaise." },
  { id: 'canlis-7', name: 'Quilceda Creek Cab glass', category: 'Wine', stock: 12, unit: 'Glass', volumePerUnit: 150, minStock: 6, price: 55, originalPrice: 11.55, consumed: 0, description: "Columbia Valley Cabernet Sauvignon. Magnificent dark fruit concentration with anise and polished oak." },
  { id: 'canlis-8', name: 'Leonetti Cellar Merlot Bottle', category: 'Wine', stock: 15, unit: 'Bottles', volumePerUnit: 750, minStock: 3, price: 240, originalPrice: 50.40, consumed: 0, description: "Walla Walla Valley Merlot. Rich black cherry, cocoa, and sweet toasted American oak aromas." },
  { id: 'canlis-9', name: 'Beaux Frères Pinot Noir glass', category: 'Wine', stock: 18, unit: 'Glass', volumePerUnit: 150, minStock: 6, price: 35, originalPrice: 7.35, consumed: 0, description: "Willamette Valley Pinot Noir. Nuances of forest floor, wild blackberry, and lavender spices." },
  { id: 'canlis-10', name: 'Krug Grande Cuvée glass', category: 'Wine', stock: 10, unit: 'Glass', volumePerUnit: 150, minStock: 3, price: 65, originalPrice: 13.65, consumed: 0, description: "Exceptional luxury Champagne showing notes of toasted brioche, dried fruit, and hazelnut." },
  { id: 'canlis-11', name: 'Lake Union Sunset', category: 'Cocktail', stock: 40, unit: 'Glass', volumePerUnit: 120, minStock: 10, price: 22, originalPrice: 4.62, consumed: 0, description: "Westland Single Malt, dry vermouth, apricot liqueur, and fresh lemon essence. Inspired by Seattle's sunsets." }
];

export const CANLIS_TRANSACTIONS: RetailTransaction[] = [
  {
    id: 'TX-CAN001',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    tableNumber: '4',
    items: [
      { id: 'it-can1', name: 'Wagyu Beef Filet', quantity: 2, priceAtOrder: 95, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-can2', name: 'Canlis Salad', quantity: 2, priceAtOrder: 26, status: 'Served', prepType: 'Complex', style: 'Snack' },
      { id: 'it-can3', name: 'Leonetti Cellar Merlot Bottle', quantity: 1, priceAtOrder: 240, status: 'Served', prepType: 'Pour', style: 'Wine' }
    ],
    subtotal: 482,
    tax: 43.38,
    gratuity: 96.40,
    total: 621.78,
    paymentMethod: 'Credit & Debit Card',
    guestName: 'William S. Gates'
  },
  {
    id: 'TX-CAN002',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    tableNumber: 'V2',
    items: [
      { id: 'it-can4', name: 'Dry-Aged Duck', quantity: 2, priceAtOrder: 72, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-can5', name: 'Dungeness Crab', quantity: 1, priceAtOrder: 52, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-can6', name: 'Quilceda Creek Cab glass', quantity: 3, priceAtOrder: 55, status: 'Served', prepType: 'Pour', style: 'Wine' },
      { id: 'it-can7', name: 'Canlis Soufflé', quantity: 2, priceAtOrder: 24, status: 'Served', prepType: 'Complex', style: 'Snack' }
    ],
    subtotal: 411,
    tax: 36.99,
    gratuity: 82.20,
    total: 530.19,
    paymentMethod: 'Stripe',
    guestName: 'Jeffery B.'
  },
  {
    id: 'TX-CAN003',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    tableNumber: 'Bar',
    items: [
      { id: 'it-can8', name: 'Lake Union Sunset', quantity: 4, priceAtOrder: 22, status: 'Served', prepType: 'Mix', style: 'Cocktail' },
      { id: 'it-can9', name: 'Twice-Baked Potato', quantity: 2, priceAtOrder: 18, status: 'Served', prepType: 'Complex', style: 'Snack' }
    ],
    subtotal: 124,
    tax: 11.16,
    gratuity: 24.80,
    total: 159.96,
    paymentMethod: 'Apple Pay'
  }
];

export const FRENCH_LAUNDRY_INVENTORY: InventoryItem[] = [
  { id: 'tfl-1', name: 'Oysters and Pearls', category: 'Dinner', stock: 40, unit: 'Portions', volumePerUnit: 0, minStock: 10, price: 110, originalPrice: 35.00, consumed: 0, description: "Classic Thomas Keller dish: sabayon of pearl tapioca with gently poached Island Creek oysters and premium Regiis Ova caviar." },
  { id: 'tfl-2', name: 'Poached Maine Lobster', category: 'Dinner', stock: 35, unit: 'Portions', volumePerUnit: 0, minStock: 10, price: 125, originalPrice: 38.00, consumed: 0, description: "Sweet butter-poached Maine lobster claw, creamy lobster broth, garden baby leeks, and glazed carrot curls." },
  { id: 'tfl-3', name: 'Elysian Fields Farm Lamb', category: 'Dinner', stock: 30, unit: 'Portions', volumePerUnit: 0, minStock: 8, price: 95, originalPrice: 29.00, consumed: 0, description: "Herb-roasted loin of Elysian Fields farm lamb, caramelised fennel purée, and savory lamb reduction." },
  { id: 'tfl-4', name: 'Regiis Ova Caviar Tasting', category: 'Dinner', stock: 20, unit: 'Portions', volumePerUnit: 0, minStock: 5, price: 150, originalPrice: 50.00, consumed: 0, description: "Bespoke selection of three premier sturgeon caviars with warm buckwheat blinis and classic accoutrements." },
  { id: 'tfl-5', name: 'Truffle Mac and Cheese', category: 'Snack', stock: 30, unit: 'Servings', volumePerUnit: 0, minStock: 6, price: 42, originalPrice: 12.00, consumed: 0, description: "Hand-rolled macaroni, rich Parmigiano-Reggiano cream sauce, baked with sweet butter and fresh shaved black winter truffles." },
  { id: 'tfl-6', name: 'Screaming Eagle glass', category: 'Wine', stock: 5, unit: 'Glass', volumePerUnit: 150, minStock: 2, price: 350, originalPrice: 73.50, consumed: 0, description: "Ultra-rare pour of Napa Valley's crown cult Cabernet. Masterfully layered with cassis, violets, and graphite." },
  { id: 'tfl-7', name: 'Harlan Estate Bottle', category: 'Wine', stock: 8, unit: 'Bottles', volumePerUnit: 750, minStock: 2, price: 1800, originalPrice: 378.00, consumed: 0, description: "Napa Valley cult red blend. Profound depth of blackberry, forest floor, and espresso with endless, silky tannins." },
  { id: 'tfl-8', name: 'DRC Romanée-St-Vivant Bottle', category: 'Wine', stock: 4, unit: 'Bottles', volumePerUnit: 750, minStock: 1, price: 2500, originalPrice: 525.00, consumed: 0, description: "The pinnacle of Burgundy. Romanée-Saint-Vivant Grand Cru, showcasing supreme floral elegance and refined spice." },
  { id: 'tfl-9', name: 'Krug Clos d\'Ambonnay glass', category: 'Wine', stock: 6, unit: 'Glass', volumePerUnit: 150, minStock: 1, price: 450, originalPrice: 94.50, consumed: 0, description: "Single-vineyard Blanc de Noirs Champagne. Rich, robust, and exceptionally rare with structural perfection." },
  { id: 'tfl-10', name: 'Yountville Sour', category: 'Cocktail', stock: 45, unit: 'Glass', volumePerUnit: 125, minStock: 10, price: 24, originalPrice: 5.04, consumed: 0, description: "Premium Napa brandy, fresh lemon juice, demerara, floated with a layer of local Napa Cabernet Sauvignon." }
];

export const FRENCH_LAUNDRY_TRANSACTIONS: RetailTransaction[] = [
  {
    id: 'TX-TFL001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    tableNumber: 't7',
    items: [
      { id: 'it-tfl1', name: 'Oysters and Pearls', quantity: 2, priceAtOrder: 110, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-tfl2', name: 'Poached Maine Lobster', quantity: 2, priceAtOrder: 125, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-tfl3', name: 'Screaming Eagle glass', quantity: 4, priceAtOrder: 350, status: 'Served', prepType: 'Pour', style: 'Wine' }
    ],
    subtotal: 1870,
    tax: 168.30,
    gratuity: 374.00,
    total: 2412.30,
    paymentMethod: 'Credit & Debit Card',
    guestName: 'Tim C.'
  },
  {
    id: 'TX-TFL002',
    timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    tableNumber: 't8',
    items: [
      { id: 'it-tfl4', name: 'Regiis Ova Caviar Tasting', quantity: 1, priceAtOrder: 150, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-tfl5', name: 'Elysian Fields Farm Lamb', quantity: 2, priceAtOrder: 95, status: 'Served', prepType: 'Complex', style: 'Dinner' },
      { id: 'it-tfl6', name: 'DRC Romanée-St-Vivant Bottle', quantity: 1, priceAtOrder: 2500, status: 'Served', prepType: 'Pour', style: 'Wine' }
    ],
    subtotal: 2840,
    tax: 255.60,
    gratuity: 568.00,
    total: 3663.60,
    paymentMethod: 'Bank',
    guestName: 'Marc A.'
  },
  {
    id: 'TX-TFL003',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    tableNumber: 'Bar',
    items: [
      { id: 'it-tfl7', name: 'Yountville Sour', quantity: 3, priceAtOrder: 24, status: 'Served', prepType: 'Mix', style: 'Cocktail' },
      { id: 'it-tfl8', name: 'Truffle Mac and Cheese', quantity: 2, priceAtOrder: 42, status: 'Served', prepType: 'Complex', style: 'Snack' }
    ],
    subtotal: 156,
    tax: 14.04,
    gratuity: 31.20,
    total: 201.24,
    paymentMethod: 'Apple Pay'
  }
];

